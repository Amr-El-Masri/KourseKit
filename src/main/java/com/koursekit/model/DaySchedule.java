package com.koursekit.model;


import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class DaySchedule {

    private List<TimeSlot> slots;


    public DaySchedule() {
        this.slots = new ArrayList<>();
    }

    public DaySchedule(List<TimeSlot> slots) {
        this.slots = slots;
        // Sort by start time to ensure chronological order
        this.slots.sort(Comparator.comparing(TimeSlot::getStart));
    }

    public double getTotalAvailableHours() {
        return slots.stream()
                .mapToDouble(TimeSlot::getDurationHours)
                .sum();
    }

    public List<TimeSlot> getUsableSlots(double minimumSessionHours) {
        return slots.stream()
                .filter(slot -> slot.isLongEnough(minimumSessionHours))
                .toList();
    }

    public void addSlot(TimeSlot slot) {
        slots.add(slot);
        slots.sort(Comparator.comparing(TimeSlot::getStart));
    }

    // Getter and Setter
    public List<TimeSlot> getSlots() { return slots; }
    public void setSlots(List<TimeSlot> slots) {
        this.slots = slots;
        this.slots.sort(Comparator.comparing(TimeSlot::getStart));
    }

}

