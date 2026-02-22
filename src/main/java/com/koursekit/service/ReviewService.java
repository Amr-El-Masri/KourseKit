package com.koursekit.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.koursekit.model.Review;
import com.koursekit.model.ReviewStatus;
import com.koursekit.model.Section;
import com.koursekit.repository.ReviewRepository;
import com.koursekit.repository.SectionRepository;

@Service
public class ReviewService {

    @Autowired private ReviewRepository reviewRepo;
    @Autowired private SectionRepository sectionRepo;
    @Autowired private ContentFilterService contentFilterService;

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

        String filteredComment= contentFilterService.filter(comment);
        Review review = new Review();
        review.setSection(section);
        review.setComment(filteredComment);
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