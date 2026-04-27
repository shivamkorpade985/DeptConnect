package com.DeptConnect.repository;

import com.DeptConnect.enums.TargetRole;
import com.DeptConnect.models.Document;
import com.DeptConnect.models.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document,Long> {

    Page<Document> findByTargetRoleIn(List<TargetRole> roles, Pageable pageable);

    Page<Document> findByTargetRoleInAndCategory(List<TargetRole> roles, com.DeptConnect.enums.DocumentCategory category, Pageable pageable);

    Page<Document> findByTargetRoleInOrUploadedBy(List<TargetRole> roles, User uploadedBy, Pageable pageable);

    Page<Document> findByTargetRoleInOrUploadedByAndCategory(List<TargetRole> roles, User uploadedBy, com.DeptConnect.enums.DocumentCategory category, Pageable pageable);

    List<Document> findByUploadedBy(User user);

    // Further if we want to for students you may want to filter by department or role;
    // add queries as needed


}
