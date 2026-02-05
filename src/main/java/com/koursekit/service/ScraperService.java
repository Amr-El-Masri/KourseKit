package com.koursekit.service;

import com.koursekit.model.*;
import com.koursekit.repository.*;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ScraperService {

    @Autowired private CourseRepository courseRepo;
    @Autowired private SectionRepository sectionRepo;

    @Transactional
    public void scrapeCourseCatalogue() {
        // The base URL without the letter
        String baseUrl = "https://www-banner.aub.edu.lb/catalog/schd_";

        for (char alphabet = 'A'; alphabet <= 'Z'; alphabet++) {
            String url = baseUrl + alphabet + ".htm";
            System.out.println(">>> Scraping Letter: " + alphabet + " (" + url + ")");

            try {
                Document doc = Jsoup.connect(url)
                        .userAgent("Mozilla/5.0")
                        .timeout(60000) // timeout to handle slow responses, i put as 60 sec cz pages like "E" are large cz many courses start with E
                        .maxBodySize(0)  // Unlimited size for large pages like 'E'
                        .get();

                Elements rows = doc.select("table tr");

                for (Element row : rows) {
                    Elements cols = row.select("td");

                    if (cols.size() > 35) {
                        String semester = cols.get(0).text().trim();

                        if (!semester.contains("Spring 2025-2026")) {
                            continue; // Skip Fall or other semesters
                        }

                        String crn = cols.get(1).text().trim();
                        String subject = cols.get(2).text().trim();
                        String crseNum = cols.get(3).text().trim();
                        String sectionNum = cols.get(4).text().trim();
                        String title = cols.get(5).text().trim();
                        String prof = cols.get(33).text().trim() + " " + cols.get(34).text().trim();

                        /* Filter out placeholders, idk if keep
                        if (prof.equals(". .") || prof.toLowerCase().contains("tba")) {
                            continue;
                        }*/

                        String fullCode = subject + " " + crseNum;

                        // Save Course logic
                        Course course = courseRepo.findByCourseCode(fullCode)
                                .orElseGet(() -> courseRepo.save(new Course(fullCode, title)));

                        // Save Section logic
                        if (!sectionRepo.existsByCrn(crn)) {
                            Section section = new Section();
                            section.setCrn(crn);
                            section.setSectionNumber(sectionNum);
                            section.setProfessorName(prof);
                            section.setCourse(course);
                            sectionRepo.save(section);
                            System.out.println("Imported: " + fullCode + " (" + sectionNum + ") - " + prof);
                        }
                    }
                }

                // Short pause to be gentle on the AUB server, so my ip doesnt get flagged
                Thread.sleep(500);

            }
            catch (java.net.SocketTimeoutException e) {
                System.err.println("Timeout on letter " + alphabet + ". The page is likely too large. Skipping to next letter.");
            }
            catch (Exception e) {
                //err to know if something fails
                System.err.println("Could not scrape letter " + alphabet + ": " + e.getMessage());
            }
        }
    }
}