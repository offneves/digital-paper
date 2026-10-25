package com.digitalpaper.auth.repository;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.digitalpaper.auth.entity.EmailVerificationToken;


@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHash(String tokenHash);

    boolean existsByUserIdAndCreatedAtAfter(Long userId, Instant createdAfter);

    @Modifying(clearAutomatically = true)
    @Query("""
        UPDATE EmailVerificationToken t
        SET t.usedAt = :usedAt
        WHERE t.user.id = :userId
          AND t.usedAt IS NULL
        """)
    void invalidateActiveTokensForUser(
        @Param("userId") Long userId,
        @Param("usedAt") Instant usedAt
    );

}
