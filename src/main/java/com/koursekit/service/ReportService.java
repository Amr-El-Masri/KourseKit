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

@Service
public class ReportService {

    @Autowired private ReportRepository reportRepo;
    @Autowired private ReviewRepository reviewRepo;
    @Autowired private ProfessorReviewRepository profReviewRepo;

    public void reportCourseReview(Long reviewId, String userId, String reason) {

        if (reportRepo.existsByUserIdAndReviewId(userId, reviewId)) {
            throw new RuntimeException("You have already reported this review.");
        }

        Review review = reviewRepo.findById(reviewId)
        .orElseThrow(() -> new RuntimeException("Review not found"));
        review.setStatus(ReviewStatus.FLAGGED);
        reviewRepo.save(review);

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

        ProfessorReview review = profReviewRepo.findById(professorReviewId)
        .orElseThrow(() -> new RuntimeException("Professor review not found"));
        review.setStatus(ReviewStatus.FLAGGED);
        profReviewRepo.save(review);

        // Save the report record
        Report report = new Report();
        report.setUserId(userId);
        report.setProfessorReviewId(professorReviewId);
        report.setReason(reason);
        reportRepo.save(report);
    }

    public void reportForumPost(Long forumPostId, String userId, String reason) {
        if (reportRepo.existsByUserIdAndForumPostId(userId, forumPostId)) {
            throw new RuntimeException("You have already reported this post.");
        }
        Report report = new Report();
        report.setUserId(userId);
        report.setForumPostId(forumPostId);
        report.setReason(reason);
        reportRepo.save(report);
    }

    public void reportForumComment(Long forumCommentId, String userId, String reason) {
        if (reportRepo.existsByUserIdAndForumCommentId(userId, forumCommentId)) {
            throw new RuntimeException("You have already reported this comment.");
        }
        Report report = new Report();
        report.setUserId(userId);
        report.setForumCommentId(forumCommentId);
        report.setReason(reason);
        reportRepo.save(report);
    }
}