package com.DeptConnect.service.impl;

import ch.qos.logback.classic.spi.IThrowableProxy;
import com.DeptConnect.enums.TargetRole;
import com.DeptConnect.enums.UserRole;
import com.DeptConnect.exceptions.AccessDeniedException;
import com.DeptConnect.exceptions.ResourceNotFoundException;
import com.DeptConnect.exceptions.UserException;
import com.DeptConnect.models.Document;
import com.DeptConnect.models.User;
import com.DeptConnect.payload.dto.DocumentDto;
import com.DeptConnect.payload.request.DocumentRequest;
import com.DeptConnect.payload.response.PageResponse;
import com.DeptConnect.repository.DocumentRepository;
import com.DeptConnect.repository.UserRepository;
import com.DeptConnect.service.AuthService;
import com.DeptConnect.service.DocumentService;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;
    private final AuthService authService;

    //Convert Document to Dto to perform below functionalities

    DocumentDto toDto(Document doc) {
        DocumentDto dto = new DocumentDto();
        dto.setId(doc.getId());
        dto.setTitle(doc.getTitle());
        dto.setDescription(doc.getDescription());
        dto.setFileUrl(doc.getFileUrl());
        dto.setUploadedByFullName(doc.getUploadedBy() != null ? doc.getUploadedBy().getFullName() : null);
        dto.setOwnerEmail(doc.getUploadedBy() != null ? doc.getUploadedBy().getEmail() : null);
        dto.setUploadedAt(doc.getUploadedAt());
        dto.setEditedAt(doc.getEditedAt());
        dto.setFileSize(doc.getFileSize());
        dto.setReadableSize(formatFileSize(doc.getFileSize()));
        dto.setTargetRole(doc.getTargetRole());
        dto.setCategory(doc.getCategory());

        return dto;
    }

    private String formatFileSize(Long bytes) {
        if (bytes == null) return "0 B";
        double kb = bytes / 1024.0;
        double mb = kb / 1024.0;
        if (mb >= 1) return String.format("%.2f MB", mb);
        else return String.format("%.1f KB", kb);
    }


    @Override
    public DocumentDto uploadDocument(String currentUserEmail, MultipartFile file, DocumentRequest req) throws UserException {

        // Fetch currently logged-in user
        User currentUser = userRepository.findByEmail(currentUserEmail);
        if (currentUser == null) {
            throw new UserException("User not found");
        }

        //Upload file to cloudinary
        Map uploadResult;
        try {
            uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "resource_type", "auto",
                    "folder", "deptconnect/documents"
            ));
        } catch (IOException e) {
            throw new UserException("File upload failed: " + e.getMessage());
        }

        String fileUrl = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id"); //useful for deleting file also from the cloudinary

        // File size returned in bytes by Cloudinary
        Long fileSize = uploadResult.get("bytes") != null
                ? ((Number) uploadResult.get("bytes")).longValue()
                : file.getSize(); // fallback to MultipartFile size

        Document doc = new Document();
        doc.setTitle(req.getTitle());
        doc.setDescription(req.getDescription());

        //Means if logged in user is faculty then they can upload document only for Student role
        if (currentUser.getRole() == UserRole.ROLE_FACULTY && req.getTargetRole() == null) {
            doc.setTargetRole(TargetRole.ROLE_STUDENT);
        } else {
            doc.setTargetRole(req.getTargetRole());
        }
        doc.setUploadedBy(currentUser);
        doc.setCategory(req.getCategory());
        doc.setFileUrl(fileUrl);
        doc.setPublicId(publicId);
        doc.setFileSize(fileSize);
        doc.setUploadedAt(LocalDateTime.now());

        Document saved = documentRepository.save(doc);
        return toDto(saved);
    }

    @Override
    public DocumentDto editDocument(Long id, String currentUserEmail, MultipartFile file, DocumentRequest req) throws UserException, AccessDeniedException {
        // 1️⃣ Fetch the document
        Document existingDoc = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));

        //2️⃣ Fetch currently logged-in user
        User currentUser = userRepository.findByEmail(currentUserEmail);
        if (currentUser == null) {
            throw new UserException("User not found");
        }

