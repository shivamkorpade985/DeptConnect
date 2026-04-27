package com.DeptConnect.service;

import com.DeptConnect.exceptions.AccessDeniedException;
import com.DeptConnect.exceptions.UserException;
import com.DeptConnect.models.User;
import com.DeptConnect.payload.dto.CreateLeaveRequestDto;
import com.DeptConnect.payload.dto.LeaveResponseDto;
import com.DeptConnect.payload.response.PageResponse;

import java.util.List;

public interface LeaveRequestService {

    public LeaveResponseDto createLeave(CreateLeaveRequestDto dto, Long requesterId) throws UserException, AccessDeniedException;

    public LeaveResponseDto approveLeave(Long leaveId, Long approverId) throws AccessDeniedException;

    public LeaveResponseDto rejectLeave(Long leaveId, Long approverId, String reason) throws AccessDeniedException;

    PageResponse<LeaveResponseDto> getMyLeaves(
            Long userId,
            int page,
            int size,
            String sortBy,
            String sortDir
    );

    PageResponse<LeaveResponseDto> getPendingForApprover(
            Long approverId,
            int page,
            int size,
            String sortBy,
            String sortDir
    );

}
