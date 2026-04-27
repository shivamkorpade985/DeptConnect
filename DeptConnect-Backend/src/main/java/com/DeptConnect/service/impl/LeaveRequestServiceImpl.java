package com.DeptConnect.service.impl;

import com.DeptConnect.enums.LeaveStatus;
import com.DeptConnect.enums.UserRole;
import com.DeptConnect.exceptions.AccessDeniedException;
import com.DeptConnect.exceptions.UserException;
import com.DeptConnect.models.LeaveRequest;
import com.DeptConnect.models.User;
import com.DeptConnect.payload.dto.CreateLeaveRequestDto;
import com.DeptConnect.payload.dto.LeaveResponseDto;
import com.DeptConnect.payload.response.PageResponse;
import com.DeptConnect.repository.LeaveRequestRepository;
import com.DeptConnect.repository.UserRepository;
import com.DeptConnect.service.LeaveRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LeaveRequestServiceImpl implements LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;


    private LeaveResponseDto toDto(LeaveRequest lr) {
        LeaveResponseDto dto = new LeaveResponseDto();

        dto.setId(lr.getId());
        dto.setCategory(lr.getCategory());
        dto.setReason(lr.getReason());
        dto.setFromDate(lr.getFromDate());
        dto.setToDate(lr.getToDate());
        dto.setStatus(lr.getStatus());
        dto.setCreatedAt(lr.getCreatedAt());
        dto.setApprovedAt(lr.getApprovedAt());

        // requester details
        if (lr.getRequester() != null) {
            dto.setRequesterId(lr.getRequester().getId());
            dto.setRequesterName(lr.getRequester().getFullName());
        }

        // approver details
        if (lr.getApprover() != null) {
            dto.setApproverId(lr.getApprover().getId());
            dto.setApproverName(lr.getApprover().getFullName());
        }

        return dto;
    }


    @Override
    public LeaveResponseDto createLeave(CreateLeaveRequestDto requestDto, Long requesterId) throws UserException, AccessDeniedException {

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new UserException("User not found"));

       if((requester.getRole() != UserRole.ROLE_STUDENT) && (requester.getRole() != UserRole.ROLE_FACULTY)){
           throw new AccessDeniedException("You are not allowed to make leave request");
       }

       if(requestDto.getFromDate().isAfter(requestDto.getToDate())){
           throw new IllegalArgumentException("From date must be less than To Date");
       }


       //Decide who is going to approve this request
        User approver = determineApproverFor(requester); // method described below

        LeaveRequest lr = new LeaveRequest();
        lr.setRequester(requester);
        lr.setApprover(approver);
        lr.setCategory(requestDto.getCategory());
        lr.setReason(requestDto.getReason());
        lr.setFromDate(requestDto.getFromDate());
        lr.setToDate(requestDto.getToDate());
        lr.setStatus(LeaveStatus.PENDING);
        lr.setCreatedAt(LocalDateTime.now());

        LeaveRequest savedLeave = leaveRequestRepository.save(lr);


        return toDto(savedLeave);
    }
    private User determineApproverFor(User requester) {

        if (requester.getRole() == UserRole.ROLE_STUDENT) {
            //  Assign approver as student's class teacher

            if (requester.getClassTeacher() == null) {
                throw new IllegalStateException("Student has no assigned class teacher");
            }

            return requester.getClassTeacher();
        }  else if (requester.getRole() == UserRole.ROLE_FACULTY) {
            //  Faculty's approver = the single HOD in the system
            return (User) userRepository.findFirstByRole(UserRole.ROLE_HOD)
                    .orElseThrow(() -> new IllegalStateException("No HOD found in the system"));
        }
        else {
            throw new IllegalStateException("Only students and faculty can request leave");
        }
    }


    @Override
    public LeaveResponseDto approveLeave(Long leaveId, Long approverId) throws AccessDeniedException {
        LeaveRequest lr = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found"));

        // Only pending requests can be approved
        if (lr.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalStateException("Leave request already processed");
        }

        if(lr.getApprover() == null || ! lr.getApprover().getId().equals(approverId)){
            throw new AccessDeniedException("You are not allowed to approve this leave request");
        }
        if ( !lr.getApprover().getId().equals(approverId)) {
            String allowedBy = lr.getApprover().getFullName();
            String message = "This leave can only be approved by " + allowedBy;
            throw new AccessDeniedException(message);
        }

        lr.setStatus(LeaveStatus.APPROVED);
        lr.setApprovedAt(LocalDateTime.now());

        LeaveRequest savedLeave = leaveRequestRepository.save(lr);

        return toDto(savedLeave);
    }

    @Override
    public LeaveResponseDto rejectLeave(Long leaveId, Long approverId, String reason) throws AccessDeniedException {
        LeaveRequest lr = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found"));

        if (lr.getStatus() != LeaveStatus.PENDING){
            throw new IllegalStateException("Leave already processed");
        }

        if (lr.getApprover() == null || !lr.getApprover().getId().equals(approverId)){
            throw new AccessDeniedException("U are now allowed to reject leave request");
        }

        lr.setStatus(LeaveStatus.REJECTED);
        lr.setApprovedAt(LocalDateTime.now());

        // optional: you can store the rejection reason somewhere; for now we keep it in reason with note
        if (reason != null && !reason.isBlank()) {
            lr.setReason(lr.getReason() + "\n\n[Rejection note by approver]: " + reason);
        }

        LeaveRequest saved = leaveRequestRepository.save(lr);
        return toDto(saved);
    }

    @Override
    public PageResponse<LeaveResponseDto> getMyLeaves(
            Long userId,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page,size,sort);

        Page<LeaveRequest> leavePage =
                leaveRequestRepository.findByRequesterId(userId,pageable);

        List<LeaveResponseDto> dtos =
                leavePage.getContent().stream().map(this::toDto).toList();

        return new PageResponse<>(
                dtos,
                leavePage.getNumber(),
                leavePage.getSize(),
                leavePage.getTotalElements(),
                leavePage.getTotalPages(),
                leavePage.isLast()
        );
    }

    @Override
    public PageResponse<LeaveResponseDto> getPendingForApprover(
            Long approverId,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page,size,sort);

        Page<LeaveRequest> pendingPage =
                leaveRequestRepository.findByApproverIdAndStatus(
                        approverId,
                        LeaveStatus.PENDING,
                        pageable
                );

        List<LeaveResponseDto> dtos =
                pendingPage.getContent().stream().map(this::toDto).toList();

        return new PageResponse<>(
                dtos,
                pendingPage.getNumber(),
                pendingPage.getSize(),
                pendingPage.getTotalElements(),
                pendingPage.getTotalPages(),
                pendingPage.isLast()
        );
    }
}
