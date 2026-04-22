package com.koursekit.service;

import com.koursekit.model.*;
import com.koursekit.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class GroupStudySessionService {
    private final GroupStudySessionRepo sessionRepo;
    private final StudyGroupRepo studyGroupRepo;
    private final StudyGroupMemberRepo memberRepo;
    private final UserRepo userRepo;
    private final TaskRepository taskRepository;
    private final StudyBlockRepository studyBlockRepo;
    private final AvailabilitySlotRepository slotRepo;

    public GroupStudySessionService(GroupStudySessionRepo sessionRepo, StudyGroupRepo studyGroupRepo,
                                    StudyGroupMemberRepo memberRepo, UserRepo userRepo,
                                    TaskRepository taskRepository, StudyBlockRepository studyBlockRepo,
                                    AvailabilitySlotRepository slotRepo) {
        this.sessionRepo = sessionRepo;
        this.studyGroupRepo = studyGroupRepo;
        this.memberRepo = memberRepo;
        this.userRepo = userRepo;
        this.taskRepository = taskRepository;
        this.studyBlockRepo = studyBlockRepo;
        this.slotRepo = slotRepo;
    }

    @Transactional
    public GroupStudySession createSession(Long hostId, Long groupId, LocalDate date, LocalTime startTime, double duration) {
        if (date.isBefore(LocalDate.now()))
            throw new IllegalArgumentException("Cannot schedule a session in the past");
        if (date.isEqual(LocalDate.now()) && startTime.isBefore(LocalTime.now()))
            throw new IllegalArgumentException("Cannot schedule a session in the past");

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
        return sessionRepo.findByStudyGroup_Id(groupId);
    }

    public List<GroupStudySession> getMySyncedSessionsForWeek(Long userId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        return sessionRepo.findSyncedByUserMembershipAndDateBetween(userId, weekStart, weekEnd);
    }

    @Transactional
    public GroupStudySession addToPlanner(Long sessionId, Long userId) {
        GroupStudySession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!memberRepo.existsByStudyGroup_IdAndUser_Id(session.getStudyGroup().getId(), userId))
            throw new IllegalStateException("You are not a member of this group");

        LocalDate sessionDate = session.getDate();
        LocalTime sessionStart = session.getStartTime();
        LocalTime sessionEnd = session.getEndTime();

        // Delete any overlapping study blocks for this user on this date
        List<StudyBlock> blocks = studyBlockRepo.findByStudyPlanEntry_User_IdAndDayBetween(userId, sessionDate, sessionDate);
        for (StudyBlock block : blocks) {
            LocalTime blockStart = block.getStartTime();
            LocalTime blockEnd = blockStart.plusMinutes((long)(block.getDuration() * 60));
            if (blockStart.isBefore(sessionEnd) && blockEnd.isAfter(sessionStart)) {
                studyBlockRepo.deleteById(block.getId());
            }
        }

        // Trim or delete overlapping availability slots for this user this week
        LocalDate weekStart = sessionDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        String dayKey = sessionDate.getDayOfWeek().name();
        List<AvailabilitySlot> slots = slotRepo.findByUserIdAndWeekStart(userId, weekStart);
        for (AvailabilitySlot slot : slots) {
            if (!slot.getDayKey().equals(dayKey)) continue;
            LocalTime slotStart = slot.getStartTime();
            LocalTime slotEnd = slot.getEndTime();
            if (!slotStart.isBefore(sessionEnd) || !slotEnd.isAfter(sessionStart)) continue;

            if (!slotStart.isBefore(sessionStart) && !slotEnd.isAfter(sessionEnd)) {
                // Slot fully inside session — delete
                slotRepo.deleteById(slot.getId());
            } else if (slotStart.isBefore(sessionStart) && slotEnd.isAfter(sessionEnd)) {
                // Slot spans the whole session — split into two; drop fragments under 30 min
                boolean leftOk  = java.time.Duration.between(slotStart, sessionStart).toMinutes() >= 30;
                boolean rightOk = java.time.Duration.between(sessionEnd, slotEnd).toMinutes() >= 30;
                if (leftOk) {
                    slot.setEndTime(sessionStart);
                    slotRepo.save(slot);
                } else {
                    slotRepo.deleteById(slot.getId());
                }
                if (rightOk) {
                    AvailabilitySlot right = new AvailabilitySlot();
                    right.setUser(slot.getUser());
                    right.setDayKey(dayKey);
                    right.setStartTime(sessionEnd);
                    right.setEndTime(slotEnd);
                    right.setWeekStart(weekStart);
                    right.setSemesterName(slot.getSemesterName());
                    slotRepo.save(right);
                }
            } else if (slotStart.isBefore(sessionStart)) {
                // Slot overlaps from the left — trim end; delete if remainder < 30 min
                if (java.time.Duration.between(slotStart, sessionStart).toMinutes() >= 30) {
                    slot.setEndTime(sessionStart);
                    slotRepo.save(slot);
                } else {
                    slotRepo.deleteById(slot.getId());
                }
            } else {
                // Slot overlaps from the right — trim start; delete if remainder < 30 min
                if (java.time.Duration.between(sessionEnd, slotEnd).toMinutes() >= 30) {
                    slot.setStartTime(sessionEnd);
                    slotRepo.save(slot);
                } else {
                    slotRepo.deleteById(slot.getId());
                }
            }
        }

        session.setSynced(true);
        return sessionRepo.save(session);
    }

    @Transactional
    public Task syncSessionToTask(Long sessionId, Long userId) {
        GroupStudySession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        String course = session.getStudyGroup().getCourse().getCourseCode();
        String title  = "Group Study Session: " + session.getStudyGroup().getName();
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

    @Transactional
    public GroupStudySession editSession(Long sessionId, Long hostId, LocalDate date, LocalTime startTime, double duration) {
        if (date.isBefore(LocalDate.now()))
            throw new IllegalArgumentException("Cannot schedule a session in the past");
        if (date.isEqual(LocalDate.now()) && startTime.isBefore(LocalTime.now()))
            throw new IllegalArgumentException("Cannot schedule a session in the past");

        GroupStudySession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!memberRepo.existsByStudyGroup_IdAndUser_IdAndRole(session.getStudyGroup().getId(), hostId, StudyGroupMember.Role.HOST))
            throw new IllegalStateException("Only the host can edit sessions");

        session.setDate(date);
        session.setStartTime(startTime);
        session.setDuration(duration);
        session.setEndTime(startTime.plusMinutes((long)(duration * 60)));
        return sessionRepo.save(session);
    }

    @Transactional
    public GroupStudySession removeFromPlanner(Long sessionId, Long userId) {
        GroupStudySession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!memberRepo.existsByStudyGroup_IdAndUser_Id(session.getStudyGroup().getId(), userId))
            throw new IllegalStateException("You are not a member of this group");

        session.setSynced(false);
        return sessionRepo.save(session);
    }

    @Transactional
    public void deleteSession(Long sessionId, Long hostId) {
        GroupStudySession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (!memberRepo.existsByStudyGroup_IdAndUser_IdAndRole(session.getStudyGroup().getId(), hostId, StudyGroupMember.Role.HOST))
            throw new IllegalStateException("Only the host(s) can delete sessions");

        sessionRepo.deleteById(sessionId);
    }
}