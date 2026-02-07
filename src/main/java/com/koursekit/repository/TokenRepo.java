package com.koursekit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koursekit.model.Token;

public interface TokenRepo extends JpaRepository<Token, Long> {
    Optional<Token> findByValue(String value);
    Optional<Token> findByValueAndType(String value, String type);
}