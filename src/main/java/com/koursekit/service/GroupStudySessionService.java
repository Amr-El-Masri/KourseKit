package com.koursekit.service;

import com.koursekit.model.*;
import com.koursekit.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class GroupStudySessionService {
    private final GroupStudySessionRepo sessionRepo;
    private final StudyGroupRepo studyGroupRepo;
    private final StudyGroupMemberRepo memberRepo;
    private final UserRepo userRepo;
    private final TaskRepository taskRepository;

    public GroupStudySessionService(GroupStudySessionRepo sessionRepo, StudyGroupRepo studyGroupRepo, StudyGroupMemberRepo memberRepo, UserRepo userRepo, TaskRepository taskRepository) {
        this.sessionRepo = sessionRepo;
        this.studyGroupRepo = studyGroupRepo;
        this.memberRepo = memberRepo;
        this.userRepo = userRepo;
        this.taskRepository = taskRepository;
    }

    @Transactional
    public GroupStudySession createSession(Long hostId, Long groupId, java.time.LocalDate date, java.time.LocalTime startTime, double duration) {
        StudyGroup group = studyGroupRepo.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        if (!group.getHost().getId().equals(hostId))
            throw new IllegalStateException("Sorry, only the host(s) can schedule sessions");

        User host = userRepo.findById(hostId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

         GroupStudySession session = new GroupStudySession(
            group, host, date, startTime, duration,
            startTime.plusMinutes((long)(duration * 60))
        );
        return sessionRepo.save(session);
    }

    public List<GroupStudySession> getSessionsForGroup(Long groupId) {
        return sessionRepo.findByStudyGroup_Id(groupId); }

    @Transactional
    public Task syncSessionToTask(Long sessionId, Long userId) {
        GroupStudySession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        String course = session.getStudyGroup().getCourse().getCourseCode();
        String title  = session.getStudyGroup().getName();
        LocalDateTime deadline = LocalDateTime.of(session.getDate(), session.getEndTime());

        if (taskRepository.existsByCourseAndTitleAndUserId(course, title, userId)) {
            return taskRepository.findByUserId(userId).stream()
                .filter(t -> t.getCourse().equals(course) && t.getTitle().equals(title))
                .findFirst()
                .orElseThrow();
        }

        Task task = new Task(course, title, deadline);
        task.setType("Group Study Session");
        task.setNotes("Group study session scheduled by host.");
        task.setUserId(userId);
        task.setPriority(Task.calculatePriority(deadline));
        return taskRepository.save(task);
    }
}
