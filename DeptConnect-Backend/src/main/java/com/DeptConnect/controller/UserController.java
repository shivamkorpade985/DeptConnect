package com.DeptConnect.controller;

import com.DeptConnect.enums.UserRole;
import com.DeptConnect.models.User;
import com.DeptConnect.payload.dto.UserDto;
import com.DeptConnect.repository.UserRepository;
import com.DeptConnect.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    // GET /api/users/faculties - returns list of faculties (id + fullName)
    @GetMapping("/faculties")
    public List<UserDto> getFaculties() {
        List<User> faculties = userRepository.findByRole(UserRole.ROLE_FACULTY);
        return faculties.stream()
                .map(UserMapper::toDto)
                .collect(Collectors.toList());
    }
}