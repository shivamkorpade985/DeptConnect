package com.DeptConnect.payload.dto;

import com.DeptConnect.enums.UserRole;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDto {

    private Long id;

    private String fullName;

    private String email;

    private UserRole role;

    private String password;

    // For signup only: frontend sends classTeacherId for students
    private Long classTeacherId;

    // For responses: show class teacher name
    private String classTeacherName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;

}