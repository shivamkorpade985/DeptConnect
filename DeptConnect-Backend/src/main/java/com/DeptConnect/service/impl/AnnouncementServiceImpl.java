package com.DeptConnect.service.impl;

import com.DeptConnect.enums.TargetRole;
import com.DeptConnect.enums.UserRole;
import com.DeptConnect.exceptions.AccessDeniedException;
import com.DeptConnect.exceptions.ResourceNotFoundException;
import com.DeptConnect.exceptions.UserException;
import com.DeptConnect.models.Announcement;
import com.DeptConnect.models.User;
import com.DeptConnect.payload.dto.AnnouncementDto;
import com.DeptConnect.payload.request.AnnouncementRequest;
import com.DeptConnect.payload.response.PageResponse;
import com.DeptConnect.repository.AnnouncementRepository;
import com.DeptConnect.repository.UserRepository;
import com.DeptConnect.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository; //user final so that above constructor annotation will initialize and inject this dependency


    //Convert Announcement to Dto to perform below functionalities

    AnnouncementDto toDto(Announcement a){
        AnnouncementDto dto = new AnnouncementDto();

        dto.setId(a.getId());
        dto.setTitle(a.getTitle());
        dto.setBody(a.getBody());
        dto.setTargetRole(a.getTargetRole());
        dto.setCategory(a.getCategory());
        dto.setCreatedByFullName(a.getCreatedBy() != null ? a.getCreatedBy().getFullName() : null);
        dto.setOwnerEmail(a.getCreatedBy() != null ? a.getCreatedBy().getEmail() : null);
        dto.setCreatedAt(a.getCreatedAt());
        dto.setUpdatedAt(a.getUpdatedAt());

        return dto;

    }
    @Override
    @Transactional
    public AnnouncementDto createAnnouncement(String currentUserEmail, AnnouncementRequest req) {
        User user = userRepository.findByEmail(currentUserEmail);

        Announcement a = new Announcement();
        AnnouncementDto dto = new AnnouncementDto();

        a.setTitle(req.getTitle());
        a.setBody(req.getBody());
        a.setCategory(req.getCategory());
        
        if(user.getRole() == UserRole.ROLE_FACULTY && req.getTargetRole() == null){
            a.setTargetRole(TargetRole.ROLE_STUDENT);
        }else{
            a.setTargetRole(req.getTargetRole());
        } //Check here while choosing target for HOD role

        a.setCreatedBy(user);//Here in api response it will give user name but stores it's id in the db
        a.setCreatedAt(LocalDateTime.now());
        a.setUpdatedAt(LocalDateTime.now());

        Announcement saved = announcementRepository.save(a);
//        AnnouncementDto dto = new AnnouncementDto();

        dto.setCreatedByFullName(a.getCreatedBy().getFullName());
        return toDto(saved);
    }

    @Override
    @Transactional
    public AnnouncementDto updateAnnouncement(Long id, String currentUserEmail, AnnouncementRequest req) throws UserException, AccessDeniedException {
        Announcement a = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));


        // Fetch currently logged-in user
        User currentUser = userRepository.findByEmail(currentUserEmail);
        if (currentUser == null) {
            throw new UserException("User not found");
        }

        // Authorization check
        boolean isHOD = currentUser.getRole() == UserRole.ROLE_HOD;
        boolean isCreator = a.getCreatedBy() != null &&
                a.getCreatedBy().getId().equals(currentUser.getId());

        if (!isHOD && !isCreator) {
            throw new AccessDeniedException("You are not allowed to update this announcement");
        }

        a.setTitle(req.getTitle());
        a.setBody(req.getBody());
        if (req.getCategory() != null) {
            a.setCategory(req.getCategory());
        }
        
        if (req.getTargetRole() != null) {
            a.setTargetRole(req.getTargetRole());
        } else {
            if (currentUser.getRole() == UserRole.ROLE_FACULTY) {
                a.setTargetRole(TargetRole.ROLE_STUDENT);
            } else {
                a.setTargetRole(TargetRole.ALL);
            }
        }
        
        a.setUpdatedAt(LocalDateTime.now());
        Announcement saved = announcementRepository.save(a);

        return toDto(saved);
    }

    @Override
    @Transactional
    public void deleteAnnouncement(Long id, String currentUserEmail) throws UserException, AccessDeniedException {

        Announcement a = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));


        // Fetch currently logged-in user
        User currentUser = userRepository.findByEmail(currentUserEmail);
        if (currentUser == null) {
            throw new UserException("User not found");
        }

        // Authorization check
        boolean isHOD = currentUser.getRole() == UserRole.ROLE_HOD;
        boolean isCreator = a.getCreatedBy() != null &&
                a.getCreatedBy().getId().equals(currentUser.getId());

        if (!isHOD && !isCreator) {
            throw new AccessDeniedException("You are not allowed to delete this announcement");
        }
        announcementRepository.deleteById(id);

    }

    @Override
    public AnnouncementDto getAnnouncement(Long id) {
        //Here getting by Id
        Announcement a = announcementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Announcement not found"));

        return toDto(a);
    } //Not needed but initially i have created this one so that i have kept here

    @Override
    public List<AnnouncementDto> getAllAnnouncements() {
//        List<Announcement> announcementList = announcementRepository.findAll();

        return announcementRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    } //May be this also not using for incoming request

    @Override
    public AnnouncementDto getAnnouncementForUser(Long id, Authentication auth) throws AccessDeniedException, ResourceNotFoundException, UserException {
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement not found"));

        User user = userRepository.findByEmail(auth.getName());
        if (user == null) {
            throw new UserException("User not found");
        }

        boolean isHOD = user.getRole() == UserRole.ROLE_HOD;
        boolean isAll = announcement.getTargetRole() == TargetRole.ALL || announcement.getTargetRole() == null;
        boolean isRoleMatch = announcement.getTargetRole() != null && announcement.getTargetRole().name().equals(user.getRole().name());
        boolean isCreator = announcement.getCreatedBy() != null && announcement.getCreatedBy().getId().equals(user.getId());

        if (!isHOD && !isAll && !isRoleMatch && !isCreator) {
            throw new AccessDeniedException("You are not allowed to view this announcement");
        }


        return toDto(announcement);
    } //This Method handles single announcement

    @Override
    public PageResponse<AnnouncementDto> getAnnouncementsForUser(
            Authentication auth,
            String category,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) throws UserException {
        User user = userRepository.findByEmail(auth.getName());
        if (user == null) {
            throw new UserException("User not found");
        }

        String userRoleName = user.getRole().name();

        //  PAGINATION CHANGE
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page,size,sort);

        // roles allowed to see
        List<TargetRole> allowedRoles;
        if (user.getRole() == UserRole.ROLE_HOD) {
            allowedRoles = List.of(TargetRole.ALL, TargetRole.ROLE_STUDENT, TargetRole.ROLE_FACULTY, TargetRole.ROLE_HOD);
        } else {
            allowedRoles = List.of(TargetRole.ALL, TargetRole.valueOf(user.getRole().name()));
        }

        Page<Announcement> announcementPage;
        if (category != null && !category.trim().isEmpty()) {
            com.DeptConnect.enums.AnnouncementCategory enumCat = com.DeptConnect.enums.AnnouncementCategory.valueOf(category.toUpperCase());
            announcementPage = announcementRepository.findByTargetRoleInOrCreatedByAndCategory(allowedRoles, user, enumCat, pageable);
        } else {
            announcementPage = announcementRepository.findByTargetRoleInOrCreatedBy(allowedRoles, user, pageable);
        }

        List<AnnouncementDto> dtos = announcementPage
                .getContent()
                .stream()
                .map(this::toDto)
                .toList();

        return new PageResponse<>(
                dtos,
                announcementPage.getNumber(),
                announcementPage.getSize(),
                announcementPage.getTotalElements(),
                announcementPage.getTotalPages(),
                announcementPage.isLast()
        );

    }
} //This will handle more than one announcement
