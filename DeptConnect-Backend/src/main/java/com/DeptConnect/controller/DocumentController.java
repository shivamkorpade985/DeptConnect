package com.DeptConnect.controller;

import com.DeptConnect.exceptions.AccessDeniedException;
import com.DeptConnect.exceptions.ResourceNotFoundException;
import com.DeptConnect.exceptions.UserException;
import com.DeptConnect.payload.dto.AnnouncementDto;
import com.DeptConnect.payload.dto.DocumentDto;
import com.DeptConnect.payload.request.DocumentRequest;
import com.DeptConnect.payload.response.PageResponse;
import com.DeptConnect.repository.UserRepository;
import com.DeptConnect.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final UserRepository userRepository;
    private final DocumentService documentService;

    // 1️⃣ Create Document (Only HOD or Faculty)

    @PostMapping( "/upload")
    @PreAuthorize("hasAnyRole('HOD','FACULTY')")
    public ResponseEntity<DocumentDto> upload(
            Authentication auth,
            @RequestPart("file") MultipartFile file,
            @RequestPart("meta") DocumentRequest request
    ) throws UserException {

        //This is only for debugging purpose
        /*System.out.println("File: " + file.getOriginalFilename());
        System.out.println("Meta: " + request);
        System.out.println("User: " + auth.getName());*/

        String currentUserEmail = auth.getName(); //getName() return username here in our case it is email
        DocumentDto dto = documentService.uploadDocument(currentUserEmail,file,request);
        return ResponseEntity.
                status(HttpStatus.CREATED)
                .body(dto);
       //Here at return statement we can use return ResponseEntity.ok(dto); "it means the request was successful"
        // it is best with the GET and PUT methods
        //but the added one means a "new resource was successfully created " it is best with the POST methods
    }

    // 2️⃣ Get all documents (filtered by role)

    @GetMapping()
    @PreAuthorize("hasAnyRole('STUDENT','FACULTY','HOD')")
    public ResponseEntity<PageResponse<DocumentDto>> getAll(

            Authentication auth,
            @RequestParam(required = false) String category,

            // PAGINATION PARAMETERS
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "uploadedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) throws UserException {
        PageResponse<DocumentDto> dtos =
                documentService.getDocumentsForUser(auth,category,page,size,sortBy,sortDir);

        return ResponseEntity.ok(dtos);
    } //This  returns documents filtered by the logged-in user’s role.

    // 3️⃣ Get document by ID (only if visible to user)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT','FACULTY','HOD')")
    public ResponseEntity<DocumentDto> getById(@PathVariable Long id, Authentication auth) throws AccessDeniedException, UserException, ResourceNotFoundException {
        DocumentDto dto = documentService.getDocumentForUser(id, auth);
        return ResponseEntity.ok(dto);
    }

    // ⃣ 4 Edit document details or replace file (only uploader or HOD)

    @PutMapping("/edit/{id}")
    @PreAuthorize("hasAnyRole('HOD','FACULTY')")
    public ResponseEntity<DocumentDto> edit(
            @PathVariable Long id,
            Authentication auth,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @Valid @RequestPart("meta") DocumentRequest meta) throws Exception, AccessDeniedException, UserException {

        String currentUserEmail = auth.getName();
        DocumentDto editedDoc = documentService.editDocument(id, currentUserEmail, file, meta);

        return ResponseEntity.ok(editedDoc);
    }

    // 5️⃣ Delete Document ( HOD and faculty)
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAnyRole('HOD','FACULTY')")
    public ResponseEntity<String> delete(@PathVariable Long id,Authentication auth) throws AccessDeniedException, UserException {

        String email = auth.getName();
        documentService.deleteDocument(id,email);
        return ResponseEntity.ok("Document deleted successfully");
    }
}
