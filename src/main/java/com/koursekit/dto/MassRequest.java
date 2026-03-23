package com.koursekit.dto;

import java.util.List;

public class MassRequest {
    private List<Long> userIds;
    private boolean active;

    public List<Long> getUserIds() { return userIds; }
    public void setUserIds(List<Long> userIds) { this.userIds = userIds; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
