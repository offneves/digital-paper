package com.digitalpaper.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.digitalpaper.core.entity.ProcessHistory;


public interface ProcessHistoryRepository extends JpaRepository<ProcessHistory, Long> {

}
