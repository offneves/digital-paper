package com.digitalpaper.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.digitalpaper.core.entity.Workflow;


public interface WorkflowRepository extends JpaRepository<Workflow, Long> {

}
