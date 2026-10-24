package com.digitalpaper.notification.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.digitalpaper.notification.entity.Notification;


@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("""
        SELECT n FROM Notification n
        WHERE n.recipientUserId = :recipientUserId
          AND n.deletedAt IS NULL
        """)
    Page<Notification> findActiveByRecipient(
        @Param("recipientUserId") Long recipientUserId,
        Pageable pageable
    );

    @Query("""
        SELECT n FROM Notification n
        WHERE n.recipientUserId = :recipientUserId
          AND n.deletedAt IS NULL
          AND n.readAt IS NULL
        """)
    Page<Notification> findUnreadByRecipient(
        @Param("recipientUserId") Long recipientUserId,
        Pageable pageable
    );

    @Query("""
        SELECT n FROM Notification n
        WHERE n.recipientUserId = :recipientUserId
          AND n.deletedAt IS NULL
          AND n.readAt IS NOT NULL
        """)
    Page<Notification> findReadByRecipient(
        @Param("recipientUserId") Long recipientUserId,
        Pageable pageable
    );

    @Query("""
        SELECT n FROM Notification n
        WHERE n.recipientUserId = :recipientUserId
          AND n.deletedAt IS NOT NULL
        """)
    Page<Notification> findDeletedByRecipient(
        @Param("recipientUserId") Long recipientUserId,
        Pageable pageable
    );

    @Query("""
        SELECT COUNT(n) FROM Notification n
        WHERE n.recipientUserId = :recipientUserId
          AND n.deletedAt IS NULL
          AND n.readAt IS NULL
        """)
    long countUnreadByRecipient(@Param("recipientUserId") Long recipientUserId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE Notification n
        SET n.readAt = :readAt
        WHERE n.recipientUserId = :recipientUserId
          AND n.readAt IS NULL
          AND n.deletedAt IS NULL
        """)
    int markAllRead(
        @Param("recipientUserId") Long recipientUserId,
        @Param("readAt") java.time.LocalDateTime readAt
    );

}
