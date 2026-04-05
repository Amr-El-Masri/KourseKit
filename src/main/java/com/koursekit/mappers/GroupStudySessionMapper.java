package com.koursekit.mappers;

import org.springframework.stereotype.Component;
import com.koursekit.dto.GroupStudySessionRequestDTO;
import com.koursekit.dto.GroupStudySessionResponseDTO;
import com.koursekit.model.GroupStudySession;
import com.koursekit.model.StudyGroup;
import com.koursekit.model.User;

@Component
public class GroupStudySessionMapper {
    public GroupStudySessionResponseDTO toResponseDTO(GroupStudySession session) {
        return new GroupStudySessionResponseDTO(
            session.getId(),
            session.getStudyGroup().getId(),
            session.getStudyGroup().getName(),
            session.getStudyGroup().getCourse().getCourseCode(),
            session.getDate(),
            session.getStartTime(),
            session.getDuration(),
            session.getCreatedBy().getFirstName(),
            session.getCreatedBy().getLastName(),
            session.isSynced(),
            session.getEndTime()
        );
    }

    public GroupStudySession toEntity(GroupStudySessionRequestDTO dto, StudyGroup group, User createdBy) {
        return new GroupStudySession(group, createdBy, dto.date(), dto.startTime(), dto.duration(), dto.endTime()); }
}
