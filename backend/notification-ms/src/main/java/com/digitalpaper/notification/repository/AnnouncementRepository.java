package com.digitalpaper.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.digitalpaper.notification.entity.Announcement;


@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
}
