package com.DeptConnect.controller;

import com.DeptConnect.exceptions.AccessDeniedException;
import com.DeptConnect.exceptions.ResourceNotFoundException;
import com.DeptConnect.exceptions.UserException;
import com.DeptConnect.models.User;
import com.DeptConnect.payload.dto.AnnouncementDto;
import com.DeptConnect.payload.request.AnnouncementRequest;
import com.DeptConnect.payload.response.PageResponse;
import com.DeptConnect.repository.UserRepository;
import com.DeptConnect.service.AnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.aspectj.weaver.ast.Not;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final UserRepository userRepository;
    private final AnnouncementService announcementService;

    // 1️⃣ Create Announcement (Only HOD or Faculty)

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('HOD','FACULTY')")
    public ResponseEntity<AnnouncementDto> create(@Valid @RequestBody AnnouncementRequest req,Authentication auth){
    String email = auth.getName();
    AnnouncementDto dto = announcementService.createAnnouncement(email,req);
    return ResponseEntity.ok(dto);
    }


    // 2️⃣ Get all announcements (filtered by role)
    @GetMapping()
    @PreAuthorize("hasAnyRole('STUDENT','FACULTY','HOD')")
    public ResponseEntity<PageResponse<AnnouncementDto>> getAll(
            Authentication auth,
            @RequestParam(required = false) String category,
            //PAGINATION CHANGE
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
            ) throws UserException {
        PageResponse<AnnouncementDto> response =
                announcementService.getAnnouncementsForUser(auth,category,page,size,sortBy,sortDir);
        return ResponseEntity.ok(response);
    } //This  returns announcements filtered by the logged-in user’s role.

    // Get all — for all roles
  /*

  @GetMapping("/getAll")
    public ResponseEntity<List<AnnouncementDto>> getAll() {
        return ResponseEntity.ok(announcementService.getAllAnnouncements());
    }

    */
    /* Not needed beacuase, It fetches all announcements from the database without role filtering.
    This would expose private announcements (e.g. faculty-only) to everyone. */

    // 3️⃣ Get announcement by ID (only if visible to user)
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('STUDENT','FACULTY','HOD')")
    public ResponseEntity<AnnouncementDto> getById(@PathVariable Long id, Authentication auth) throws AccessDeniedException, UserException, ResourceNotFoundException {
        AnnouncementDto dto = announcementService.getAnnouncementForUser(id, auth);
        return ResponseEntity.ok(dto);
    }


    // 4️⃣ Update Announcement (Only HOD or Faculty who created it)
    @PutMapping("/update/{id}")
    @PreAuthorize("hasAnyRole('HOD','FACULTY')")
    public ResponseEntity<AnnouncementDto> update(@PathVariable Long id ,@Valid @RequestBody AnnouncementRequest req,Authentication auth) throws UserException,AccessDeniedException {
        String email = auth.getName();
        AnnouncementDto dto =  announcementService.updateAnnouncement(id,email,req);
        return ResponseEntity.ok(dto);

    }

    // 5️⃣ Delete Announcement ( HOD and faculty)
    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasAnyRole('HOD','FACULTY')")
    public ResponseEntity<String> delete(@PathVariable Long id,Authentication auth) throws AccessDeniedException, UserException {

        String email = auth.getName();
        announcementService.deleteAnnouncement(id,email);
        return ResponseEntity.ok("Announcement deleted successfully");
    }






}
