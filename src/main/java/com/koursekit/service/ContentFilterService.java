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

    // Result object returned to the calling service
    public static class FilterResult {
        public final String status;   // "APPROVED", "PENDING", or "FLAGGED"
        public final String reason;   // populated for PENDING and FLAGGED
        public final String comment;  // original comment, unchanged

        public FilterResult(String status, String reason, String comment) {
            this.status  = status;
            this.reason  = reason;
            this.comment = comment;
        }
    }

    public FilterResult filter(String comment) {
        if (comment == null || comment.trim().isEmpty()) {
            return new FilterResult("APPROVED", null, comment);
        }

        try {
            String prompt = buildPrompt(comment);

            // Build the JSON request body
            String requestBody = mapper.writeValueAsString(java.util.Map.of(
                    "model", "gpt-4o-mini",
                    "temperature", 0,
                    "messages", java.util.List.of(
                            java.util.Map.of(
                                    "role", "system",
                                    "content", "You are a strict but fair content moderation assistant for a university course review platform. You must respond ONLY with valid JSON, no explanation, no markdown."
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
            // If the API call fails for any reason, fall back to PENDING
            // so a human reviews it rather than bad content slipping through
            System.err.println("ContentFilterService error: " + e.getMessage());
            return new FilterResult("PENDING", "AI filter unavailable — manual review required.", comment);
        }
    }

    private String buildPrompt(String comment) {
        return """
            You are moderating reviews for a university course review platform used by students at AUB (American University of Beirut).
            Reviews may be written in English, Lebanese Arabizi (Arabic written in Latin letters and numbers, e.g. "3", "7", "2"), French, Arabic script, or a mix of these languages.

            Analyze the following review and classify it into exactly one of three categories:

            1. APPROVED — The review is a legitimate student experience, even if negative or critical. Criticism of a professor or course is allowed. Mild informal language is acceptable.

            2. PENDING — The review is borderline. This includes:
               - Possibly misleading or exaggerated claims with no basis
               - Mildly inappropriate tone but not clearly abusive
               - Suspicious content that may be a troll review or spam
               - Content that warrants a human moderator's judgment

            3. FLAGGED — The review clearly contains one or more of the following:
               - Hate speech, racism, sectarianism, or discrimination
               - Severe personal attacks or threats against a professor or student
               - Explicit sexual content
               - Heavily offensive language in any language including Lebanese Arabizi
                 (examples: kuss, ayre, sharmouta, manyek, and their common variations)
               - Content that is obviously not a course review (complete nonsense, unrelated content)

            Review to analyze:
            \"\"\"
            %s
            \"\"\"

            Respond with ONLY this JSON format, nothing else:
            {
              "verdict": "APPROVED" | "PENDING" | "FLAGGED",
              "reason": "brief reason — required if PENDING or FLAGGED, null if APPROVED"
            }
            """.formatted(comment);
    }

    private FilterResult parseResponse(String responseBody, String originalComment) {
        try {
            JsonNode root    = mapper.readTree(responseBody);
            String   content = root.path("choices").get(0).path("message").path("content").asText();

            // Strip markdown code fences if the model wraps in ```json ... ```
            content = content.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```", "").trim();

            JsonNode result  = mapper.readTree(content);
            String   verdict = result.path("verdict").asText("PENDING").toUpperCase();
            String   reason  = result.path("reason").isNull() ? null : result.path("reason").asText();

            // Sanitize verdict to only accepted values
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