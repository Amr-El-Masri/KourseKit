package com.koursekit.mappers;

import org.springframework.stereotype.Component;

import com.koursekit.dto.GroupMessageResponseDTO;
import com.koursekit.model.GroupMessage;

@Component
public class GroupMessageMapper {
    public GroupMessageResponseDTO toResponseDTO(GroupMessage message) {
        return toResponseDTO(message, null);
    }

    public GroupMessageResponseDTO toResponseDTO(GroupMessage message, String senderTag) {
        return new GroupMessageResponseDTO(
            message.getId(),
            message.getSender().getId(),
            message.getSender().getFirstName(),
            message.getSender().getLastName(),
            message.getSender().getAvatar(),
            senderTag,
            message.getContent(),
            message.getIv(),
            message.getEncryptedKeys(),
            message.getSentAt(),
            message.getIsDeleted(),
            message.getReactionsJson() != null ? message.getReactionsJson() : "{}",
            message.getAttachmentUrl(),
            message.getAttachmentType(),
            message.getAttachmentName(),
            message.getAttachmentSize(),
            message.getPinned(),
            message.getIsSystem()
        );
    }
}
