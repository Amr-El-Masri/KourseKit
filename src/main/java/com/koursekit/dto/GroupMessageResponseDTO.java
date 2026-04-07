package com.koursekit.dto;

import java.time.LocalDateTime;

public record GroupMessageResponseDTO (
    Long id,
    Long senderId,
    String senderFirstName,
    String senderLastName,
    String senderAvatar,
    String senderTag,
    String content,
    String iv,
    String encryptedKeys,
    LocalDateTime sentAt,
    boolean isDeleted,
    String reactionsJson,
    boolean pinned
) {}
