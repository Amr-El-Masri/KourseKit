package com.koursekit.model;

import java.time.DayOfWeek;
import java.util.Map;
import java.util.Set;


public class SchedulerSettings {


    private Map<DayOfWeek, DaySchedule> availability;


    public SchedulerSettings() {}

    public SchedulerSettings(
            Map<DayOfWeek, DaySchedule> availability
    ) {
        this.availability = availability;
    }

    public Set<DayOfWeek> getStudyDays() {
        return availability.keySet();
    }

    // Setters
    public void setAvailability(Map<DayOfWeek, DaySchedule> availability) {
        this.availability = availability;
    }


    // Getters
    public Map<DayOfWeek, DaySchedule> getAvailability() { return availability; }

    public double getMinimumSessionHours() {
        return 1.0; }

    public double getMaximumSessionHours() {
        return 3.0; }

    public int getDeadlineBufferDays() {
        return 1; }

    public double getMaxHoursPerSubjectPerDay() {
        return 4.0; }

}
