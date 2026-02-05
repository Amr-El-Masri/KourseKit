package com.koursekalculator.dto;

import java.util.List;

public class SemesterGPARequest {
    private List<CourseDTO> courses;

    public SemesterGPARequest() {}

    public List<CourseDTO> getCourses() { return courses; }
    public void setCourses(List<CourseDTO> courses) { this.courses = courses; }

    public static class CourseDTO {
        private String courseCode;
        private String grade;
        private int credits;

        public CourseDTO() {}

        public String getCourseCode() { return courseCode; }
        public void setCourseCode(String courseCode) { this.courseCode = courseCode; }

        public String getGrade() { return grade; }
        public void setGrade(String grade) { this.grade = grade; }

        public int getCredits() { return credits; }
        public void setCredits(int credits) { this.credits = credits; }
    }
}
