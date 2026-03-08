package com.koursekit.repository;

import com.koursekit.model.AvailabilitySlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {

    List<AvailabilitySlot> findByUserIdAndWeekStart(Long userId, LocalDate weekStart);

    @Modifying
    @Query("DELETE FROM AvailabilitySlot s WHERE s.user.id = :userId AND s.weekStart = :weekStart")
    void deleteByUserIdAndWeekStart(@Param("userId") Long userId, @Param("weekStart") LocalDate weekStart);

    @Modifying
    @Query("DELETE FROM AvailabilitySlot s WHERE s.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}