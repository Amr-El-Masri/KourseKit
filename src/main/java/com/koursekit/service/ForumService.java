package com.koursekit.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.koursekit.model.ForumComment;
import com.koursekit.model.ForumPost;
import com.koursekit.model.ForumRelate;
import com.koursekit.model.ReviewStatus;
import com.koursekit.repository.ForumCommentRepository;
import com.koursekit.repository.ForumPostRepository;
import com.koursekit.repository.ForumRelateRepository;
import com.koursekit.repository.UserRepo;

import jakarta.transaction.Transactional;

@Service
public class ForumService {

    @Autowired private ForumPostRepository postRepo;
    @Autowired private ForumCommentRepository commentRepo;
    @Autowired private ContentFilterService contentFilterService;
    @Autowired private ForumRelateRepository relateRepo;
    @Autowired private UserRepo userRepo;

    private void enrichPost(com.koursekit.model.ForumPost post) {
        userRepo.findByEmail(post.getUserId()).ifPresent(u -> {
            String fn = u.getFirstName() != null ? u.getFirstName().trim() : "";
            String ln = u.getLastName() != null ? u.getLastName().trim() : "";
            String name = (fn + " " + ln).trim();
            if (!name.isBlank()) post.setDisplayName(name);
            if (u.getAvatar() != null && !u.getAvatar().isBlank()) post.setAvatar(u.getAvatar());
        });
    }

    private void enrichComment(com.koursekit.model.ForumComment comment) {
        userRepo.findByEmail(comment.getUserId()).ifPresent(u -> {
            String fn = u.getFirstName() != null ? u.getFirstName().trim() : "";
            String ln = u.getLastName() != null ? u.getLastName().trim() : "";
            String name = (fn + " " + ln).trim();
            if (!name.isBlank()) comment.setDisplayName(name);
            if (u.getAvatar() != null && !u.getAvatar().isBlank()) comment.setAvatar(u.getAvatar());
        });
    }

    // ─── POSTS ───────────────────────────────────────────────

    public ForumPost createPost(String userId, String displayName, String title,
                                String body, String category,
                                String courseTag, String professorTag) {

        // Pick the right context based on category
        ContentFilterService.ContentContext ctx = switch (category.toUpperCase()) {
            case "COURSE"    -> ContentFilterService.ContentContext.FORUM_COURSE;
            case "PROFESSOR" -> ContentFilterService.ContentContext.FORUM_PROFESSOR;
            default          -> ContentFilterService.ContentContext.FORUM_GENERAL;
        };

        // Filter title and body separately with the correct context
        ContentFilterService.FilterResult titleResult = contentFilterService.filter(title, ctx);
        ContentFilterService.FilterResult bodyResult  = contentFilterService.filter(body,  ctx);

        // Use the stricter of the two verdicts
        String status = stricterVerdict(titleResult.status, bodyResult.status);

        ForumPost post = new ForumPost();
        post.setUserId(userId);
        post.setDisplayName(displayName);
        post.setTitle(titleResult.comment);
        post.setBody(bodyResult.comment);
        post.setCategory(category.toUpperCase());
        post.setCourseTag(courseTag);
        post.setProfessorTag(professorTag);
        post.setStatus(ReviewStatus.valueOf(status));

        return postRepo.save(post);
    }

