package com.digitalpaper.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.digitalpaper.core.entity.Process;


public interface ProcessRepository extends JpaRepository<Process, Long> {

}
