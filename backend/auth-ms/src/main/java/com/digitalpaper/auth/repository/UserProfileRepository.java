package com.digitalpaper.auth.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import com.digitalpaper.auth.entity.UserProfile;


@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    boolean existsByProfile_Id(Long profileId);
    boolean existsByUser_IdAndProfile_Id(Long userId, Long profileId);

    @Query("""
        SELECT up FROM UserProfile up
        JOIN FETCH up.profile
        WHERE up.user.id = :userId
        """)
    List<UserProfile> findByUserIdWithProfile(@Param("userId") Long userId);

    Optional<UserProfile> findByUser_IdAndProfile_ProfileName(Long userId, String profileName);

}
