package com.DeptConnect.payload.request;

import com.DeptConnect.enums.TargetRole;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DocumentRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String description;

    private TargetRole targetRole;

    @jakarta.validation.constraints.NotNull(message = "Document category is required")
    private com.DeptConnect.enums.DocumentCategory category;

    // Note: MultipartFile is handled in controller method as a separate parameter
}
