package com.koursekit.dto;

public class HighestImpactResponse {
    private int courseIndex;
    private String courseName;
    private String grade;
    private int credits;
    private String message;

    public HighestImpactResponse() {}

    public HighestImpactResponse(int courseIndex, String courseName, String grade, int credits, String message) {
        this.courseIndex = courseIndex;
        this.courseName = courseName;
        this.grade = grade;
        this.credits = credits;
        this.message = message;
    }

    public int getCourseIndex() { 
        return courseIndex; 
    }
    public void setCourseIndex(int courseIndex) { 
        this.courseIndex = courseIndex; 
    }

    public String getCourseName() { 
        return courseName; 
    }
    public void setCourseName(String courseName) { 
        this.courseName = courseName; 
    }

    public String getGrade() { 
        return grade; 

    }
    public void setGrade(String grade) { 
        this.grade = grade; 
    }

    public int getCredits() { 
        return credits; 
    }
    public void setCredits(int credits) { 
        this.credits = credits; 
    }

    public String getMessage() {
         return message; 
        }
    public void setMessage(String message) { 
        this.message = message; 
    }
}
