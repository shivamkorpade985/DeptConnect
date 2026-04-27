package com.DeptConnect.service;

import com.DeptConnect.exceptions.UserException;
import com.DeptConnect.payload.dto.UserDto;
import com.DeptConnect.payload.response.AuthResponse;

public interface AuthService {

    AuthResponse signup(UserDto userDto) throws UserException;

    AuthResponse login(UserDto userDto) throws UserException;
}