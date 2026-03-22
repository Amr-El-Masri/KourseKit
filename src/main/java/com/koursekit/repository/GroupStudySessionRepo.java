package com.koursekit.repository;

import com.koursekit.model.GroupStudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface GroupStudySessionRepo extends JpaRepository<GroupStudySession, Long> {
    List<GroupStudySession> findByStudyGroup_Id(Long groupId);
    List<GroupStudySession> findByStudyGroup_IdAndIsSynced(Long groupId, boolean isSynced);
    List<GroupStudySession> findByStudyGroup_IdAndDateBetween(Long groupId, LocalDate startDate, LocalDate endDate);

    @Modifying
    @Query("UPDATE GroupStudySession session SET session.isSynced = true WHERE session.id IN :ids")
    void markAllSyncedSessionsByIds(@Param("ids") List<Long> ids);

    @Modifying
    @Query("DELETE FROM GroupStudySession session WHERE session.studyGroup.id = :groupId")
    void deleteByGroupId(@Param("groupId") Long groupId);
}
