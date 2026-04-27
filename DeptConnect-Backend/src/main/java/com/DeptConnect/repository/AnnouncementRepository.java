package com.DeptConnect.repository;

import com.DeptConnect.enums.TargetRole;
import com.DeptConnect.models.Announcement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement,Long> {

    // List<Announcement> findByTargetRoleIn(List<TargetRole> roles); //Use later
    // PAGINATION CHANGE
    Page<Announcement> findByTargetRoleIn(List<TargetRole> roles, Pageable pageable);
    
    Page<Announcement> findByTargetRoleInAndCategory(List<TargetRole> roles, com.DeptConnect.enums.AnnouncementCategory category, Pageable pageable);

    Page<Announcement> findByTargetRoleInOrCreatedBy(List<TargetRole> roles, com.DeptConnect.models.User createdBy, Pageable pageable);

    Page<Announcement> findByTargetRoleInOrCreatedByAndCategory(List<TargetRole> roles, com.DeptConnect.models.User createdBy, com.DeptConnect.enums.AnnouncementCategory category, Pageable pageable);
}
