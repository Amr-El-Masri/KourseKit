package com.koursekit.model;

import java.util.*;

public class SchedulerResult {

    private final List<StudyBlock> blocks;

    // TODO: not sure about this
    private final List<String> warnings;

    private final Map<Long, Double> scheduledHoursPerEntry;

    public SchedulerResult(List<StudyBlock> blocks, List<String> warnings) {
        this.blocks = blocks;
        this.warnings = warnings;
        this.scheduledHoursPerEntry = new HashMap<>();
        for (StudyBlock b : blocks) {
            Long entryId = b.getStudyPlanEntry().getId();
            scheduledHoursPerEntry.merge(entryId, b.getDuration(), Double::sum);
        }
    }

    public SchedulerResult(List<StudyBlock> blocks, List<String> warnings,
                           Map<Long, Double> scheduledHoursPerEntry) {
        this.blocks = blocks;
        this.warnings = warnings;
        this.scheduledHoursPerEntry = scheduledHoursPerEntry != null
                ? scheduledHoursPerEntry : new HashMap<>();
    }

    public boolean hasWarnings()      { return !warnings.isEmpty(); }
    public boolean isFullyScheduled() { return warnings.isEmpty(); }

    //  Getters
    public List<StudyBlock>   getBlocks()                 { return blocks; }
    public List<String>       getWarnings()               { return warnings; }
    public Map<Long, Double>  getScheduledHoursPerEntry() { return scheduledHoursPerEntry; }
}