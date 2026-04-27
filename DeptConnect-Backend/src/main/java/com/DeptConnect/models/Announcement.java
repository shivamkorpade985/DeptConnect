package com.DeptConnect.models;

import com.DeptConnect.enums.TargetRole;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "announcements")
public class Announcement{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String Body;

    @ManyToOne(fetch = FetchType.EAGER) //Set EAGER to make this availaible to all
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    private TargetRole targetRole;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private com.DeptConnect.enums.AnnouncementCategory category;

}
