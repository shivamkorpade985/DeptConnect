package com.DeptConnect.repository;

import com.DeptConnect.enums.UserRole;
import com.DeptConnect.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User,Long> {


    User findByEmail(String email);

//    Optional<Object> findByRole(UserRole role);

    // Return list for dropdown (all faculties)
    List<User> findByRole(UserRole role);

    // Return single (first) user by role — useful to find the single HOD
    Optional<User> findFirstByRole(UserRole role);

    List<User> email(String email);
}