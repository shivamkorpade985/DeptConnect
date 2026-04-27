package com.DeptConnect.payload.request;

import com.DeptConnect.enums.TargetRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnnouncementRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String body;


    private TargetRole targetRole;

    @NotNull(message = "Announcement category is required")
    private com.DeptConnect.enums.AnnouncementCategory category;

}
