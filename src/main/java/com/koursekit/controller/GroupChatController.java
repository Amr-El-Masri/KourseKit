package com.koursekit.controller;

import com.koursekit.model.GroupMessage;
import com.koursekit.dto.GroupMessageResponseDTO;
import com.koursekit.mappers.GroupMessageMapper;
import com.koursekit.model.StudyGroupMember;
import com.koursekit.model.User;
import com.koursekit.repository.GroupMessageRepo;
import com.koursekit.repository.StudyGroupMemberRepo;
import com.koursekit.service.GroupMessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import com.koursekit.dto.GroupReportsRequestDTO;
import com.koursekit.mappers.GroupReportsMapper;
import com.koursekit.model.GroupReport;

@Controller
@RequestMapping("/api/group-messages")
public class GroupChatController {
    private final GroupMessageService groupMessageService;
    private final GroupMessageMapper groupMessageMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final GroupReportsMapper groupReportsMapper;
    private final StudyGroupMemberRepo memberRepo;
    private final GroupMessageRepo groupMessageRepo;

    public GroupChatController(GroupMessageService groupMessageService, GroupMessageMapper groupMessageMapper, SimpMessagingTemplate messagingTemplate, GroupReportsMapper groupReportsMapper, StudyGroupMemberRepo memberRepo, GroupMessageRepo groupMessageRepo) {
        this.groupMessageService = groupMessageService;
        this.groupMessageMapper = groupMessageMapper;
        this.messagingTemplate = messagingTemplate;
        this.groupReportsMapper = groupReportsMapper;
        this.memberRepo = memberRepo;
        this.groupMessageRepo = groupMessageRepo;
    }

    private String getSenderTag(Long groupId, Long senderId) {
        return memberRepo.findByStudyGroup_IdAndUser_Id(groupId, senderId)
            .stream().findFirst().map(StudyGroupMember::getTag).orElse(null);
    }

    private Long currentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getId();
    }

    @MessageMapping("/chat/{groupId}")
    public void handleMessage(@DestinationVariable Long groupId,
                            @Payload Map<String, String> payload) {
        Long senderId = Long.parseLong(payload.get("senderId"));
        String content = payload.get("content");
        GroupMessage saved = groupMessageService.sendMessage(groupId, senderId, content);
        GroupMessageResponseDTO dto = groupMessageMapper.toResponseDTO(saved, getSenderTag(groupId, senderId));
        messagingTemplate.convertAndSend("/topic/group/" + groupId, dto);
    }

    @GetMapping("/{groupId}/history")
    @ResponseBody
    public ResponseEntity<?> loadHistory(@PathVariable Long groupId) {
        List<GroupMessageResponseDTO> messages = groupMessageService.loadMessages(groupId)
            .stream()
            .map(m -> groupMessageMapper.toResponseDTO(m, getSenderTag(groupId, m.getSender().getId())))
            .toList();
        return ResponseEntity.ok(messages);
    }

    @DeleteMapping("/{messageId}")
    @ResponseBody
    public ResponseEntity<?> deleteMessage(@PathVariable Long messageId) {
        GroupMessage deleted = groupMessageService.deleteMessage(messageId, currentUserId());
        GroupMessageResponseDTO dto = groupMessageMapper.toResponseDTO(deleted);
        messagingTemplate.convertAndSend("/topic/group/" + deleted.getStudyGroup().getId(), dto);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{messageId}/react")
    @ResponseBody
    public ResponseEntity<?> reactToMessage(@PathVariable Long messageId, @RequestBody Map<String, String> body) {
        GroupMessage msg = groupMessageService.toggleReaction(messageId, currentUserId(), body.get("emoji"));
        GroupMessageResponseDTO dto = groupMessageMapper.toResponseDTO(msg);
        messagingTemplate.convertAndSend("/topic/group/" + msg.getStudyGroup().getId(), dto);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{groupId}/pinned")
    @ResponseBody
    public ResponseEntity<?> getPinned(@PathVariable Long groupId) {
        List<GroupMessageResponseDTO> pinned = groupMessageRepo.findByStudyGroup_IdAndPinnedTrueOrderByPinnedAtDesc(groupId)
            .stream()
            .map(m -> groupMessageMapper.toResponseDTO(m, getSenderTag(groupId, m.getSender().getId())))
            .toList();
        return ResponseEntity.ok(pinned);
    }

    @PatchMapping("/{messageId}/pin")
    @ResponseBody
    public ResponseEntity<?> pinMessage(@PathVariable Long messageId) {
        GroupMessage msg = groupMessageRepo.findById(messageId).orElse(null);
        if (msg == null) return ResponseEntity.notFound().build();
        Long groupId = msg.getStudyGroup().getId();
        boolean alreadyPinned = msg.getPinned();
        if (!alreadyPinned && groupMessageRepo.countByStudyGroup_IdAndPinnedTrue(groupId) >= 3)
            return ResponseEntity.badRequest().body(Map.of("message", "Maximum 3 pinned messages per group."));
        msg.setPinned(!alreadyPinned);
        msg.setPinnedAt(alreadyPinned ? null : java.time.LocalDateTime.now());
        groupMessageRepo.save(msg);
        GroupMessageResponseDTO dto = groupMessageMapper.toResponseDTO(msg, getSenderTag(groupId, msg.getSender().getId()));
        messagingTemplate.convertAndSend("/topic/group/" + groupId, dto);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/reports")
    @ResponseBody
    public ResponseEntity<?> submitReport(@RequestBody GroupReportsRequestDTO dto) {
        GroupReport report = groupMessageService.submitReport(
            currentUserId(), dto.messageId(), dto.reportedUserId(), dto.reason(), dto.studyGroupId());
        return ResponseEntity.ok(groupReportsMapper.toResponseDTO(report));
    }

    @GetMapping("/{groupId}/reports")
    @ResponseBody
    public ResponseEntity<?> getReports(@PathVariable Long groupId) {
        return ResponseEntity.ok(
            groupMessageService.getReportsForGroup(groupId)
                .stream().map(groupReportsMapper::toResponseDTO).toList());
    }

    @PatchMapping("/reports/{reportId}")
    @ResponseBody
    public ResponseEntity<?> updateReportStatus(@PathVariable Long reportId, @RequestBody Map<String, String> body) {
        GroupReport updated = groupMessageService.updateReportStatus(reportId, body.get("status"), currentUserId());
        return ResponseEntity.ok(groupReportsMapper.toResponseDTO(updated));
    }
}
