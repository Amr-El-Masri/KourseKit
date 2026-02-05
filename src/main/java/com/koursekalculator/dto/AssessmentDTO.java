package com.koursekalculator.dto;

public class AssessmentDTO {
    private String name;
    private double grade;
    private double weight;

    public AssessmentDTO() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getGrade() { return grade; }
    public void setGrade(double grade) { this.grade = grade; }

    public double getWeight() { return weight; }
    public void setWeight(double weight) { this.weight = weight; }
}
