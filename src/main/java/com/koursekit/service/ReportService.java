package com.koursekit.service;

import com.koursekit.model.Report;
import com.koursekit.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ReportService {

    @Autowired private ReportRepository reportRepo;

    public void reportCourseReview(Long reviewId, String userId, String reason) {

        if (reportRepo.existsByUserIdAndReviewId(userId, reviewId)) {
            throw new RuntimeException("You have already reported this review.");
        }

        // Save the report record
        Report report = new Report();
        report.setUserId(userId);
        report.setReviewId(reviewId);
        report.setReason(reason);
        reportRepo.save(report);
    }

    public void reportProfessorReview(Long professorReviewId, String userId, String reason) {

        if (reportRepo.existsByUserIdAndProfessorReviewId(userId, professorReviewId)) {
            throw new RuntimeException("You have already reported this review.");
        }


        // Save the report record
        Report report = new Report();
        report.setUserId(userId);
        report.setProfessorReviewId(professorReviewId);
        report.setReason(reason);
        reportRepo.save(report);
    }
}