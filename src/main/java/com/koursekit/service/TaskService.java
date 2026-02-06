package com.koursekit.service;

import com.koursekit.dto.TaskRequestDTO;
import com.koursekit.dto.TaskResponseDTO;
import com.koursekit.model.Task;
import com.koursekit.exception.DuplicateTaskException;
import com.koursekit.exception.TaskNotFoundException;
import com.koursekit.mappers.TaskMapper;
import com.koursekit.repository.NotificationRepository;
import com.koursekit.repository.TaskRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/*
 * Handles business logic for task management.
 * Uses DTOs for API communication and entities internally.
 */

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final TaskMapper taskMapper;

    public TaskService(TaskRepository taskRepository, NotificationRepository notificationRepository, TaskMapper taskMapper) {
        this.taskRepository = taskRepository;
        this.notificationRepository= notificationRepository;
        this.taskMapper=taskMapper;
    }

    public TaskResponseDTO addTask(TaskRequestDTO dto){
        if (taskRepository.existsByCourseAndTitle(dto.course(), dto.title())) {
            throw new DuplicateTaskException(
                    "Task with same course and title already exists"
            );
        }
        Task task= taskMapper.toEntity(dto);
        Task saved= taskRepository.save(task);
        return taskMapper.toDto(saved);
    }

    @Transactional
    public void deleteTask(Long id){
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException("Task not found"));
        notificationRepository.deleteByTask_Id(id);
        taskRepository.deleteById(id);
    }

    public TaskResponseDTO editTask(Long id, TaskRequestDTO dto) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException("Task not found"));

        if (dto.title() != null) task.setTitle(dto.title());
        if (dto.course() != null) task.setCourse(dto.course());
        if (dto.deadline() != null) task.setDeadline(dto.deadline());

        Task saved=taskRepository.save(task);
        return taskMapper.toDto(saved);
    }

    public List<TaskResponseDTO> listByOrderByDeadline(){
        return taskRepository.findAllByOrderByDeadlineAscCourseAscTitleAsc().stream().map(taskMapper::toDto).toList();
    }

    public List<TaskResponseDTO> listByCourse(String course){
        return taskRepository.findAllByCourseOrderByDeadlineAscTitleAsc(course).stream().map(taskMapper::toDto).toList();
    }

    public List<Task> findByDeadlineBetween(){
        LocalDateTime now= LocalDateTime.now();
        LocalDateTime oneDay = now.plusHours(24);

        return taskRepository.findByDeadlineBetween(now, oneDay);
    }

    public void deleteOverdueTasks() {
        LocalDateTime now = LocalDateTime.now();
        taskRepository.deleteTasksPastDeadline(now);
    }
}
