package com.koursekit.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.koursekit.config.EmailConfig;
import com.koursekit.dto.Admins;
import com.koursekit.dto.MassRequest;
import com.koursekit.model.ForumPost;
import com.koursekit.model.GroupReport;
import com.koursekit.model.ProfessorReview;
import com.koursekit.model.Report;
import com.koursekit.model.Review;
import com.koursekit.model.ReviewStatus;
import com.koursekit.model.StudyGroup;
import com.koursekit.model.User;
import com.koursekit.repository.AvailabilitySlotRepository;
import com.koursekit.repository.DefaultScheduleSlotRepository;
import com.koursekit.repository.ForumPostRepository;
import com.koursekit.repository.GroupMessageRepo;
import com.koursekit.repository.GroupReportsRepo;
import com.koursekit.repository.GroupStudySessionRepo;
import com.koursekit.repository.NotificationRepository;
import com.koursekit.repository.PassRepo;
import com.koursekit.repository.ProfessorReviewRepository;
import com.koursekit.repository.ReportRepository;
import com.koursekit.repository.ReviewRepository;
import com.koursekit.repository.SavedSemesterRepository;
import com.koursekit.repository.StudyBlockRepository;
import com.koursekit.repository.StudyGroupMemberRepo;
import com.koursekit.repository.StudyGroupRepo;
import com.koursekit.repository.StudyPlanRepository;
import com.koursekit.repository.TaskRepository;
import com.koursekit.repository.TokenRepo;
import com.koursekit.repository.UserRepo;
import com.koursekit.repository.UserSessionRepo;
import com.koursekit.repository.UserSyllabusRepository;
import com.koursekit.repository.UserTranscriptInfoRepository;
import com.koursekit.repository.UserWidgetPrefsRepository;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    @Autowired private UserRepo userrepo;
    @Autowired private EmailConfig emailconfig;
    @Autowired private ReviewRepository reviewrepo;
    @Autowired private ProfessorReviewRepository profReviewRepo;
    @Autowired private ReportRepository reportRepo;
    @Autowired private ForumPostRepository forumPostRepo;
    @Autowired private GroupReportsRepo groupReportsRepo;
    @Autowired private TokenRepo tokenRepo;
    @Autowired private PassRepo passRepo;
    @Autowired private SavedSemesterRepository savedSemesterRepo;
    @Autowired private TaskRepository taskRepo;
    @Autowired private StudyPlanRepository studyPlanRepo;
    @Autowired private StudyBlockRepository studyBlockRepo;
    @Autowired private NotificationRepository notificationRepo;
    @Autowired private AvailabilitySlotRepository availabilitySlotRepo;
    @Autowired private UserSessionRepo sessionRepo;
    @Autowired private UserSyllabusRepository syllabusRepo;
    @Autowired private UserTranscriptInfoRepository transcriptInfoRepo;
    @Autowired private UserWidgetPrefsRepository widgetPrefsRepo;
    @Autowired private StudyGroupRepo studyGroupRepo;
    @Autowired private StudyGroupMemberRepo studyGroupMemberRepo;
    @Autowired private GroupMessageRepo groupMessageRepo;
    @Autowired private GroupStudySessionRepo groupStudySessionRepo;
    @Autowired private DefaultScheduleSlotRepository defaultSlotRepo;

    private Admins toAdminsDto(User u) {
        return new Admins(u.getId(), u.getEmail(), u.getRole(), u.isActive(), u.getCreatedAt(),
                u.getReportCount(), u.isFlagged(), u.getFlagReason(), u.getStrikeCount());
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<User> userPage = (search != null && !search.isBlank())
            ? userrepo.findByEmailContainingIgnoreCase(search, pageable)
            : userrepo.findAll(pageable);
        List<Admins> content = userPage.getContent().stream().map(this::toAdminsDto).collect(Collectors.toList());
        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalpages", userPage.getTotalPages());
        response.put("totalelements", userPage.getTotalElements());
        response.put("number", userPage.getNumber());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/mass-status")
    public ResponseEntity<?> massUpdateStatus(@RequestBody MassRequest request,
                                              @AuthenticationPrincipal User currentUser) {
        List<User> users = userrepo.findAllById(request.getUserIds());
        for (User u : users) {
            if (u.getId().equals(currentUser.getId())) continue;
            u.setActive(request.isActive());
            userrepo.save(u);
            try {
                if (request.isActive()) emailconfig.activationmail(u.getEmail());
                else emailconfig.deactivationmail(u.getEmail());
            } catch (Exception ignored) {}
        }
        return ResponseEntity.ok(Map.of("updated", users.size()));
    }

    @DeleteMapping("/users/{userId}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long userId, @AuthenticationPrincipal User currentUser) {
        if (userId.equals(currentUser.getId())) return ResponseEntity.badRequest().body(Map.of("error", "Cannot delete your own account."));
        User user = userrepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found."));

        studyBlockRepo.deleteAllByUserId(userId);
        studyPlanRepo.deleteAllByUserId(userId);
        notificationRepo.deleteByTaskUserId(userId);
        taskRepo.deleteAllByUserId(userId);
        groupReportsRepo.deleteByUserId(userId);

        List<StudyGroup> hostedGroups = studyGroupRepo.findByHost_Id(userId);
        for (StudyGroup group : hostedGroups) {
            Long groupId = group.getId();
            groupReportsRepo.deleteByStudyGroup_Id(groupId);
            groupStudySessionRepo.deleteByGroupId(groupId);
            groupMessageRepo.deleteAll_byStudyGroupID(groupId);
            studyGroupMemberRepo.deleteAll_byStudyGroupId(groupId);
        }

        studyGroupRepo.deleteAll(hostedGroups);
        groupMessageRepo.deleteBySenderId(userId);
        studyGroupMemberRepo.deleteByUser_Id(userId);
        savedSemesterRepo.deleteAll(savedSemesterRepo.findByUserIdOrderByCreatedAtDesc(userId));
        tokenRepo.deleteByUser(user);
        sessionRepo.deleteByUserId(userId);
        passRepo.deleteByUser(user);
        availabilitySlotRepo.deleteAllByUserId(userId);
        defaultSlotRepo.deleteByUserId(userId);
        syllabusRepo.deleteByUserId(userId);
        transcriptInfoRepo.deleteByUserId(userId);
        widgetPrefsRepo.deleteByUserId(userId);

        try { emailconfig.accountdeletionmail(user.getEmail()); } catch (Exception e) {
            System.err.println("Deletion email failed: " + e.getMessage());
        }

        userrepo.delete(user);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    @GetMapping("/users/flagged")
    public List<Admins> getFlaggedUsers() {
        return userrepo.findByFlagged(true).stream().map(this::toAdminsDto).collect(Collectors.toList());
    }

    @PutMapping("/users/{userid}/clear-flag")
    public ResponseEntity<?> clearFlag(@PathVariable Long userid) {
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        user.setFlagged(false);
        user.setReportCount(0);
        user.setFlagReason(null);
        user.setStrikeCount(0);
        userrepo.save(user);
        return ResponseEntity.ok("User flag cleared.");
    }

    @PutMapping("/users/{userid}/deactivate")
    public ResponseEntity<?> deactivate(@PathVariable Long userid) {
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        user.setActive(false);
        userrepo.save(user);
        try { emailconfig.deactivationmail(user.getEmail()); } catch (Exception e) { System.err.println("Deactivation email failed: " + e.getMessage()); }
        return ResponseEntity.ok("Account deactivated.");
    }

    @PutMapping("/users/{userid}/activate")
    public ResponseEntity<?> activate(@PathVariable Long userid) {
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        user.setActive(true);
        userrepo.save(user);
        try { emailconfig.activationmail(user.getEmail()); } catch (Exception e) { System.err.println("Activation email failed: " + e.getMessage()); }
        return ResponseEntity.ok("Account activated.");
    }

    @PutMapping("/users/{userid}/promote")
    public ResponseEntity<?> promote(@PathVariable Long userid) {
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        user.setRole("ADMIN");
        userrepo.save(user);
        return ResponseEntity.ok("User promoted to admin.");
    }

    @PutMapping("/users/{userid}/demote")
    public ResponseEntity<?> demote(@PathVariable Long userid, @AuthenticationPrincipal User currentUser) {
        if (currentUser.getId().equals(userid)) {
            return ResponseEntity.badRequest().body("Users cannot demote themselves.");
        }
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        user.setRole("STUDENT");
        userrepo.save(user);
        return ResponseEntity.ok("User demoted to student.");
    }

    @GetMapping("/users/{userid}/reviews")
    public ResponseEntity<?> getUserReviews(@PathVariable Long userid) {
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        List<Map<String, Object>> result = reviewrepo.findByUserId(user.getEmail()).stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("comment", r.getComment());
            m.put("rating", r.getRating());
            m.put("createdat", r.getCreatedAt());
            if (r.getSection() != null && r.getSection().getCourse() != null) {
                m.put("coursecode",  r.getSection().getCourse().getCourseCode());
                m.put("coursetitle", r.getSection().getCourse().getTitle());
            }
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> reviewToMap(Review r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",        r.getId());
        m.put("comment",   r.getComment());
        m.put("rating",    r.getRating());
        m.put("userid",    r.getUserId());
        m.put("status",    r.getStatus());
        m.put("createdat", r.getCreatedAt());
        if (r.getSection() != null && r.getSection().getCourse() != null) {
            m.put("coursecode",  r.getSection().getCourse().getCourseCode());
            m.put("coursetitle", r.getSection().getCourse().getTitle());
        }
        List<Report> reports = reportRepo.findByReviewId(r.getId());
        m.put("reportcount",   reports.size());
        m.put("reportreasons", reports.stream().map(Report::getReason).collect(Collectors.toList()));
        return m;
    }

    private Map<String, Object> profReviewToMap(ProfessorReview r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",          r.getId());
        m.put("comment",     r.getComment());
        m.put("rating",      r.getRating());
        m.put("userid",        r.getUserId());
        m.put("status",        r.getStatus());
        m.put("createdat",     r.getCreatedAt());
        m.put("profname", r.getProfessorName());
        List<Report> reports = reportRepo.findByProfessorReviewId(r.getId());
        m.put("reportcount",   reports.size());
        m.put("reportreasons", reports.stream().map(Report::getReason).collect(Collectors.toList()));
        return m;
    }

    @GetMapping("/reviews")
    public ResponseEntity<Map<String, Object>> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<Review> reviewPage = reviewrepo.findAll(PageRequest.of(page, size));
        List<Map<String, Object>> content = reviewPage.getContent().stream().map(this::reviewToMap).collect(Collectors.toList());
        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalpages", reviewPage.getTotalPages());
        response.put("totalelements", reviewPage.getTotalElements());
        response.put("number", reviewPage.getNumber());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reviews/flagged")
    public List<Map<String, Object>> getFlaggedReviews() {
        return reviewrepo.findByStatusIn(List.of(ReviewStatus.FLAGGED, ReviewStatus.PENDING)).stream().map(this::reviewToMap).collect(Collectors.toList());
    }

    @GetMapping("/reviews/reported")
    public List<Map<String, Object>> getReportedReviews() {
        return reviewrepo.findByStatus(ReviewStatus.REPORTED).stream()
            .map(this::reviewToMap)
            .sorted((a, b) -> Integer.compare((int) b.get("reportcount"), (int) a.get("reportcount")))
            .collect(Collectors.toList());
    }

    @PutMapping("/reviews/{reviewid}/approve")
    public ResponseEntity<?> approveReview(@PathVariable Long reviewid) {
        Review r = reviewrepo.findById(reviewid).orElseThrow(() -> new RuntimeException("Review not found."));
        r.setStatus(ReviewStatus.APPROVED);
        reviewrepo.save(r);
        return ResponseEntity.ok("Review approved.");
    }

    @PutMapping("/reviews/{reviewid}/warn")
    public ResponseEntity<?> warnReview(@PathVariable Long reviewid) {
        Review r = reviewrepo.findById(reviewid).orElseThrow(() -> new RuntimeException("Review not found."));
        reviewrepo.delete(r);
        userrepo.findByEmail(r.getUserId()).ifPresent(author -> {
            int strikes = author.getStrikeCount() + 1;
            author.setStrikeCount(strikes);
            author.setFlagged(true);
            if (strikes >= 5) author.setActive(false);
            userrepo.save(author);
        });
        return ResponseEntity.ok("User warned.");
    }

    @DeleteMapping("/reviews/{reviewid}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewid) {
        Review r = reviewrepo.findById(reviewid).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        reviewrepo.delete(r);
        userrepo.findByEmail(r.getUserId()).ifPresent(author -> {
            int strikes = author.getStrikeCount() + 1;
            author.setStrikeCount(strikes);
            author.setFlagged(true);
            if (strikes >= 5) author.setActive(false);
            userrepo.save(author);
        });
        return ResponseEntity.ok("Review deleted.");
    }

    @GetMapping("/users/{userid}/professor-reviews")
    public ResponseEntity<?> getUserProfReviews(@PathVariable Long userid) {
        User user = userrepo.findById(userid)
            .orElseThrow(() -> new RuntimeException("User not found."));
        return ResponseEntity.ok(profReviewRepo.findByUserId(user.getEmail()));
    }

    @GetMapping("/professor-reviews")
    public ResponseEntity<Map<String, Object>> getAllProfReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<ProfessorReview> reviewPage = profReviewRepo.findAll(PageRequest.of(page, size));
        List<Map<String, Object>> content = reviewPage.getContent().stream().map(this::profReviewToMap).collect(Collectors.toList());
        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalpages", reviewPage.getTotalPages());
        response.put("totalelements", reviewPage.getTotalElements());
        response.put("number", reviewPage.getNumber());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/professor-reviews/flagged")
    public List<Map<String, Object>> getFlaggedProfReviews() {
        return profReviewRepo.findByStatusIn(List.of(ReviewStatus.FLAGGED, ReviewStatus.PENDING)).stream().map(this::profReviewToMap).collect(Collectors.toList());
    }

    @GetMapping("/professor-reviews/reported")
    public List<Map<String, Object>> getReportedProfReviews() {
        return profReviewRepo.findByStatus(ReviewStatus.REPORTED).stream()
            .map(this::profReviewToMap)
            .sorted((a, b) -> Integer.compare((int) b.get("reportcount"), (int) a.get("reportcount")))
            .collect(Collectors.toList());
    }

    @PutMapping("/professor-reviews/{reviewid}/approve")
    public ResponseEntity<?> approveProfReview(@PathVariable Long reviewid) {
        ProfessorReview r = profReviewRepo.findById(reviewid).orElseThrow(() -> new RuntimeException("Review not found."));
        r.setStatus(ReviewStatus.APPROVED);
        profReviewRepo.save(r);
        return ResponseEntity.ok("Review approved.");
    }

    @PutMapping("/professor-reviews/{reviewid}/warn")
    public ResponseEntity<?> warnProfReview(@PathVariable Long reviewid) {
        ProfessorReview r = profReviewRepo.findById(reviewid).orElseThrow(() -> new RuntimeException("Review not found."));
        profReviewRepo.delete(r);
        userrepo.findByEmail(r.getUserId()).ifPresent(author -> {
            int strikes = author.getStrikeCount() + 1;
            author.setStrikeCount(strikes);
            author.setFlagged(true);
            if (strikes >= 5) author.setActive(false);
            userrepo.save(author);
        });
        return ResponseEntity.ok("User warned.");
    }

    @DeleteMapping("/professor-reviews/{reviewid}")
    public ResponseEntity<?> deleteProfReview(@PathVariable Long reviewid) {
        ProfessorReview r = profReviewRepo.findById(reviewid).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        profReviewRepo.delete(r);
        userrepo.findByEmail(r.getUserId()).ifPresent(author -> {
            int strikes = author.getStrikeCount() + 1;
            author.setStrikeCount(strikes);
            author.setFlagged(true);
            if (strikes >= 5) author.setActive(false);
            userrepo.save(author);
        });
        return ResponseEntity.ok("Review deleted.");
    }

    @GetMapping("/reports")
    public List<Map<String, Object>> getAllReports() {
        return reportRepo.findAll().stream().map(r -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id",                r.getId());
            m.put("userid",            r.getUserId());
            m.put("reviewid",          r.getReviewId());
            m.put("profreviewid", r.getProfessorReviewId());
            m.put("reason",            r.getReason());
            m.put("createdat",         r.getCreatedAt());
            m.put("type",              r.getReviewId() != null ? "course" : "professor");
            return m;
        }).collect(Collectors.toList());
    }

    @DeleteMapping("/reports/{reportid}")
    public ResponseEntity<?> deleteReport(@PathVariable Long reportid) {
        if (!reportRepo.existsById(reportid)) { return ResponseEntity.notFound().build(); }
        reportRepo.deleteById(reportid);
        return ResponseEntity.ok("Report deleted.");
    }

    // ─── FORUM POSTS ──────────────────────────────────────────────────────────

    private Map<String, Object> forumPostToMap(ForumPost p) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",           p.getId());
        m.put("userid",       p.getUserId());
        m.put("displayname",  p.getDisplayName());
        m.put("title",        p.getTitle());
        m.put("body",         p.getBody());
        m.put("category",     p.getCategory());
        m.put("coursetag",    p.getCourseTag());
        m.put("professortag", p.getProfessorTag());
        m.put("relatecount",  p.getRelateCount());
        m.put("commentcount", p.getCommentCount());
        m.put("status",       p.getStatus());
        m.put("createdat",    p.getCreatedAt());
        List<Report> reports = reportRepo.findByForumPostId(p.getId());
        m.put("reportcount",   reports.size());
        m.put("reportreasons", reports.stream().map(Report::getReason).collect(Collectors.toList()));
        return m;
    }

    @GetMapping("/forum-posts/flagged")
    public ResponseEntity<Map<String, Object>> getFlaggedForumPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<ForumPost> forumPage = forumPostRepo.findByStatusInOrderByCreatedAtDesc(
            List.of(ReviewStatus.FLAGGED, ReviewStatus.PENDING), PageRequest.of(page, size));
        List<Map<String, Object>> content = forumPage.getContent().stream().map(this::forumPostToMap).collect(Collectors.toList());
        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalpages", forumPage.getTotalPages());
        response.put("totalelements", forumPage.getTotalElements());
        response.put("number", forumPage.getNumber());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/forum-posts/reported")
    public ResponseEntity<Map<String, Object>> getReportedForumPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<ForumPost> forumPage = forumPostRepo.findByStatusOrderByCreatedAtDesc(
            ReviewStatus.REPORTED, PageRequest.of(page, size));
        List<Map<String, Object>> content = forumPage.getContent().stream().map(this::forumPostToMap).collect(Collectors.toList());
        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalpages", forumPage.getTotalPages());
        response.put("totalelements", forumPage.getTotalElements());
        response.put("number", forumPage.getNumber());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/forum-posts/{postid}/approve")
    public ResponseEntity<?> approveForumPost(@PathVariable Long postid) {
        ForumPost p = forumPostRepo.findById(postid).orElseThrow(() -> new RuntimeException("Post not found."));
        p.setStatus(ReviewStatus.APPROVED);
        forumPostRepo.save(p);
        return ResponseEntity.ok("Post approved.");
    }

    @PutMapping("/forum-posts/{postid}/warn")
    public ResponseEntity<?> warnForumPost(@PathVariable Long postid) {
        ForumPost p = forumPostRepo.findById(postid).orElseThrow(() -> new RuntimeException("Post not found."));
        forumPostRepo.delete(p);
        userrepo.findByEmail(p.getUserId()).ifPresent(author -> {
            int strikes = author.getStrikeCount() + 1;
            author.setStrikeCount(strikes);
            author.setFlagged(true);
            if (strikes >= 5) author.setActive(false);
            userrepo.save(author);
        });
        return ResponseEntity.ok("User warned.");
    }

    @DeleteMapping("/forum-posts/{postid}")
    public ResponseEntity<?> deleteForumPost(@PathVariable Long postid) {
        ForumPost p = forumPostRepo.findById(postid).orElse(null);
        if (p == null) return ResponseEntity.notFound().build();
        forumPostRepo.delete(p);
        userrepo.findByEmail(p.getUserId()).ifPresent(author -> {
            int strikes = author.getStrikeCount() + 1;
            author.setStrikeCount(strikes);
            author.setFlagged(true);
            if (strikes >= 5) author.setActive(false);
            userrepo.save(author);
        });
        return ResponseEntity.ok("Post deleted.");
    }

    // ─── GROUP REPORTS ────────────────────────────────────────────────────────

    private Map<String, Object> groupReportToMap(GroupReport r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",                r.getId());
        m.put("groupid",           r.getStudyGroup().getId());
        m.put("groupname",         r.getStudyGroup().getName());
        m.put("reportedbyemail",   r.getReportedBy().getEmail());
        m.put("reporteduseremail", r.getReportedUser().getEmail());
        m.put("reason",            r.getReason());
        m.put("status",            r.getStatus());
        m.put("createdat",         r.getCreatedAt());
        if (r.getMessage() != null) m.put("messagecontent", r.getMessage().getContent());
        return m;
    }

    @GetMapping("/group-reports")
    public ResponseEntity<Map<String, Object>> getPendingGroupReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<GroupReport> groupPage = groupReportsRepo.findByStatus(GroupReport.Status.PENDING, PageRequest.of(page, size));
        List<Map<String, Object>> content = groupPage.getContent().stream().map(this::groupReportToMap).collect(Collectors.toList());
        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalpages", groupPage.getTotalPages());
        response.put("totalelements", groupPage.getTotalElements());
        response.put("number", groupPage.getNumber());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/group-reports/{reportid}/resolve")
    public ResponseEntity<?> resolveGroupReport(@PathVariable Long reportid) {
        GroupReport r = groupReportsRepo.findById(reportid).orElseThrow(() -> new RuntimeException("Report not found."));
        r.setStatus(GroupReport.Status.RESOLVED);
        groupReportsRepo.save(r);
        return ResponseEntity.ok("Report resolved.");
    }

    @PutMapping("/group-reports/{reportid}/warn")
    public ResponseEntity<?> warnGroupMember(@PathVariable Long reportid) {
        GroupReport r = groupReportsRepo.findById(reportid).orElseThrow(() -> new RuntimeException("Report not found."));
        userrepo.findByEmail(r.getReportedUser().getEmail()).ifPresent(user -> {
            int strikes = user.getStrikeCount() + 1;
            user.setStrikeCount(strikes);
            user.setFlagged(true);
            if (strikes >= 5) user.setActive(false);
            userrepo.save(user);
        });
        r.setStatus(GroupReport.Status.RESOLVED);
        groupReportsRepo.save(r);
        return ResponseEntity.ok("User warned.");
    }

    @DeleteMapping("/group-reports/{reportid}")
    public ResponseEntity<?> dismissGroupReport(@PathVariable Long reportid) {
        if (!groupReportsRepo.existsById(reportid)) return ResponseEntity.notFound().build();
        groupReportsRepo.deleteById(reportid);
        return ResponseEntity.ok("Report dismissed.");
    }
}
