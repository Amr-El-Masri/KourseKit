package com.koursekit.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.koursekit.model.ProfessorReview;
import com.koursekit.model.Report;
import com.koursekit.model.Review;
import com.koursekit.model.ReviewStatus;
import com.koursekit.repository.ProfessorReviewRepository;
import com.koursekit.repository.ReportRepository;
import com.koursekit.repository.ReviewRepository;
import com.koursekit.repository.UserRepo;

@Service
public class ReportService {

    private static final int REPORT_THRESHOLD = 3;

    @Autowired private ReportRepository reportRepo;
    @Autowired private ReviewRepository reviewRepo;
    @Autowired private ProfessorReviewRepository profReviewRepo;
    @Autowired private UserRepo userRepo;

    public void reportCourseReview(Long reviewId, String userId, String reason) {

        if (reportRepo.existsByUserIdAndReviewId(userId, reviewId)) {
            throw new RuntimeException("You have already reported this review.");
        }

        Review review = reviewRepo.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Review not found"));
        review.setStatus(ReviewStatus.REPORTED);
        reviewRepo.save(review);

        Report report = new Report();
        report.setUserId(userId);
        report.setReviewId(reviewId);
        report.setReason(reason);
        reportRepo.save(report);

        userRepo.findByEmail(review.getUserId()).ifPresent(author -> {
            author.setReportCount(author.getReportCount() + 1);
            if (author.getReportCount() >= REPORT_THRESHOLD) {
                author.setFlagged(true);
                author.setFlagReason(reason);
            }
            userRepo.save(author);
        });
    }

    public void reportProfessorReview(Long professorReviewId, String userId, String reason) {

        if (reportRepo.existsByUserIdAndProfessorReviewId(userId, professorReviewId)) {
            throw new RuntimeException("You have already reported this review.");
        }

        ProfessorReview review = profReviewRepo.findById(professorReviewId)
            .orElseThrow(() -> new RuntimeException("Professor review not found"));
        review.setStatus(ReviewStatus.REPORTED);
        profReviewRepo.save(review);

        Report report = new Report();
        report.setUserId(userId);
        report.setProfessorReviewId(professorReviewId);
        report.setReason(reason);
        reportRepo.save(report);

        userRepo.findByEmail(review.getUserId()).ifPresent(author -> {
            author.setReportCount(author.getReportCount() + 1);
            if (author.getReportCount() >= REPORT_THRESHOLD) {
                author.setFlagged(true);
                author.setFlagReason(reason);
            }
            userRepo.save(author);
        });
    }
}
