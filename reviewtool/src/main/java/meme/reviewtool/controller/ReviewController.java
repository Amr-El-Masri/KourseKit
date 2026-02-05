package meme.reviewtool.controller;

import meme.reviewtool.model.Review;
import meme.reviewtool.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews") // All URLs in this class start with this
//if the frontend(soph) cant connnect because they have a diff origin, uncomment the below
//@CrossOrigin(origins="*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;


    // 2. URL to Submit a Review: POST http://localhost:8080/api/reviews/submit
    @PostMapping("/submit")
    public Review addReview(
            @RequestParam Long sectionId,
            @RequestParam String comment,
            @RequestParam int rating,
            @RequestParam String userId) {

        return reviewService.submitReview(sectionId, comment, rating, userId);
    }

    // url to View Reviews: GET http://localhost:8080/api/reviews/course/5
    //this is for getting reviews for a course in general
    @GetMapping("/course/{courseId}")
    public List<Review> getReviews(@PathVariable Long courseId) {
        return reviewService.getApprovedReviewsForCourse(courseId);
    }

    // this is for getting review for a specific section of a course (which means for a specific professor)
    @GetMapping("/section/{sectionId}")
    public List<Review> getReviewsBySection(@PathVariable Long sectionId) {
        return reviewService.getApprovedReviewsForSection(sectionId);
    }
}