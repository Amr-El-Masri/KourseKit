package com.koursekit.dto;

import java.util.List;

public class HighestImpactRequest {
    private List<SemesterGPARequest.CourseDTO> courses;

    public HighestImpactRequest() {}

    public List<SemesterGPARequest.CourseDTO> getCourses() { return courses; }
    public void setCourses(List<SemesterGPARequest.CourseDTO> courses) { this.courses = courses; }
}
