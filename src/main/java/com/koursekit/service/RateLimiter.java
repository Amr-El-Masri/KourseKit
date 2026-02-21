package com.koursekit.service;
import java.util.HashMap;

import org.springframework.stereotype.Component;

@Component
public class RateLimiter {
    private final HashMap<String, Integer> counts = new HashMap<>();
    private final HashMap<String, Long> start = new HashMap<>();
    public synchronized boolean isallowed(String key, int max, long sec) {
        long now = System.currentTimeMillis() / 1000;

        if (!start.containsKey(key) || now - start.get(key) > sec) {
            counts.put(key, 1);
            start.put(key, now);
            return true;
        }

        int current = counts.get(key);
        if (current >= max) { return false; }
        counts.put(key, current++);
        return true;
    }
}
