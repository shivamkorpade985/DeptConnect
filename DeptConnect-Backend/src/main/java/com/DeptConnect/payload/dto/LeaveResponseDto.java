package com.DeptConnect.payload.dto;

import com.DeptConnect.enums.LeaveCategory;
import com.DeptConnect.enums.LeaveStatus;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LeaveResponseDto {

    private Long id;
    private Long requesterId;
    private String requesterName;

    private Long approverId;
    private String approverName;

    private LeaveCategory category;
    private String reason;

    private LocalDate fromDate;
    private LocalDate toDate;

    private LeaveStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;

}
