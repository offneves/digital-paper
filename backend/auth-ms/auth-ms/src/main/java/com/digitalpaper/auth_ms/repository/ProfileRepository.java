package com.digitalpaper.auth_ms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.digitalpaper.auth_ms.entity.Profile;


@Repository
public interface ProfileRepository extends JpaRepository<Profile, Long> {
}
