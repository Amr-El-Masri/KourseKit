package com.koursekit.dto;

import java.util.List;

public class HighestImpactRequest {
    private List<SemesterGradeRequest.CourseDTO> courses;

    public HighestImpactRequest() {}

    public List<SemesterGradeRequest.CourseDTO> getCourses() { 
        return courses; 
    }
    public void setCourses(List<SemesterGradeRequest.CourseDTO> courses) { 
        this.courses = courses; 
    }
}
