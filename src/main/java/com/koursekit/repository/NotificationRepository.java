package com.koursekit.repository;

import com.koursekit.model.Notification;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByTask_User_IdOrderByTask_DeadlineAsc(Long userId);


    long countByTask_User_IdAndIsReadFalse(Long userId);

    // Check if a notification was already created for this task recently (prevents duplicates)
    boolean existsByTask_IdAndCreatedAtAfter(Long taskId, LocalDateTime after);

    @Modifying
    @Transactional
    void deleteByTask_Id(long taskId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    void deleteOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
}