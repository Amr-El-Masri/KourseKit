package com.koursekit.model;

import java.util.*;

public class SchedulerResult {
    private final List<StudyBlock> blocks;

    // TODO: not sure about this
    private final List<String> warnings;


    public SchedulerResult(List<StudyBlock> blocks, List<String> warnings) {
        this.blocks   = blocks;
        this.warnings = warnings;
    }


    public boolean hasWarnings() {
        return !warnings.isEmpty();
    }

    public boolean isFullyScheduled() {
        return warnings.isEmpty();
    }

    //  Getters
    public List<StudyBlock> getBlocks()    { return blocks; }
    public List<String>     getWarnings()  { return warnings; }
}
