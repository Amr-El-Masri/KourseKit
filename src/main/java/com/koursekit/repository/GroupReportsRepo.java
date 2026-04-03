package com.koursekit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import com.koursekit.model.GroupReport;

public interface GroupReportsRepo extends JpaRepository<GroupReport, Long> {
    List<GroupReport> findByStudyGroup_Id(Long groupId);
    List<GroupReport> findByStatus(GroupReport.Status status);
    boolean existsByReportedBy_IdAndMessage_Id(Long reportedById, Long messageId);
    boolean existsByReportedBy_Id(Long reportedById); //messageID could be optional/null

    @Modifying
    @Query("DELETE FROM GroupReport r WHERE r.studyGroup.id = :groupId")
    void deleteByStudyGroup_Id(@Param("groupId") Long groupId);
}
