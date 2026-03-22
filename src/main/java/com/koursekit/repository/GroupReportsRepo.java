package com.koursekit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.koursekit.model.GroupReport;

public interface GroupReportsRepo extends JpaRepository<GroupReport, Long> {
    List<GroupReport> findByStudyGroup_Id(Long groupId);
    List<GroupReport> findByStatus(GroupReport.Status status);
    boolean existsByReportedBy_IdAndMessage_Id(Long reportedById, Long messageId);
    boolean existsByReportedBy_Id(Long reportedById); //messageID could be optional/null
}
