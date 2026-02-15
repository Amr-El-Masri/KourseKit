package com.koursekit.dto;

public class SavedAssessmentDTO {
    private String name;
    private double grade;
    private double weight;

    public SavedAssessmentDTO() {}

    public SavedAssessmentDTO(String name, double grade, double weight) {
        this.name = name;
        this.grade = grade;
        this.weight = weight;
    }

    public String getName() { 
        return name; 
    }
    public void setName(String name) { 
        this.name = name; 
    }

    public double getGrade() { 
        return grade; 
    }
    public void setGrade(double grade) { 
        this.grade = grade; 
    }

    public double getWeight() { 
        return weight; 
    }
    public void setWeight(double weight) { 
        this.weight = weight; 
    }
}
