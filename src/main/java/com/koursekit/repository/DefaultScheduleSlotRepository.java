package com.koursekit.repository;

import com.koursekit.model.DefaultScheduleSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DefaultScheduleSlotRepository extends JpaRepository<DefaultScheduleSlot, Long> {

    List<DefaultScheduleSlot> findByUserId(Long userId);

    List<DefaultScheduleSlot> findByUserIdAndSemesterName(Long userId, String semesterName);

    @Modifying
    @Query("DELETE FROM DefaultScheduleSlot s WHERE s.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM DefaultScheduleSlot s WHERE s.user.id = :userId AND s.semesterName = :semesterName")
    void deleteByUserIdAndSemesterName(@Param("userId") Long userId, @Param("semesterName") String semesterName);
}