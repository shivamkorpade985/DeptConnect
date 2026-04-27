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
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;


    // This will store the Cloudinary file URL
    @Column(nullable = false)
    private String fileUrl;

    @Column
    private String publicId;

//    @ManyToOne(fetch = FetchType.EAGER) //Set EAGER to make this availaible to all
//    @JoinColumn(name = "uploaded_by_id")
//    private User uploadedBy;

    // ✅ Corrected mapping: allows NULL safely and ensures FK consistency
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(
            name = "uploaded_by_id",
            referencedColumnName = "id",
            foreignKey = @ForeignKey(name = "fk_documents_uploaded_by")
    )
    private User uploadedBy;


    @Column
    private Long fileSize;

    private LocalDateTime uploadedAt;

    private LocalDateTime editedAt;

    @Enumerated(EnumType.STRING)
    private TargetRole targetRole;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private com.DeptConnect.enums.DocumentCategory category;


}
