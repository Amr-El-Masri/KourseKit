package com.koursekit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class ContentFilterService {

    @Value("${openai.api.key}")
    private String apiKey;

    private static final String OPENAI_URL = "https://api.openai.com/v1/chat/completions";
    private static final ObjectMapper mapper = new ObjectMapper();

    public enum ContentContext {
        COURSE_REVIEW,      // review of a specific course/section
        PROFESSOR_REVIEW,   // review of a specific professor
        FORUM_COURSE,       // forum post tagged to a course
        FORUM_PROFESSOR,    // forum post tagged to a professor
        FORUM_GENERAL,      // general forum post — broadest allowed content
        FORUM_COMMENT       // comment on a forum post
    }

    public static class FilterResult {
        public final String status;   // "APPROVED", "PENDING", or "FLAGGED"
        public final String reason;   // populated for PENDING and FLAGGED
        public final String comment;  // original content, unchanged

        public FilterResult(String status, String reason, String comment) {
            this.status  = status;
            this.reason  = reason;
            this.comment = comment;
        }
    }

    // Original signature kept for backward compatibility (reviews use this)
    public FilterResult filter(String comment) {
        return filter(comment, ContentContext.COURSE_REVIEW);
    }

    // New signature with context
    public FilterResult filter(String comment, ContentContext context) {
        if (comment == null || comment.trim().isEmpty()) {
            return new FilterResult("APPROVED", null, comment);
        }

        try {
            String prompt = buildPrompt(comment, context);

            String requestBody = mapper.writeValueAsString(java.util.Map.of(
                    "model", "gpt-4o-mini",
                    "temperature", 0,
                    "messages", java.util.List.of(
                            java.util.Map.of(
                                    "role", "system",
                                    "content", "You are a content moderation assistant for a university student platform. You must respond ONLY with valid JSON, no explanation, no markdown."
                            ),
                            java.util.Map.of(
                                    "role", "user",
                                    "content", prompt
                            )
                    )
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(OPENAI_URL))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());

            return parseResponse(response.body(), comment);

        } catch (Exception e) {
            System.err.println("ContentFilterService error: " + e.getMessage());
            return new FilterResult("PENDING", "AI filter unavailable — manual review required.", comment);
        }
    }

    private String buildPrompt(String content, ContentContext context) {
        String contextDescription = switch (context) {
            case COURSE_REVIEW -> """
                    This is a student review of a university course or section.
                    The review should describe a genuine student experience.
                    Criticism of a course, professor, or grading is completely acceptable.
                    Mild informal language is acceptable.
                    ONLY flag content that contains hate speech, explicit personal attacks, threats,
                    explicit sexual content, or heavily offensive language.
                    Do NOT flag content just because it is negative, harsh, or very critical.
                    """;
            case PROFESSOR_REVIEW -> """
                    This is a student review of a university professor.
                    The review should describe a genuine student experience with that professor.
                    Strong criticism of teaching style, grading, or attitude is completely acceptable.
                    Mild informal language is acceptable.
                    ONLY flag content that contains hate speech, explicit personal attacks, threats,
                    explicit sexual content, or heavily offensive language.
                    Do NOT flag content just because it is very negative or harsh about the professor.
                    """;
            case FORUM_COURSE -> """
                    This is a student forum post about a university course.
                    It can include questions, discussions, tips, complaints, or any course-related topic.
                    Casual and informal language is acceptable.
                    ONLY flag content that contains hate speech, explicit personal attacks, threats,
                    explicit sexual content, or heavily offensive language.
                    Do NOT flag content just because it is off-topic or not strictly academic.
                    """;
            case FORUM_PROFESSOR -> """
                    This is a student forum post about a university professor.
                    It can include questions, discussions, or any professor-related topic.
                    Casual and informal language is acceptable.
                    ONLY flag content that contains hate speech, explicit personal attacks, threats,
                    explicit sexual content, or heavily offensive language.
                    Do NOT flag content just because it is critical or negative about the professor.
                    """;
            case FORUM_GENERAL -> """
                    This is a general forum post on a university student platform.
                    The topic can be ANYTHING — campus life, pets, food, events, advice, humor,
                    random thoughts, or any student-related subject. There is NO requirement for
                    academic relevance. Casual, informal, and off-topic content is fully acceptable.
                    ONLY flag content that contains hate speech, explicit personal attacks, threats,
                    explicit sexual content, heavily offensive language, or content that would
                    clearly harm or harass another person.
                    Be very lenient. When in doubt, APPROVE.
                    """;
            case FORUM_COMMENT -> """
                    This is a comment on a student forum post.
                    The comment can be about any topic — academic or not.
                    Casual and informal language is acceptable.
                    ONLY flag content that contains hate speech, explicit personal attacks, threats,
                    explicit sexual content, or heavily offensive language.
                    Be lenient. When in doubt, APPROVE.
                    """;
        };

        return """
                You are moderating content on a university student platform used by students at AUB (American University of Beirut).
                Content may be written in English, Lebanese Arabizi (Arabic written in Latin letters and numbers),
                French, Arabic script, or a mix of these languages.

                Context for this content:
                %s

                Classify the following content into exactly one of three categories:

                1. APPROVED — The content is acceptable given the context above. Default to this when unsure.

                2. PENDING — The content is borderline and needs human review. Use this sparingly. Examples:
                   - Mildly inappropriate tone that is not clearly abusive
                   - Suspicious spam-like content
                   - Content that is genuinely ambiguous

                3. FLAGGED — The content clearly contains one or more of the following:
                   - Hate speech, racism, sectarianism, or discrimination
                   - Severe personal attacks or explicit threats
                   - Explicit sexual content
                   - Heavily offensive language in any language including Lebanese Arabizi
                     (examples: kuss, ayre, sharmouta, manyek, and their common variations)

                Content to analyze:
                \"\"\"
                %s
                \"\"\"

                Respond with ONLY this JSON format, nothing else:
                {
                  "verdict": "APPROVED" | "PENDING" | "FLAGGED",
                  "reason": "brief reason — required if PENDING or FLAGGED, null if APPROVED"
                }
                """.formatted(contextDescription, content);
    }

    private FilterResult parseResponse(String responseBody, String originalComment) {
        try {
            JsonNode root    = mapper.readTree(responseBody);
            String   content = root.path("choices").get(0).path("message").path("content").asText();

            content = content.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```", "").trim();

            JsonNode result  = mapper.readTree(content);
            String   verdict = result.path("verdict").asText("PENDING").toUpperCase();
            String   reason  = result.path("reason").isNull() ? null : result.path("reason").asText();

            if (!verdict.equals("APPROVED") && !verdict.equals("FLAGGED")) {
                verdict = "PENDING";
            }

            return new FilterResult(verdict, reason, originalComment);

        } catch (Exception e) {
            System.err.println("ContentFilterService parse error: " + e.getMessage());
            return new FilterResult("PENDING", "Could not parse AI response — manual review required.", originalComment);
        }
    }
}