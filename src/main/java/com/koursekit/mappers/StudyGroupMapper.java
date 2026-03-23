package com.koursekit.mappers;

import org.springframework.stereotype.Component;
import com.koursekit.dto.StudyGroupRequestDTO;
import com.koursekit.dto.StudyGroupResponseDTO;
import com.koursekit.dto.StudyGroupMemberResponseDTO;
import com.koursekit.model.StudyGroup;
import com.koursekit.model.StudyGroupMember;
import com.koursekit.model.Course;
import com.koursekit.model.User;

@Component
public class StudyGroupMapper {
    public StudyGroupResponseDTO toResponseDTO(StudyGroup group, int memberCount, boolean isHost) {
        return new StudyGroupResponseDTO(
            group.getId(),
            group.getName(),
            group.getCourse().getTitle(),
            group.getCourse().getId(),
            group.getHost().getFirstName(),
            group.getHost().getLastName(),
            group.isPrivate(),
            group.getMaxMembers(),
            memberCount,
            isHost ? group.getInviteCode() : null
        );
    }

    public StudyGroupMemberResponseDTO toMemberResponseDTO(StudyGroupMember member) {
        return new StudyGroupMemberResponseDTO(
            member.getUser().getId(),
            member.getUser().getFirstName(),
            member.getUser().getLastName(),
            member.getRole(),
            member.getJoinedAt()
        );
    }
}
