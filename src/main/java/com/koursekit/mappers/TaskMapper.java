package com.koursekit.mappers;

import com.koursekit.dto.TaskRequestDTO;
import com.koursekit.dto.TaskResponseDTO;
import com.koursekit.model.Task;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {

    public Task toEntity(TaskRequestDTO dto) {
        Task task = new Task(dto.course().trim().toUpperCase(), dto.title(), dto.deadline());
        task.setType(dto.type());
        task.setNotes(dto.notes());
        task.setCompleted(dto.completed());
        return task;
    }

    public TaskResponseDTO toDto(Task task) {
        return new TaskResponseDTO(
                task.getId(),
                task.getCourse(),
                task.getTitle(),
                task.getType(),
                task.getNotes(),
                task.getPriority(),
                task.getDeadline(),
                task.isCompleted()
        );
    }
}