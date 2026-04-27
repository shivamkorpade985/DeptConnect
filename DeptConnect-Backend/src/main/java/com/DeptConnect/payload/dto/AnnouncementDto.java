package com.DeptConnect.payload.dto;

import com.DeptConnect.enums.TargetRole;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AnnouncementDto {

    private Long id;

    private String title;

    private String Body;

    private String createdByFullName; // or createdByName
    private String ownerEmail;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private TargetRole targetRole;

    private com.DeptConnect.enums.AnnouncementCategory category;
}
