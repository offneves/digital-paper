package com.digitalpaper.email.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_email_template")
public class EmailTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_key", nullable = false, unique = true)
    private String templateKey;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "system_template", nullable = false)
    private Boolean systemTemplate;

    @Column(name = "enabled", nullable = false)
    private Boolean enabled;

    @Column(name = "sensitive", nullable = false)
    private Boolean sensitive;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "preheader")
    private String preheader;

    @Column(name = "eyebrow")
    private String eyebrow;

    @Column(name = "heading", nullable = false)
    private String heading;

    @Column(name = "body", nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "button_label")
    private String buttonLabel;

    @Column(name = "button_url")
    private String buttonUrl;

    @Column(name = "notice", columnDefinition = "TEXT")
    private String notice;

    @Column(name = "footer_note", columnDefinition = "TEXT")
    private String footerNote;

    @Column(name = "variables")
    private String variables;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "updated_by")
    private Long updatedBy;

}
