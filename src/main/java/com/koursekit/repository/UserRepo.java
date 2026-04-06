package com.koursekit.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.koursekit.model.User;

public interface UserRepo extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByToken(String token);
    List<User> findByEmailContainingIgnoreCase(String email);
    Page<User> findByEmailContainingIgnoreCase(String email, Pageable pageable);
    List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String first, String last, String email);
    List<User> findByFlagged(boolean flagged);
}