package com.koursekit.service;

import com.koursekit.model.GroupMessage;
import com.koursekit.model.StudyGroup;
import com.koursekit.model.User;
import com.koursekit.repository.GroupMessageRepo;
import com.koursekit.repository.StudyGroupMemberRepo;
import com.koursekit.repository.StudyGroupRepo;
import com.koursekit.repository.UserRepo;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.koursekit.model.GroupReport;
import com.koursekit.repository.GroupReportsRepo;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;


@Service
public class GroupMessageService {
    private final GroupMessageRepo groupMessageRepo;
    private final StudyGroupRepo studyGroupRepo;
    private final UserRepo userRepo;
    private final StudyGroupMemberRepo studyGroupMemberRepo;
    private final GroupReportsRepo groupReportsRepo;
    private final ObjectMapper objectMapper;

    public GroupMessageService(GroupMessageRepo groupMessageRepo, StudyGroupRepo studyGroupRepo, UserRepo userRepo, StudyGroupMemberRepo studyGroupMemberRepo, GroupReportsRepo groupReportsRepo, ObjectMapper objectMapper) {
        this.groupMessageRepo = groupMessageRepo;
        this.studyGroupRepo = studyGroupRepo;
        this.userRepo = userRepo;
        this.studyGroupMemberRepo = studyGroupMemberRepo;
        this.groupReportsRepo = groupReportsRepo;
        this.objectMapper = objectMapper;
    }

    public GroupMessage sendMessage(Long groupId, Long senderId, String content) {
        StudyGroup group = studyGroupRepo.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        User sender = userRepo.findById(senderId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!studyGroupMemberRepo.existsByStudyGroup_IdAndUser_Id(groupId, senderId)) {
            throw new IllegalStateException("Not a member of this group"); }
        GroupMessage message = new GroupMessage(group, sender, content);
        return groupMessageRepo.save(message);
    }

    public List<GroupMessage> loadMessages(Long groupId) {
        return groupMessageRepo.findByStudyGroup_IdAndIsDeletedFalseOrderBySentAtAsc(groupId); }

    @Transactional
    public GroupMessage deleteMessage(Long messageId, Long requesterId) {
        GroupMessage message = groupMessageRepo.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        boolean isSender = message.getSender().getId().equals(requesterId);
        boolean isHost = message.getStudyGroup().getHost().getId().equals(requesterId);
        if (!isSender && !isHost) {
            throw new IllegalStateException("Not authorized to delete this message"); }
        message.setIsDeleted(true);
        return groupMessageRepo.save(message);
    }

    @Transactional
    public GroupMessage toggleReaction(Long messageId, Long userId, String emoji) {
        GroupMessage msg = groupMessageRepo.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        try {
            Map<String, List<Long>> reactions = (msg.getReactionsJson() != null && !msg.getReactionsJson().isBlank())
                ? objectMapper.readValue(msg.getReactionsJson(), new TypeReference<>() {})
                : new HashMap<>();
            List<Long> users = reactions.getOrDefault(emoji, new ArrayList<>());
            if (users.contains(userId)) {
                users.remove(userId);  // toggle OFF
            } else {
                users.add(userId);     // toggle ON
            }
            if (users.isEmpty()) {
                reactions.remove(emoji);
            } else {
                reactions.put(emoji, users);
            }
            msg.setReactionsJson(objectMapper.writeValueAsString(reactions));
        } catch (Exception e) { msg.setReactionsJson("{}"); }
        return groupMessageRepo.save(msg);
    }

    @Transactional
    public GroupReport submitReport(Long reporterId, Long messageId, Long reportedUserId, String reason) {
        GroupMessage message = groupMessageRepo.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        User reporter = userRepo.findById(reporterId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User reported = userRepo.findById(reportedUserId)
            .orElseThrow(() -> new IllegalArgumentException("Reported user not found"));
        if (groupReportsRepo.existsByReportedBy_IdAndMessage_Id(reporterId, messageId))
            throw new IllegalStateException("You already reported this message");
        return groupReportsRepo.save(new GroupReport(message.getStudyGroup(), reporter, reported, message, reason));
    }

    public List<GroupReport> getReportsForGroup(Long groupId) {
        return groupReportsRepo.findByStudyGroup_Id(groupId); }

    @Transactional
    public GroupReport updateReportStatus(Long reportId, String status, Long requesterId) {
        GroupReport report = groupReportsRepo.findById(reportId)
            .orElseThrow(() -> new IllegalArgumentException("Report not found"));
        if (!report.getStudyGroup().getHost().getId().equals(requesterId))
            throw new IllegalStateException("Only the host can update report status");
        report.setStatus(GroupReport.Status.valueOf(status));
        return groupReportsRepo.save(report); 
    }
}