    private static final List<ReviewStatus> VISIBLE_STATUSES =
            List.of(ReviewStatus.APPROVED, ReviewStatus.PENDING, ReviewStatus.REPORTED);

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ForumPost> getAllPosts() {
        List<ForumPost> posts = postRepo.findByStatusInOrderByCreatedAtDesc(VISIBLE_STATUSES);
        posts.forEach(this::enrichPost);
        return posts;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ForumPost> getPostsByCategory(String category) {
        List<ForumPost> posts = postRepo.findByCategoryAndStatusInOrderByCreatedAtDesc(
                category.toUpperCase(), VISIBLE_STATUSES);
        posts.forEach(this::enrichPost);
        return posts;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ForumPost> getPostsByCourseTag(String courseTag) {
        List<ForumPost> posts = postRepo.findByCourseTagAndStatusInOrderByCreatedAtDesc(
                courseTag, VISIBLE_STATUSES);
        posts.forEach(this::enrichPost);
        return posts;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ForumPost> getPostsByProfessorTag(String professorTag) {
        List<ForumPost> posts = postRepo.findByProfessorTagAndStatusInOrderByCreatedAtDesc(
                professorTag, VISIBLE_STATUSES);
        posts.forEach(this::enrichPost);
        return posts;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ForumPost getPostById(Long postId) {
        ForumPost post = postRepo.findById(postId)
                .filter(p -> VISIBLE_STATUSES.contains(p.getStatus()))
                .orElseThrow(() -> new RuntimeException("Post not found."));
        enrichPost(post);
        return post;
    }

    public void deletePost(Long postId, String userId, boolean isAdmin) {
        ForumPost post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found."));
        if (!isAdmin && !post.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own posts.");
        }
        postRepo.delete(post);
    }

    // ─── COMMENTS ────────────────────────────────────────────

    public ForumComment createComment(Long postId, String userId,
                                      String displayName, String body) {

        ForumPost post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found."));

        ContentFilterService.FilterResult result = contentFilterService.filter(
                body, ContentFilterService.ContentContext.FORUM_COMMENT);

        ForumComment comment = new ForumComment();
        comment.setPost(post);
        comment.setUserId(userId);
        comment.setDisplayName(displayName);
        comment.setBody(result.comment);
        comment.setStatus(ReviewStatus.valueOf(result.status));

        ForumComment saved = commentRepo.save(comment);

        post.setCommentCount(post.getCommentCount() + 1);
        postRepo.save(post);

        return saved;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ForumComment> getCommentsForPost(Long postId) {
        List<ForumComment> comments = commentRepo.findByPostIdAndStatusInOrderByCreatedAtAsc(
                postId, VISIBLE_STATUSES);
        comments.forEach(this::enrichComment);
        return comments;
    }

    public void deleteComment(Long commentId, String userId, boolean isAdmin) {
        ForumComment comment = commentRepo.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found."));
        if (!isAdmin && !comment.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own comments.");
        }
        ForumPost post = comment.getPost();
        commentRepo.delete(comment);
        if (post != null) {
            post.setCommentCount(Math.max(0, post.getCommentCount() - 1));
            postRepo.save(post);
        }
    }

    // ─── HELPERS ─────────────────────────────────────────────

    // Returns the stricter of two verdicts: FLAGGED > PENDING > APPROVED
    private String stricterVerdict(String a, String b) {
        if ("FLAGGED".equals(a) || "FLAGGED".equals(b)) return "FLAGGED";
        if ("PENDING".equals(a) || "PENDING".equals(b)) return "PENDING";
        return "APPROVED";
    }

    @Transactional
    public ForumPost relate(Long postId, String userId) {
        ForumPost post = postRepo.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found."));

        if (relateRepo.existsByUserIdAndPostId(userId, postId)) {
            // Already liked — unlike it
            relateRepo.deleteByUserIdAndPostId(userId, postId);
            post.setRelateCount(Math.max(0, post.getRelateCount() - 1));
        } else {
            // Not liked yet — like it
            ForumRelate relate = new ForumRelate();
            relate.setUserId(userId);
            relate.setPostId(postId);
            relateRepo.save(relate);
            post.setRelateCount(post.getRelateCount() + 1);
        }

        return postRepo.save(post);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<ForumPost> getPostsByUser(String userId) {
        java.util.Set<Long> seen = new java.util.HashSet<>();
        List<ForumPost> all = new java.util.ArrayList<>();
        for (ForumPost p : postRepo.findByUserId(userId)) {
            if (seen.add(p.getId())) all.add(p);
        }
        for (ForumPost p : postRepo.findPostsCommentedByUser(userId)) {
            if (seen.add(p.getId())) all.add(p);
        }
        all.forEach(this::enrichPost);
        return all;
    }
}