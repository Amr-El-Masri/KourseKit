package com.koursekit.mappers;

import org.springframework.stereotype.Component;
import com.koursekit.dto.GroupReportsResponseDTO;
import com.koursekit.model.GroupReport;

@Component
public class GroupReportsMapper {
    public GroupReportsResponseDTO toResponseDTO(GroupReport report) {
        return new GroupReportsResponseDTO(
            report.getId(),
            report.getStudyGroup().getId(),
            report.getReportedBy().getId(),
            report.getReportedBy().getFirstName(),
            report.getReportedBy().getLastName(),
            report.getReportedUser().getId(),
            report.getReportedUser().getFirstName(),
            report.getReportedUser().getLastName(),
            report.getMessage() != null ? report.getMessage().getId() : null,
            report.getReason(),
            report.getStatus(),
            report.getCreatedAt()
        );
    }
}
