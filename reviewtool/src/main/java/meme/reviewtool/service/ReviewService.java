package meme.reviewtool.service;

import meme.reviewtool.model.*;
import meme.reviewtool.repository.*;
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