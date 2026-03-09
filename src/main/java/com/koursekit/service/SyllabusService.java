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
public class SyllabusService {

    @Value("${openai.api.key:}")
    private String apiKey;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newHttpClient();

    public Map<String, Object> extract(MultipartFile file) throws Exception {
        String text = extractText(file);
        if (text.isBlank()) throw new IllegalArgumentException("Could not extract text from file.");
        if (text.length() > 12000) text = text.substring(0, 12000);
        return callOpenAI(text);
    }

    private String extractText(MultipartFile file) throws Exception {
        String name = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (name.endsWith(".pdf")) {
            try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
                return new PDFTextStripper().getText(doc);
            }
        }
        return new String(file.getBytes(), StandardCharsets.UTF_8);
    }

    private Map<String, Object> callOpenAI(String syllabusText) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("OPENAI_API_KEY is not configured.");
        }

        String prompt = """
            Extract the following information from this course syllabus and return ONLY valid JSON (no markdown, no explanation).

            Return this exact JSON structure (use null for missing fields, empty arrays if none found):
            {
              "courseCode": "string or null",
              "credits": number or null,
              "professor": "string or null",
              "finalExamWeight": number or null,
              "assessments": [{"name": "string", "weight": number}],
              "deadlines": [{"title": "string", "date": "string", "type": "string"}],
              "gradingScale": {"A": "string", "B": "string", "C": "string"} or null,
              "officeHours": [{"day": "string", "time": "string", "location": "string"}]
            }

            Syllabus:
            """ + syllabusText;

        String body = mapper.writeValueAsString(Map.of(
            "model", "gpt-4o-mini",
            "max_tokens", 1024,
            "messages", List.of(
                Map.of("role", "system", "content", "You are a helpful assistant that extracts structured data from course syllabi. Return only valid JSON."),
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
        // Strip markdown code fences if present
        content = content.strip();
        if (content.startsWith("```")) {
            content = content.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").strip();
        }
        return mapper.readValue(content, Map.class);
    }
}
