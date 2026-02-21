package com.koursekit.model;

import java.time.LocalTime;
import java.time.Duration;

public class TimeSlot {
    private LocalTime start;
    private LocalTime end;

    public TimeSlot() {}

    public TimeSlot(LocalTime start, LocalTime end) {
        if (end.isBefore(start) || end.equals(start)) {
            throw new IllegalArgumentException("End time must be after start time");
        }
        this.start = start;
        this.end = end;
    }

    public double getDurationHours() {
        return Duration.between(start, end).toMinutes() / 60.0;
    }

    public boolean isLongEnough(double minimumHours) {
        return getDurationHours() >= minimumHours;
    }

    public LocalTime getStart() { return start; }
    public void setStart(LocalTime start) { this.start = start; }

    public LocalTime getEnd() { return end; }
    public void setEnd(LocalTime end) { this.end = end; }

}