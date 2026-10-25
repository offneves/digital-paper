package com.digitalpaper.email.entity;

import java.time.LocalDateTime;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_email_attempt")
public class EmailAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "email_id", nullable = false)
    private Email email;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber;

    @Column(name = "success", nullable = false)
    private Boolean success;

    @Column(name = "error", columnDefinition = "TEXT")
    private String error;

    @Column(name = "duration_ms", nullable = false)
    private Long durationMs;

    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt;

}
