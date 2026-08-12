package com.digitalpaper.core.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.digitalpaper.core.entity.Form;


public interface FormRepository extends JpaRepository<Form, Long> {

}
