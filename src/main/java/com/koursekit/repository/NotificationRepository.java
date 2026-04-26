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

    @Query("SELECT COUNT(n) > 0 FROM Notification n WHERE n.task.id = :taskId AND n.urgency = :urgency")
    boolean existsByTask_IdAndUrgency(@Param("taskId") Long taskId, @Param("urgency") String urgency);

    @Modifying
    @Transactional
    void deleteByTask_Id(long taskId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.task.id = :taskId AND n.urgency <> :urgency")
    void deleteByTask_IdAndUrgencyNot(@Param("taskId") Long taskId, @Param("urgency") String urgency);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.task.id IN :taskIds")
    void deleteByTaskIdIn(@Param("taskIds") java.util.List<Long> taskIds);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    void deleteOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    // Deletes all notifications where the task deadline has already passed
    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.task.deadline < :now")
    void deleteAllOverdue(@Param("now") LocalDateTime now);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoff AND n.urgency <> 'overdue'")
    void deleteOlderThanAndNotOverdue(@Param("cutoff") LocalDateTime cutoff);

    /**
     * Removes every notification whose urgency no longer matches the task's current
     * deadline, and any notification for a completed task.
     * Call this before creating new notifications so stale ones from changed deadlines
     * are always purged regardless of which time window the task moved to or from.
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE " +
           "n.task.completed = true OR " +
           "(n.urgency = 'overdue'   AND n.task.deadline > :now) OR " +
           "(n.urgency = 'today'     AND (n.task.deadline <= :now    OR n.task.deadline > :sixH)) OR " +
           "(n.urgency = 'tomorrow'  AND (n.task.deadline <= :sixH   OR n.task.deadline > :fortyEightH)) OR " +
           "(n.urgency = '3day'      AND (n.task.deadline <= :fortyEightH OR n.task.deadline > :seventyEightH))")
    void deleteStaleNotifications(
        @Param("now")          LocalDateTime now,
        @Param("sixH")         LocalDateTime sixH,
        @Param("fortyEightH")  LocalDateTime fortyEightH,
        @Param("seventyEightH") LocalDateTime seventyEightH
    );

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.task.user.id = :userId")
    void deleteByTaskUserId(@Param("userId") Long userId);
}