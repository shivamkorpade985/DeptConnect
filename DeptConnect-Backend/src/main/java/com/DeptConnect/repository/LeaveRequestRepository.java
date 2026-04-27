package com.DeptConnect.repository;

import com.DeptConnect.enums.LeaveStatus;
import com.DeptConnect.models.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest,Long> {


    Page<LeaveRequest> findByRequesterId(Long userId, Pageable pageable);

    Page<LeaveRequest> findByApproverIdAndStatus(Long approverId, LeaveStatus status, Pageable pageable);
}
