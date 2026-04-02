package com.koursekit.controller;

import com.koursekit.model.ForumComment;
import com.koursekit.model.ForumPost;
import com.koursekit.repository.ForumRelateRepository;
import com.koursekit.service.ForumService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import com.koursekit.config.JWTutil;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/forum")
public class ForumController {

    @Autowired private ForumService forumService;
    @Autowired private ForumRelateRepository relateRepo;
    @Autowired private JWTutil jwtutil;

    // ─── POSTS ───────────────────────────────────────────────

    // GET /api/forum/posts  — all approved posts
    @GetMapping("/posts")
    public List<ForumPost> getAllPosts() {
        return forumService.getAllPosts();
    }

    // GET /api/forum/posts?category=COURSE
    @GetMapping("/posts/category/{category}")
    public List<ForumPost> getByCategory(@PathVariable String category) {
        return forumService.getPostsByCategory(category);
    }

    // GET /api/forum/posts/course/{courseTag}
    @GetMapping("/posts/course/{courseTag}")
    public List<ForumPost> getByCourse(@PathVariable String courseTag) {
        return forumService.getPostsByCourseTag(courseTag);
    }

    // GET /api/forum/posts/professor/{professorTag}
    @GetMapping("/posts/professor/{professorTag}")
    public List<ForumPost> getByProfessor(@PathVariable String professorTag) {
        return forumService.getPostsByProfessorTag(professorTag);
    }

    // GET /api/forum/posts/{postId}
    @GetMapping("/posts/{postId}")
    public ResponseEntity<?> getPost(@PathVariable Long postId) {
        try {
            return ResponseEntity.ok(forumService.getPostById(postId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // POST /api/forum/posts
    @PostMapping("/posts")
    public ResponseEntity<?> createPost(
            HttpServletRequest request,
            @RequestParam String displayName,
            @RequestParam String title,
            @RequestParam String body,
            @RequestParam String category,
            @RequestParam(required = false) String courseTag,
            @RequestParam(required = false) String professorTag) {
        try {
            String userId = getEmailFromRequest(request);
            ForumPost post = forumService.createPost(
                    userId, displayName, title, body, category, courseTag, professorTag);
            return ResponseEntity.ok(post);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // POST /api/forum/posts/{postId}/relate
    @PostMapping("/posts/{postId}/relate")
    public ResponseEntity<?> relate(@PathVariable Long postId,
                                    HttpServletRequest request) {
        try {
            String userId = getEmailFromRequest(request);
            return ResponseEntity.ok(forumService.relate(postId, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/forum/posts/{postId}
    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable Long postId,
                                        HttpServletRequest request,
                                        Authentication auth) {
        try {
            boolean isAdmin = auth != null &&
                    auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
            String userId = getEmailFromRequest(request);
            forumService.deletePost(postId, userId, isAdmin);
            return ResponseEntity.ok("Post deleted.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── COMMENTS ────────────────────────────────────────────

    // GET /api/forum/posts/{postId}/comments
    @GetMapping("/posts/{postId}/comments")
    public List<ForumComment> getComments(@PathVariable Long postId) {
        return forumService.getCommentsForPost(postId);
    }

    // POST /api/forum/posts/{postId}/comments
    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> createComment(
            @PathVariable Long postId,
            HttpServletRequest request,
            @RequestParam String displayName,
            @RequestParam String body) {
        try {
            String userId = getEmailFromRequest(request);
            ForumComment comment = forumService.createComment(
                    postId, userId, displayName, body);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/forum/comments/{commentId}
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId,
                                           HttpServletRequest request,
                                           Authentication auth) {
        try {
            boolean isAdmin = auth != null &&
                    auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_ADMIN"));
            String userId = getEmailFromRequest(request);
            forumService.deleteComment(commentId, userId, isAdmin);
            return ResponseEntity.ok("Comment deleted.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    // GET /api/forum/posts/{postId}/related?userId=...
    @GetMapping("/posts/{postId}/related")
    public ResponseEntity<?> hasRelated(@PathVariable Long postId,
                                        HttpServletRequest request) {
        String userId = getEmailFromRequest(request);
        if (userId == null) return ResponseEntity.ok(java.util.Map.of("related", false));
        boolean related = relateRepo.existsByUserIdAndPostId(userId, postId);
        return ResponseEntity.ok(java.util.Map.of("related", related));
    }

    private String getEmailFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return jwtutil.gettokenemail(header.substring(7));
        }
        return null;
    }

    // GET /api/forum/my-posts
    @GetMapping("/my-posts")
    public ResponseEntity<?> getMyPosts(HttpServletRequest request) {
        String userId = getEmailFromRequest(request);
        if (userId == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(forumService.getPostsByUser(userId));
    }
}