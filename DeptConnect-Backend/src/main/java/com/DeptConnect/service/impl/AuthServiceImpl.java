package com.DeptConnect.service.impl;

import com.DeptConnect.configuration.JwtProvider;
import com.DeptConnect.enums.UserRole;
import com.DeptConnect.exceptions.ResourceNotFoundException;
import com.DeptConnect.exceptions.UserException;
import com.DeptConnect.mapper.UserMapper;
import com.DeptConnect.models.User;
import com.DeptConnect.payload.dto.UserDto;
import com.DeptConnect.payload.response.AuthResponse;
import com.DeptConnect.repository.UserRepository;
import com.DeptConnect.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final CustomUserImplementation customUserImplementation;

    // Simple email regex for server-side validation
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    @Override
    public AuthResponse signup(UserDto userDto) throws UserException {

        // 1. Validate email format
        if (userDto.getEmail() == null || !EMAIL_PATTERN.matcher(userDto.getEmail()).matches()) {
            throw new UserException("Invalid email format");
        }

        // 2. Check if email already taken
        User existingUser = userRepository.findByEmail(userDto.getEmail());
        if (existingUser != null) {
            throw new UserException("User already has an account with this email");
        }

        // 3. Block admin role
        if (userDto.getRole() == UserRole.ROLE_ADMIN) {
            throw new UserException("Role ADMIN is not allowed for self-registration");
        }

        // 4. Validate required fields
        if (userDto.getFullName() == null || userDto.getFullName().isBlank()) {
            throw new UserException("Full name is required");
        }
        if (userDto.getPassword() == null || userDto.getPassword().length() < 6) {
            throw new UserException("Password must be at least 6 characters");
        }
        if (userDto.getRole() == null) {
            throw new UserException("Role is required");
        }

        // 5. Build new user
        User newUser = new User();
        newUser.setFullName(userDto.getFullName());
        newUser.setEmail(userDto.getEmail());
        newUser.setPassword(passwordEncoder.encode(userDto.getPassword()));
        newUser.setRole(userDto.getRole());
        newUser.setLastLoginAt(LocalDateTime.now());
        newUser.setCreatedAt(LocalDateTime.now());

        // 6. If student, validate and set class teacher
        if (userDto.getRole() == UserRole.ROLE_STUDENT) {
            Long teacherId = userDto.getClassTeacherId();
            if (teacherId == null) {
                throw new UserException("Students must select a class teacher");
            }
            User teacher = userRepository.findById(teacherId)
                    .orElseThrow(() -> new UserException("Selected class teacher does not exist"));

            if (teacher.getRole() != UserRole.ROLE_FACULTY) {
                throw new UserException("Selected user is not a faculty member");
            }

            newUser.setClassTeacher(teacher);
        }
        newUser.setUpdatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(newUser);

        AuthResponse authResponse = new AuthResponse();
        authResponse.setMessage("Registered Successfully");
        authResponse.setUser(UserMapper.toDto(savedUser));

        return authResponse;
    }

    @Override
    public AuthResponse login(UserDto userDto) throws UserException {
        String email = userDto.getEmail();
        String password = userDto.getPassword();

        // 1. Validate email format
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new UserException("Invalid email format");
        }

        // 2. Validate password is provided
        if (password == null || password.isBlank()) {
            throw new UserException("Password is required");
        }

        // 3. Authenticate (throws specific exceptions)
        Authentication authentication = authenticate(email, password);

        // 4. Set authentication in context
        SecurityContextHolder.getContext().setAuthentication(authentication);

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        String role = authorities.iterator().next().getAuthority();

        // 5. Generate Token
        String jwt = jwtProvider.generateToken(authentication);
        User user = userRepository.findByEmail(email);

        // 6. Update last login timestamp
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // 7. Prepare response
        AuthResponse authResponse = new AuthResponse();
        authResponse.setJwt(jwt);
        authResponse.setMessage("Logged In Successfully");
        authResponse.setUser(UserMapper.toDto(user));

        return authResponse;
    }

    private Authentication authenticate(String email, String password) throws UserException {
        // Check if the email exists FIRST (gives specific 404-style error)
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new ResourceNotFoundException("Account with this email does not exist");
        }

        // Email exists — now check password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new UserException("Invalid password");
        }

        // Load full UserDetails for token creation
        UserDetails userDetails = customUserImplementation.loadUserByUsername(email);
        return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    }
}