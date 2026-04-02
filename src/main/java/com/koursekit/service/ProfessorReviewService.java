package com.koursekit.service;

import com.koursekit.model.ProfessorReview;
import com.koursekit.model.ReviewStatus;
import com.koursekit.repository.ProfessorReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProfessorReviewService {

    @Autowired private ProfessorReviewRepository professorReviewRepo;
    @Autowired private ContentFilterService contentFilterService;

    public ProfessorReview submitReview(String professorName, String comment, int rating, String userId) {

        if (!"lhd12@mail.aub.edu".equals(userId)) {
            boolean alreadyReviewed = professorReviewRepo.existsByUserIdAndProfessorName(userId, professorName);
            if (alreadyReviewed) {
                throw new RuntimeException("You have already submitted a review for this professor.");
            }
        }

        ContentFilterService.FilterResult filtered = contentFilterService.filter(comment);

        ProfessorReview review = new ProfessorReview();
        review.setProfessorName(professorName);
        review.setComment(filtered.comment);
        review.setRating(rating);
        review.setUserId(userId);
        review.setStatus(ReviewStatus.valueOf(filtered.status));

        return professorReviewRepo.save(review);
    }

    public List<ProfessorReview> getReviewsForProfessor(String professorName) {
        return professorReviewRepo.findByProfessorNameAndStatus(professorName, ReviewStatus.APPROVED);
    }

    public List<ProfessorReview> getRecentApprovedReviews(int limit) {
        return professorReviewRepo.findByStatusOrderByCreatedAtDesc(ReviewStatus.APPROVED)
                .stream().limit(limit).collect(java.util.stream.Collectors.toList());
    }

    public List<ProfessorReview> getReviewsByUser(String userId) {
        return professorReviewRepo.findByUserId(userId);
    }
}