package com.DeptConnect.controller;

import com.DeptConnect.payload.dto.UserDto;
import com.DeptConnect.payload.response.AuthResponse;
import com.DeptConnect.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // http://localhost:5000/auth/signup
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signupHandler(@RequestBody UserDto userDto) {
        return ResponseEntity.ok(authService.signup(userDto));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> loginHandler(@RequestBody UserDto userDto) {
        return ResponseEntity.ok(authService.login(userDto));
    }
}