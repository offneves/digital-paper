package com.digitalpaper.email.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.digitalpaper.email.entity.EmailAttempt;


@Repository
public interface EmailAttemptRepository extends JpaRepository<EmailAttempt, Long> {

    List<EmailAttempt> findByEmailIdOrderByAttemptNumberAsc(Long emailId);

}
