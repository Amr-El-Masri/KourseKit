package com.koursekit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.koursekit.model.User;

public interface UserRepo extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByToken(String token);
}