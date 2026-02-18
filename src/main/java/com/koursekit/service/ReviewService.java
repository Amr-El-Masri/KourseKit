package com.koursekit.service;

import com.koursekit.model.*;
import com.koursekit.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ReviewService {

    @Autowired private ReviewRepository reviewRepo;
    @Autowired private SectionRepository sectionRepo;

    public Review submitReview(Long sectionId, String comment, int rating, String userId) {
        Section section = sectionRepo.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Section not found"));

        //check if this user already posted a review for this section
        boolean alreadyReviewed = reviewRepo.existsByUserIdAndSectionCourseId(
                userId,
                section.getCourse().getId()
        );

        if (alreadyReviewed) {
            throw new RuntimeException("You have already submitted a review for this course.");
        }

        Review review = new Review();
        review.setSection(section);
        review.setComment(comment);
        review.setRating(rating);
        review.setUserId(userId);

        return reviewRepo.save(review);
    }

    public List<Review> getApprovedReviewsForCourse(Long courseId) {
        return reviewRepo.findBySectionCourseIdAndStatus(courseId, ReviewStatus.APPROVED);
    }


    public List<Review> getApprovedReviewsForSection(Long sectionId) {
        return reviewRepo.findBySectionIdAndStatus(sectionId, ReviewStatus.APPROVED);
    }
}