package com.digitalpaper.auth.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.digitalpaper.auth.entity.PasswordResetToken;


@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    @Modifying(clearAutomatically = true)
    @Query("""
        UPDATE PasswordResetToken t
        SET t.usedAt = :usedAt
        WHERE t.user.id = :userId
          AND t.usedAt IS NULL
        """)
    void invalidateActiveTokensForUser(
        @Param("userId") Long userId,
        @Param("usedAt") java.time.Instant usedAt
    );

}
