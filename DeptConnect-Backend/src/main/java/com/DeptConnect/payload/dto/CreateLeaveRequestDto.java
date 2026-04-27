package com.DeptConnect.payload.dto;

import com.DeptConnect.enums.LeaveCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateLeaveRequestDto {

    @NotNull
    private LeaveCategory category;

    @NotBlank
    private String reason;

    @NotNull
    private LocalDate fromDate;

    @NotNull
    private LocalDate toDate;
}
