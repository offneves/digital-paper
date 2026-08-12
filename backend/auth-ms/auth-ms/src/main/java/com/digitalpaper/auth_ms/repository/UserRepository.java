package com.digitalpaper.auth_ms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Repository;
import com.digitalpaper.auth_ms.entity.User;


@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    UserDetails findByLogin(String login);

}
