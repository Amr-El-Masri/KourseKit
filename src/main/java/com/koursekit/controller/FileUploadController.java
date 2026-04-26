package com.koursekit.controller;

import com.koursekit.model.User;
import com.koursekit.repository.StudyGroupMemberRepo;
import com.koursekit.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {
    private final FileStorageService fileStorageService;
    private final StudyGroupMemberRepo studyGroupMemberRepo;

    private static final Set<String> ALLOWED_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm",
        "application/octet-stream"
    );

    public FileUploadController(FileStorageService fileStorageService, StudyGroupMemberRepo studyGroupMemberRepo) {
        this.fileStorageService = fileStorageService;
        this.studyGroupMemberRepo = studyGroupMemberRepo;
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam MultipartFile file, @RequestParam Long groupId) {
        Long userId = currentUser().getId();
        if (!studyGroupMemberRepo.existsByStudyGroup_IdAndUser_Id(groupId, userId))
            return ResponseEntity.status(403).body(Map.of("error", "Not a member of this study group"));

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType))
            return ResponseEntity.badRequest().body(Map.of("message", "File type not allowed"));

        if (file.getSize() > 50 * 1024 * 1024)
            return ResponseEntity.badRequest().body(Map.of("message", "File too large. Max 50MB"));

        try {
            String fileUrl = fileStorageService.storeFile(file);
            return ResponseEntity.ok(Map.of(
                "url", fileUrl,
                "fileName", file.getOriginalFilename(),
                "fileType", determineAttachmentType(contentType),
                "fileSize", file.getSize(),
                "mimeType", contentType
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Could not upload file"));
        }
    }

    private String determineAttachmentType(String mimeType) {
        if (mimeType.startsWith("image/")) return "IMAGE";
        if (mimeType.startsWith("audio/")) return "AUDIO";
        if (mimeType.equals("application/pdf")) return "PDF";
        return "DOC";
    }
}
