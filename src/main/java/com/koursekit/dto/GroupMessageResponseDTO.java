package com.koursekit.dto;

import java.time.LocalDateTime;

public record GroupMessageResponseDTO (
    Long id,
    Long senderId,
    String senderFirstName,
    String senderLastName,
    String content,
    LocalDateTime sentAt,
    boolean isDeleted,
    String reactionsJson,
    String attachmentUrl,
    String attachmentType,
    String attachmentName,
    Long attachmentSize
) {}
