package com.koursekit.service;

import com.koursekit.dto.TaskRequestDTO;
import com.koursekit.dto.TaskResponseDTO;
import com.koursekit.exception.InvalidDeadlineException;
import com.koursekit.model.Task;
import com.koursekit.exception.DuplicateTaskException;
import com.koursekit.exception.TaskNotFoundException;
import com.koursekit.mappers.TaskMapper;
import com.koursekit.repository.NotificationRepository;
import com.koursekit.repository.StudyPlanRepository;
import com.koursekit.repository.TaskRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final TaskMapper taskMapper;
    private final StudyPlanRepository studyPlanRepository;

    public TaskService(TaskRepository taskRepository,
                       NotificationRepository notificationRepository,
                       TaskMapper taskMapper,
                       StudyPlanRepository studyPlanRepository) {
        this.taskRepository = taskRepository;
        this.notificationRepository = notificationRepository;
        this.taskMapper = taskMapper;
        this.studyPlanRepository = studyPlanRepository;
    }

    public TaskResponseDTO addTask(Long userId, TaskRequestDTO dto) {
        if (dto.deadline().isBefore(LocalDateTime.now())) {
            throw new InvalidDeadlineException("Deadline cannot be in the past");
        }
        if (taskRepository.existsByCourseAndTitleAndUserId(dto.course(), dto.title(), userId)) {
            throw new DuplicateTaskException("Task with same course and title already exists");
        }
        Task task = taskMapper.toEntity(dto);
        task.setUserId(userId);
        task.setPriority(Task.calculatePriority(dto.deadline()));
        Task saved = taskRepository.save(task);
        return taskMapper.toDto(saved);
    }

    @Transactional
    public void deleteTask(Long userId, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException("Task not found"));
        if (!task.getUserId().equals(userId)) {
            throw new TaskNotFoundException("Task not found");
        }
        studyPlanRepository.deleteByTask_Id(taskId);
        notificationRepository.deleteByTask_Id(taskId);
        taskRepository.deleteById(taskId);
    }

    public TaskResponseDTO editTask(Long userId, Long taskId, TaskRequestDTO dto) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new TaskNotFoundException("Task not found"));
        if (!task.getUserId().equals(userId)) {
            throw new TaskNotFoundException("Task not found");
        }
        if (dto.title() != null) task.setTitle(dto.title());
        if (dto.course() != null) task.setCourse(dto.course());
        if (dto.deadline() != null) task.setDeadline(dto.deadline());
        if (dto.type() != null) task.setType(dto.type());
        if (dto.notes() != null) task.setNotes(dto.notes());
        boolean wasCompleted = task.isCompleted();
        boolean nowCompleted = dto.completed();
        task.setCompleted(nowCompleted);
        task.setPriority(Task.calculatePriority(task.getDeadline()));
        Task saved = taskRepository.save(task);

        if (!wasCompleted && nowCompleted) {
            notificationRepository.deleteByTask_Id(saved.getId());
        } else if (wasCompleted && !nowCompleted) {
            long hoursUntil = java.time.temporal.ChronoUnit.HOURS.between(
                    LocalDateTime.now(), saved.getDeadline());
            if (hoursUntil > 0 && hoursUntil <= 78) {
                notificationRepository.save(
                        new com.koursekit.model.Notification(saved, "", LocalDateTime.now())
                );
            }
        }

        return taskMapper.toDto(saved);
    }

    public List<TaskResponseDTO> listByOrderByDeadline(Long userId) {
        return taskRepository.findByUserIdOrderByDeadlineAscCourseAscTitleAsc(userId)
                .stream().map(taskMapper::toDto).toList();
    }

    public List<TaskResponseDTO> listByCourse(Long userId, String course) {
        return taskRepository.findByUserIdAndCourseOrderByDeadlineAscTitleAsc(userId, course)
                .stream().map(taskMapper::toDto).toList();
    }

    public List<TaskResponseDTO> searchTasks(Long userId, String keyword) {
        return taskRepository.searchByUserIdAndKeyword(userId, keyword)
                .stream().map(taskMapper::toDto).toList();
    }

    public List<Task> findByDeadlineBetween(LocalDateTime from, LocalDateTime to) {
        return taskRepository.findByDeadlineBetween(from, to);
    }

    public void deleteOverdueTasks(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<Long> overdueIds = taskRepository.findOverdueTaskIds(now, userId);
        if (!overdueIds.isEmpty()) {
            notificationRepository.deleteByTaskIdIn(overdueIds);
            taskRepository.deleteTasksPastDeadline(now, userId);
        }
    }

    public List<TaskResponseDTO> getTasksByUser(Long userId) {
        return taskRepository.findByUserId(userId)
                .stream().map(taskMapper::toDto).toList();
    }
}