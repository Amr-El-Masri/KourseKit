package com.koursekit.repository;

import com.koursekit.model.UserWidgetPrefs;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserWidgetPrefsRepository extends JpaRepository<UserWidgetPrefs, Long> {
    Optional<UserWidgetPrefs> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
