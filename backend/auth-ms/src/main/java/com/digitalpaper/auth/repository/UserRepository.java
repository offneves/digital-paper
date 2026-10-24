package com.digitalpaper.auth.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;
import com.digitalpaper.auth.entity.User;
import com.digitalpaper.auth.entity.enums.UserRole;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    UserDetails findByLogin(String login);
    Optional<User> findFirstByEmailIgnoreCaseOrderByIdAsc(String email);

    @Query("""
        SELECT u.id FROM User u
        WHERE u.role = :role
          AND u.active = true
        ORDER BY u.id ASC
        """)
    List<Long> findIdsByRoleAndActiveTrue(@Param("role") UserRole role);

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
