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

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.task.user.id = :userId")
    void deleteByTaskUserId(@Param("userId") Long userId);
}