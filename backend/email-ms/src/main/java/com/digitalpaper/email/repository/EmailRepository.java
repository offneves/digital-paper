package com.digitalpaper.email.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.digitalpaper.email.entity.Email;
import com.digitalpaper.email.entity.enums.EmailStatus;


@Repository
public interface EmailRepository extends JpaRepository<Email, Long> {

    boolean existsByEventId(String eventId);

    @Query("""
        SELECT e FROM Email e
        WHERE e.status = :status
          AND e.nextAttemptAt <= :now
        ORDER BY e.nextAttemptAt ASC
        """)
    List<Email> findDue(
        @Param("status") EmailStatus status,
        @Param("now") LocalDateTime now,
        Pageable pageable
    );

    @Query("""
        SELECT e FROM Email e
        WHERE (
            :q = '' OR
            LOWER(e.recipientEmail) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(e.recipientName) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(e.subject) LIKE LOWER(CONCAT('%', :q, '%'))
        )
        AND (:status IS NULL OR e.status = :status)
        AND (:templateKey IS NULL OR e.templateKey = :templateKey)
        """)
    Page<Email> search(
        @Param("q") String q,
        @Param("status") EmailStatus status,
        @Param("templateKey") String templateKey,
        Pageable pageable
    );

    @Query("""
        SELECT e.templateKey,
               SUM(CASE WHEN e.sentAt >= :since THEN 1 ELSE 0 END),
               MAX(e.sentAt)
        FROM Email e
        WHERE e.status = :status
        GROUP BY e.templateKey
        """)
    List<Object[]> sentStatsByTemplate(
        @Param("status") EmailStatus status,
        @Param("since") LocalDateTime since
    );

}
