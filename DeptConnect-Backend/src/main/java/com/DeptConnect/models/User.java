package com.DeptConnect.models;

import com.DeptConnect.enums.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false,unique = true)
    @Email(message = "email should be valid")
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(value = EnumType.STRING) //to store actual role in the db
    @Column(nullable = false)
    private UserRole role;

    @ManyToOne(fetch = FetchType.LAZY) //Lazy means when in only needed it will be fetched
    @JoinColumn(name = "class_teacher_id")
    private User classTeacher;

//    // 🔹 Optional but recommended for clarity: reverse mapping
    @OneToMany(mappedBy = "uploadedBy", cascade = CascadeType.ALL, orphanRemoval = false)
    private List<Document> uploadedDocuments;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
}
