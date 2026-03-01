package com.koursekit.repository;

import com.koursekit.model.AvailabilitySlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AvailabilitySlotRepository extends JpaRepository<AvailabilitySlot, Long> {
    List<AvailabilitySlot> findByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM AvailabilitySlot s WHERE s.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}