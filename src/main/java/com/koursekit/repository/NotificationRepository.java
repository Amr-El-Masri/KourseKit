package com.koursekit.repository;

import com.koursekit.model.Notification;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;


public interface NotificationRepository extends JpaRepository<Notification,Long> {
    List<Notification> findByTask_User_Id(Long userId);

    boolean existsByTask_Id(Long taskId);

    void deleteByTask_Id(long taskId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    void deleteOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
}
