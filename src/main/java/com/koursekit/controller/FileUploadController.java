package com.koursekit.controller;

import com.koursekit.model.User;
import com.koursekit.repository.StudyGroupMemberRepo;
import com.koursekit.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
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
        this.studyGroupMemberRepo = studyGroupMemberRepo; }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal(); }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file, @RequestParam("groupId") Long groupId) {
        Long userId = currentUser().getId();
        if (!studyGroupMemberRepo.existsByStudyGroup_IdAndUser_Id(groupId, userId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Not a member of this study group")); }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType))
            return ResponseEntity.badRequest().body(Map.of("message", "File type not allowed"));

        if (file.getSize() > 50 * 1024 * 1024)
            return ResponseEntity.badRequest().body(Map.of("message", "File too large. Max 50MB"));

        try {
            String fileName = fileStorageService.storeFile(file);
            String fileUrl = "/api/files/" + fileName;
            String attachmentType = determineAttachmentType(contentType);

            return ResponseEntity.ok(Map.of(
                "url", fileUrl,
                "fileName", file.getOriginalFilename(),
                "fileType", attachmentType,
                "fileSize", file.getSize(),
                "mimeType", contentType
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("message", "Could not upload file"));
        }
    }

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String fileName) {
        try {
            Path filePath = fileStorageService.getFilePath(fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable())
                return ResponseEntity.notFound().build();

            String contentType = determineContentType(fileName);

            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String determineAttachmentType(String mimeType) {
        if (mimeType.startsWith("image/")) return "IMAGE";
        if (mimeType.startsWith("audio/")) return "AUDIO";
        if (mimeType.equals("application/pdf")) return "PDF";
        return "DOC";
    }

    private String determineContentType(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".mp3")) return "audio/mpeg";
        if (lower.endsWith(".wav")) return "audio/wav";
        if (lower.endsWith(".ogg")) return "audio/ogg";
        if (lower.endsWith(".webm")) return "audio/webm";
        return "application/octet-stream";
    }
}
