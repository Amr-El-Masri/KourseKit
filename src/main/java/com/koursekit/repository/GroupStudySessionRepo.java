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

    @Query("SELECT s FROM GroupStudySession s WHERE s.studyGroup.id IN (SELECT m.studyGroup.id FROM StudyGroupMember m WHERE m.user.id = :userId) AND s.date BETWEEN :start AND :end AND s.isSynced = true")
    List<GroupStudySession> findSyncedByUserMembershipAndDateBetween(@Param("userId") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Modifying
    @Query("UPDATE GroupStudySession session SET session.isSynced = true WHERE session.id IN :ids")
    void markAllSyncedSessionsByIds(@Param("ids") List<Long> ids);

    @Modifying
    @Query("DELETE FROM GroupStudySession session WHERE session.studyGroup.id = :groupId")
    void deleteByGroupId(@Param("groupId") Long groupId);
}
