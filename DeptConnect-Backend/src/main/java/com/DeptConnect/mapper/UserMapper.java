package com.DeptConnect.mapper;


import com.DeptConnect.models.User;
import com.DeptConnect.payload.dto.UserDto;

public class UserMapper {


    public static UserDto toDto(User savedUser) {
     UserDto userDto = new UserDto();
    userDto.setId(savedUser.getId());
    userDto.setEmail(savedUser.getEmail());
    userDto.setFullName(savedUser.getFullName());
    userDto.setRole(savedUser.getRole());
    userDto.setCreatedAt(savedUser.getCreatedAt());
    userDto.setUpdatedAt(savedUser.getUpdatedAt());
    userDto.setLastLoginAt(savedUser.getLastLoginAt());

        // class teacher mapping
        if (savedUser.getClassTeacher() != null) {
            userDto.setClassTeacherId(savedUser.getClassTeacher().getId());
            userDto.setClassTeacherName(savedUser.getClassTeacher().getFullName());
        }

     return userDto;
    }
}