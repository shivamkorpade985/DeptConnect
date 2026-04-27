package com.DeptConnect.payload.response;

import com.DeptConnect.models.User;
import com.DeptConnect.payload.dto.UserDto;
import lombok.Data;

@Data
public class AuthResponse {

    private String jwt;
    private String message;

    private UserDto user;

}