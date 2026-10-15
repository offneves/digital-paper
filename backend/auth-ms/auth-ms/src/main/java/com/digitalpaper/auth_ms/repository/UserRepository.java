package com.digitalpaper.auth_ms.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;
import com.digitalpaper.auth_ms.entity.User;
import com.digitalpaper.auth_ms.entity.enums.UserRole;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    UserDetails findByLogin(String login);

    @Query("""
        SELECT u FROM User u
        WHERE (
            :q = '' OR
            LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(u.login) LIKE LOWER(CONCAT('%', :q, '%')) OR
            LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
        )
        AND (:role IS NULL OR u.role = :role)
        """)
    Page<User> search(@Param("q") String q, @Param("role") UserRole role, Pageable pageable);

}
