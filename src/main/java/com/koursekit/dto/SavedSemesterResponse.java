package com.koursekit.dto;

import java.time.LocalDateTime;
import java.util.List;

public class SavedSemesterResponse {
    private Long id;
    private String semesterName;
    private List<SavedCourseDTO> courses;
    private LocalDateTime createdAt;
    private String message;
    private boolean isTemplate;

    public SavedSemesterResponse() {}

    public SavedSemesterResponse(Long id, String semesterName, List<SavedCourseDTO> courses,
                                 LocalDateTime createdAt, String message) {
        this.id = id;
        this.semesterName = semesterName;
        this.courses = courses;
        this.createdAt = createdAt;
        this.message = message;
    }

    public Long getId() { 
        return id; 
    }
    public void setId(Long id) { 
        this.id = id; 
    }

    public String getSemesterName() { 
        return semesterName;
     }
    public void setSemesterName(String semesterName) { 
        this.semesterName = semesterName; 
    }

    public List<SavedCourseDTO> getCourses() { 
        return courses; 
    }
    public void setCourses(List<SavedCourseDTO> courses) { 
        this.courses = courses; 
    }

    public LocalDateTime getCreatedAt() { 
        return createdAt;
     }
    public void setCreatedAt(LocalDateTime createdAt) { 
        this.createdAt = createdAt; 
    }

    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isTemplate() {
        return isTemplate;
    }
    public void setTemplate(boolean isTemplate) {
        this.isTemplate = isTemplate;
    }
}
