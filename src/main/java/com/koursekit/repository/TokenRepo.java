package com.koursekit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koursekit.model.Token;

public interface TokenRepo extends JpaRepository<Token, Long> {
    Optional<Token> findvalue(String value);
    Optional<Token> findvaluetype(String value, String type);
    void deleteid(Long id);
}