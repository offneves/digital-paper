package com.digitalpaper.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.digitalpaper.core.entity.WorkflowAction;


public interface WorkflowActionRepository extends JpaRepository<WorkflowAction, Long> {

}
