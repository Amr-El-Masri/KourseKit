package com.koursekit.dto;

import java.util.List;

public class CumulativeGradeRequest {
    private List<SemesterDTO> semesters;

    public CumulativeGradeRequest() {}

    public List<SemesterDTO> getSemesters() { 
        return semesters; 
    }
    public void setSemesters(List<SemesterDTO> semesters) { 
        this.semesters = semesters; 
    }

    public static class SemesterDTO {
        private String semesterName;
        private double gpa;
        private int credits;

        public SemesterDTO() {}

        public String getSemesterName() { 
            return semesterName; 
        }
        public void setSemesterName(String semesterName) { 
            this.semesterName = semesterName; 
        }

        public double getGpa() { 
            return gpa; 
        }
        public void setGpa(double gpa) { 
            this.gpa = gpa;
         }

        public int getCredits() { 
            return credits; 
        }
        public void setCredits(int credits) { 
            this.credits = credits; 
        }
    }
}
