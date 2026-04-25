package com.koursekit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.koursekit.model.Token;
import com.koursekit.model.User;

public interface TokenRepo extends JpaRepository<Token, Long> {
    Optional<Token> findByValue(String value);
    Optional<Token> findByValueAndType(String value, String type);

    @Modifying
    @Transactional
    @Query("DELETE FROM Token t WHERE t.user = :user")
    void deleteByUser(@Param("user") User user);
}