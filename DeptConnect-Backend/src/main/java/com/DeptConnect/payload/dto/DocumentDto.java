package com.DeptConnect.payload.dto;

import com.DeptConnect.enums.TargetRole;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DocumentDto {

    private Long id;


    private String title;


    private String description;


    // This will store the Cloudinary file URL
    private String fileUrl;


    private String uploadedByFullName;
    private String ownerEmail;

    private LocalDateTime uploadedAt;

    private LocalDateTime editedAt;

    private TargetRole targetRole;

    private Long fileSize;      // numeric, exact bytes
    private String readableSize; // friendly display

    private com.DeptConnect.enums.DocumentCategory category;

}
