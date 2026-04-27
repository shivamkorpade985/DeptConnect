package com.DeptConnect.controller;

import com.DeptConnect.exceptions.AccessDeniedException;
import com.DeptConnect.exceptions.UserException;
import com.DeptConnect.models.User;
import com.DeptConnect.payload.dto.CreateLeaveRequestDto;
import com.DeptConnect.payload.dto.LeaveResponseDto;
import com.DeptConnect.payload.response.PageResponse;
import com.DeptConnect.repository.LeaveRequestRepository;
import com.DeptConnect.repository.UserRepository;
import com.DeptConnect.service.LeaveRequestService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;
    private final UserRepository userRepository;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('STUDENT','FACULTY')")
    public ResponseEntity<LeaveResponseDto> createLeave(@Valid @RequestBody CreateLeaveRequestDto createLeaveRequestDto, Authentication authentication) throws UserException, AccessDeniedException {
        //Fetch current user email id
        String email = authentication.getName();
        User user = userRepository.findByEmail(email);
        if (user == null) {
                throw new UserException("Authenticated user not found");
        }

        LeaveResponseDto resp = leaveRequestService.createLeave(createLeaveRequestDto,user.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    //Here getting all leaves with respect to that user have requested

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT','FACULTY','HOD')")
    public ResponseEntity<PageResponse<LeaveResponseDto>> myLeaves(
            Authentication authentication,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) throws UserException {
        String email = authentication.getName();
        User currentUser = userRepository.findByEmail(email);

        if(currentUser == null){
            throw new UserException("User not found");
        }

        PageResponse<LeaveResponseDto> leaves =
                leaveRequestService.getMyLeaves(currentUser.getId(),page,size,sortBy,sortDir);

        return ResponseEntity.ok(leaves);
    }

    // Get pending requests for approver (faculty / hod)
    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('HOD','FACULTY')")
    public ResponseEntity<PageResponse<LeaveResponseDto>> pendingForApprover(
            Authentication authentication,

            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) throws UserException {

        String email = authentication.getName();
        User approver = userRepository.findByEmail(email);

        if(approver == null){
            throw new UserException("User not found");
        }

        PageResponse<LeaveResponseDto> pending =
                leaveRequestService.getPendingForApprover(approver.getId(),page,size,sortBy,sortDir);

        return ResponseEntity.ok(pending);

    }

    //Approve
    @PutMapping("/{id}/approve")
    public ResponseEntity<LeaveResponseDto> approveLeave(@PathVariable Long id,Authentication authentication) throws UserException, AccessDeniedException {

        String email = authentication.getName();
        User approver  = userRepository.findByEmail(email);
        if(approver  == null){
            throw new UserException("User not found");
        }

        LeaveResponseDto resp = leaveRequestService.approveLeave(id,approver.getId());
        return ResponseEntity.ok(resp);

    }

    // Reject with optional note
    @PutMapping("/{id}/reject")
    public ResponseEntity<LeaveResponseDto> reject(@PathVariable("id") Long id,
                                                   @RequestBody(required = false) Map<String, String> body,
                                                   Authentication authentication) throws UserException, AccessDeniedException {

        String email = authentication.getName();
        User approver  = userRepository.findByEmail(email);
        if(approver  == null){
            throw new UserException("User not found");
        }

        String note = body != null ? body.get("note") : null;
       LeaveResponseDto resp = leaveRequestService.rejectLeave(id,approver.getId(),note);
        return ResponseEntity.ok(resp);
    }


}
