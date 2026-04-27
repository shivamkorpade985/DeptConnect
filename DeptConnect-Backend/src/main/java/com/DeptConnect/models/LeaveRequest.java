package com.DeptConnect.models;

import com.DeptConnect.enums.LeaveCategory;
import com.DeptConnect.enums.LeaveStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.core.SpringVersion;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Table(name = "leave_request")
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User requester;


    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approver_id")
    private User approver; // nullable until assigned

    @Enumerated(EnumType.STRING)
    private LeaveCategory category;

    @Column(nullable = false)
    private String reason;

    private LocalDate fromDate;

    private LocalDate toDate;

    @Enumerated(EnumType.STRING)
    private LeaveStatus status = LeaveStatus.PENDING; //default value

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime approvedAt;
}
