package com.koursekit.mappers;

import com.koursekit.dto.TaskRequestDTO;
import com.koursekit.dto.TaskResponseDTO;
import com.koursekit.entity.Task;
import org.springframework.stereotype.Component;

/*
 * Maps between Task entities and Task request/response DTOs.
 * Centralizes mapping logic to avoid duplication.
 * Only exposes fields relevant to the frontend (course, title, deadline).
 * Task IDs are intentionally hidden from the client.
 */

@Component
public class TaskMapper {

    public Task toEntity(TaskRequestDTO dto) {
        return new Task(
                dto.course(),
                dto.title(),
                dto.deadline()
        );
    }

    public TaskResponseDTO toDto(Task task) {
        return new TaskResponseDTO(
                task.getCourse(),
                task.getTitle(),
                task.getDeadline()
        );
    }
}
