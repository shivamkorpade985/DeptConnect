package com.DeptConnect.service;

import com.DeptConnect.exceptions.AccessDeniedException;
import com.DeptConnect.exceptions.ResourceNotFoundException;
import com.DeptConnect.exceptions.UserException;
import com.DeptConnect.payload.dto.AnnouncementDto;
import com.DeptConnect.payload.request.AnnouncementRequest;
import com.DeptConnect.payload.response.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;

import java.util.List;

public interface AnnouncementService {

    AnnouncementDto createAnnouncement(String currentUserEmail, AnnouncementRequest req);


    AnnouncementDto updateAnnouncement(Long id,String currentUserEmail,AnnouncementRequest req) throws UserException, AccessDeniedException;
    void deleteAnnouncement(Long id,String currentUserEmail) throws UserException, AccessDeniedException;

    AnnouncementDto getAnnouncement(Long id);

    List<AnnouncementDto> getAllAnnouncements();

    public AnnouncementDto getAnnouncementForUser(Long id, Authentication auth) throws AccessDeniedException, ResourceNotFoundException, UserException;
    PageResponse<AnnouncementDto> getAnnouncementsForUser(
            Authentication auth,
            String category,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) throws UserException;
}