//        boolean isUploader = existingDoc.getUploadedBy() != null && existingDoc.getUploadedBy().getId() == currentUser.getId() ? true : false;
        // 3️⃣ Permission check → Only uploader or HOD can edit
        boolean isUploader = existingDoc.getUploadedBy() != null && existingDoc.getUploadedBy().getId().equals(currentUser.getId());

        boolean isHOD = currentUser.getRole() != null && currentUser.getRole() == UserRole.ROLE_HOD;

        if (!isUploader && !isHOD) {
            throw new AccessDeniedException("You are not allowed to edit this document");

        }

        // 4️⃣ Update metadata if provided
        if (req.getTitle() != null && !req.getTitle().isBlank()) {
            existingDoc.setTitle(req.getTitle());
        }
        if (req.getDescription() != null && !req.getDescription().isBlank()) {
            existingDoc.setDescription(req.getDescription());
        }
        if (req.getTargetRole() != null) {
            existingDoc.setTargetRole(req.getTargetRole());
        }
        if (req.getCategory() != null) {
            existingDoc.setCategory(req.getCategory());
        }

        // 5️⃣ If a new file is uploaded, replace it in Cloudinary
        if (file != null && !file.isEmpty()) {
            try {
                // Delete the old file from Cloudinary if publicId exists
                if (existingDoc.getPublicId() != null && !existingDoc.getPublicId().isEmpty()) {
                    Map destroyResult = cloudinary.uploader().destroy(existingDoc.getPublicId(), ObjectUtils.emptyMap());
                    String result = (String) destroyResult.get("result");
                    if (!"ok".equalsIgnoreCase(result)) {
                        System.err.println("⚠️ Warning: Old file could not be deleted from Cloudinary → " + result);
                    }
                }

                // Upload the new file
                Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                        "resource_type", "auto",
                        "folder", "deptconnect/documents",
                        "use_filename", true,
                        "unique_filename", true
                ));

                // Extract info from Cloudinary response
                String secureUrl = (String) uploadResult.get("secure_url");
                String newPublicId = (String) uploadResult.get("public_id");
                Long fileSize = uploadResult.get("bytes") != null
                        ? ((Number) uploadResult.get("bytes")).longValue()
                        : file.getSize();

                // Update entity with new Cloudinary details
                existingDoc.setFileUrl(secureUrl);
                existingDoc.setPublicId(newPublicId);
                existingDoc.setFileSize(fileSize);

            } catch (IOException e) {
                throw new UserException("Error while uploading new file: " + e.getMessage());
            }
        }
        // 6️⃣ Update the edited timestamp
        existingDoc.setEditedAt(LocalDateTime.now());

        // 7️⃣ Save updated document
        Document updatedDoc = documentRepository.save(existingDoc);

        // 8️⃣ Convert to DTO and return
        return toDto(updatedDoc);
    }

    @Override
    public void deleteDocument(Long id, String currentUserEmail) throws UserException, AccessDeniedException {

        Document existingDoc = documentRepository.findById(id)
                .orElseThrow(() -> new UserException("Document not found"));

        User currentUser = userRepository.findByEmail(currentUserEmail);

        if(currentUser == null){
            throw new UserException("User not Found");
        }

        boolean isUploader = existingDoc.getUploadedBy() != null && existingDoc.getUploadedBy().getId().equals(currentUser.getId());
        boolean isHOD = currentUser.getRole() != null && currentUser.getRole().equals(UserRole.ROLE_HOD);

        if(!isUploader && !isHOD) throw new AccessDeniedException("You are not allowed to delete this document");

        System.out.println("Document with Id: "+existingDoc.getId()+" deleted");


        // ✅ Cloudinary deletion
        try {
            if (existingDoc.getPublicId() != null && !existingDoc.getPublicId().isEmpty()) {
                Map destroyResult = cloudinary.uploader().destroy(existingDoc.getPublicId(), ObjectUtils.emptyMap());

                String result = (String) destroyResult.get("result");
                if (!"ok".equalsIgnoreCase(result)) {
                    System.err.println("⚠️ Cloudinary deletion warning: " + result);
                } else {
                    System.out.println("✅ File deleted from Cloudinary: " + existingDoc.getPublicId());
                }
            }
        } catch (IOException e) {
            System.err.println("❌ Cloudinary delete error: " + e.getMessage());
        }

        // ✅ Finally remove from DB
        documentRepository.delete(existingDoc);
    }

    @Override
    public DocumentDto getDocument(Long id) {
        return null;
    }
    //Not needed but initially i have created this one ,so that i have kept here

    @Override
    public List<DocumentDto> getAllDocuments() {

        return documentRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    } //This also not trigger because it will give all announcements without authorizing roles

    @Override
    public DocumentDto getDocumentForUser(Long id, Authentication auth) throws AccessDeniedException, ResourceNotFoundException, UserException {
        Document d = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

        String currentUserEmail = auth.getName();
        User currentUser = userRepository.findByEmail(currentUserEmail);
        if (currentUser == null) {
            throw new UserException("User not found");
        }

        boolean isHOD = currentUser.getRole() == UserRole.ROLE_HOD;
        boolean isAll = d.getTargetRole() == TargetRole.ALL || d.getTargetRole() == null;
        boolean isRoleMatch = d.getTargetRole() != null && d.getTargetRole().name().equals(currentUser.getRole().name());
        boolean isUploader = d.getUploadedBy() != null && d.getUploadedBy().getId().equals(currentUser.getId());

        if (!isHOD && !isAll && !isRoleMatch && !isUploader) {
            throw new AccessDeniedException("Not allowed to view this document");
        }

        return toDto(d);
    }

    @Override
    public PageResponse<DocumentDto> getDocumentsForUser(
            Authentication auth,
            String category,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) throws UserException {
        String currentUserEmail = auth.getName();

        User currentUser = userRepository.findByEmail(currentUserEmail);

        if(currentUser == null){
            throw new UserException("User not found");
        }

        // ⭐ SORTING
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page,size,sort);

        // ⭐ ALLOWED ROLES
        List<TargetRole> roles;
        if (currentUser.getRole() == UserRole.ROLE_HOD) {
            roles = List.of(TargetRole.ALL, TargetRole.ROLE_STUDENT, TargetRole.ROLE_FACULTY, TargetRole.ROLE_HOD);
        } else {
            roles = List.of(TargetRole.ALL, TargetRole.valueOf(currentUser.getRole().name()));
        }

        // ⭐ DATABASE PAGINATION
        Page<Document> documentPage;
        if (category != null && !category.trim().isEmpty()) {
            try {
                com.DeptConnect.enums.DocumentCategory enumCat = com.DeptConnect.enums.DocumentCategory.valueOf(category.toUpperCase());
                documentPage = documentRepository.findByTargetRoleInOrUploadedByAndCategory(roles, currentUser, enumCat, pageable);
            } catch (IllegalArgumentException e) {
                throw new UserException("Provided document category is not valid");
            }
        } else {
            documentPage = documentRepository.findByTargetRoleInOrUploadedBy(roles, currentUser, pageable);
        }

        List<DocumentDto> dtos =
                documentPage.getContent()
                        .stream()
                        .map(this::toDto)
                        .toList();

        return new PageResponse<>(
                dtos,
                documentPage.getNumber(),
                documentPage.getSize(),
                documentPage.getTotalElements(),
                documentPage.getTotalPages(),
                documentPage.isLast()
        );

    }
}
