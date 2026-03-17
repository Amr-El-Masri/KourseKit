package com.koursekit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class TranscriptService {

    @Value("${openai.api.key:}")
    private String apiKey;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newHttpClient();

    public List<Map<String, Object>> extract(MultipartFile file) throws Exception {
        String text = extractText(file);
        if (text.isBlank()) throw new IllegalArgumentException("Could not extract text from file.");
        if (text.length() > 30000) text = text.substring(0, 30000);
        return callOpenAI(text);
    }

    private String extractText(MultipartFile file) throws Exception {
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (name.endsWith(".pdf")) {
            try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
                PDFTextStripper stripper = new PDFTextStripper();
                stripper.setSortByPosition(true);
                return stripper.getText(doc);
            }
        }
        return new String(file.getBytes(), StandardCharsets.UTF_8);
    }

    private List<Map<String, Object>> callOpenAI(String transcriptText) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("OPENAI_API_KEY is not configured.");
        }

        String prompt = """
            Extract all completed semesters from this academic transcript and return ONLY a valid JSON array (no markdown, no explanation).

            Return this exact structure:
            [
              {
                "semesterName": "string (e.g. Fall 23-24, Spring 24-25, Summer 23-24)",
                "courses": [
                  {
                    "courseCode": "string (e.g. CMPS 200)",
                    "credits": number,
                    "grade": "letter grade: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, or F"
                  }
                ]
              }
            ]

            Rules:
            - Use AUB-style semester names: Fall YY-YY, Spring YY-YY, Summer YY-YY (e.g. "Fall 23-24")
            - Only include courses with a final letter grade (skip in-progress, withdrawn, or transfer credits)
            - Convert numeric grades to letter grades if needed
            - Include ALL completed semesters found

            Transcript:
            """ + transcriptText;

        String body = mapper.writeValueAsString(Map.of(
            "model", "gpt-4o-mini",
            "max_tokens", 4000,
            "messages", List.of(
                Map.of("role", "system", "content", "You are an assistant that extracts structured semester data from academic transcripts. Return only a valid JSON array."),
                Map.of("role", "user", "content", prompt)
            )
        ));

        HttpRequest req = HttpRequest.newBuilder()
            .uri(URI.create("https://api.openai.com/v1/chat/completions"))
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() != 200) {
            throw new RuntimeException("OpenAI API error: " + res.statusCode() + " " + res.body());
        }

        JsonNode root = mapper.readTree(res.body());
        String content = root.path("choices").get(0).path("message").path("content").asText();
        content = content.strip();
        if (content.startsWith("```")) {
            content = content.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").strip();
        }
        return mapper.readValue(content, new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});
    }
}
