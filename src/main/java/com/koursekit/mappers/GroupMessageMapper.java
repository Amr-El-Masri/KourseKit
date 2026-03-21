package com.koursekit.mappers;

import org.springframework.stereotype.Component;
import com.koursekit.dto.GroupMessageResponseDTO;
import com.koursekit.model.GroupMessage;

@Component
public class GroupMessageMapper {
    public GroupMessageResponseDTO toResponseDTO(GroupMessage message) {
        return new GroupMessageResponseDTO(
            message.getId(),
            message.getSender().getId(),
            message.getSender().getFirstName(),
            message.getSender().getLastName(),
            message.getContent(),
            message.getSentAt(),
            message.getIsDeleted()
        );

    }
}
