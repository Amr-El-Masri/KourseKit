package com.koursekit.repository;

import com.koursekit.model.UserWeekSlotConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;

public interface UserWeekSlotConfigRepository extends JpaRepository<UserWeekSlotConfig, Long> {
    boolean existsByUserIdAndWeekStartAndSemesterName(Long userId, LocalDate weekStart, String semesterName);
    void deleteByUserIdAndWeekStartAndSemesterName(Long userId, LocalDate weekStart, String semesterName);
}