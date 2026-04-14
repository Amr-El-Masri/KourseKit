package com.koursekit.repository;

import com.koursekit.model.UserWeekSlotConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;

public interface UserWeekSlotConfigRepository extends JpaRepository<UserWeekSlotConfig, Long> {
    boolean existsByUserIdAndWeekStart(Long userId, LocalDate weekStart);
    void deleteByUserIdAndWeekStart(Long userId, LocalDate weekStart);
}