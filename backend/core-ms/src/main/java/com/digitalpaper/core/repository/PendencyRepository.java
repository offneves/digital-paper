package com.digitalpaper.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.digitalpaper.core.entity.Pendency;


public interface PendencyRepository extends JpaRepository<Pendency, Long> {

}
