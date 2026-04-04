package com.koursekit.service;

import com.koursekit.model.*;
import com.koursekit.repository.*;
import org.jsoup.Jsoup;
import java.util.List;
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
                Document doc = null;
                int attempts = 0;
                while (doc == null && attempts < 3) {
                    try {
                        attempts++;
                        doc = Jsoup.connect(url)
                                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                                .timeout(120000)  // 2 minutes
                                .maxBodySize(0)
                                .get();
                    } catch (java.net.SocketTimeoutException ex) {
                        System.err.println("Timeout attempt " + attempts + " for letter " + alphabet + ". Retrying...");
                        if (attempts >= 3) {
                            System.err.println("Giving up on letter " + alphabet + " after 3 attempts.");
                        }
                        Thread.sleep(10000); // wait 3 seconds before retry
                    }
                }
                if (doc == null) continue;

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
                        Course course = courseRepo.findByCourseCodeIgnoreCase(fullCode)
                                .orElseGet(() -> courseRepo.save(new Course(fullCode, title)));

                        // Save Section logic
                        String creditHoursStr = cols.get(6).text().trim();
                        String sectionType    = cols.get(7).text().trim();
                        String college        = cols.get(8).text().trim();
                        String actualEnrolStr = cols.get(9).text().trim();
                        String seatsAvailStr  = cols.get(10).text().trim();
                        String beginTime1     = cols.get(11).text().trim();
                        String endTime1       = cols.get(12).text().trim();
                        String building1      = cols.get(13).text().trim();
                        String room1          = cols.get(14).text().trim();

                        // Days slot 1: columns 15-21 are individual day letters (M, T, W, R, F, S, U)
                        // The scraper page uses individual td cells per day — collect non-empty ones
                        String[] dayLabels1 = {"M","T","W","R","F","S","U"};
                        StringBuilder days1Builder = new StringBuilder();
                        for (int i = 0; i < 7; i++) {
                            String d = cols.get(15 + i).text().trim();
                            if (!d.isEmpty() && !d.equals(".")) {
                                if (days1Builder.length() > 0) days1Builder.append(" ");
                                days1Builder.append(d);
                            }
                        }
                        String days1 = days1Builder.toString();

                        String beginTime2 = cols.get(22).text().trim();
                        String endTime2   = cols.get(23).text().trim();
                        String building2  = cols.get(24).text().trim();
                        String room2      = cols.get(25).text().trim();

                        StringBuilder days2Builder = new StringBuilder();
                        for (int i = 0; i < 7; i++) {
                            String d = cols.get(26 + i).text().trim();
                            if (!d.isEmpty() && !d.equals(".")) {
                                if (days2Builder.length() > 0) days2Builder.append(" ");
                                days2Builder.append(d);
                            }
                        }
                        String days2 = days2Builder.toString();

                        String linkedCrns = cols.size() > 35 ? cols.get(35).text().trim() : "";

                        // Parse integers safely
                        int creditHours = 0;
                        int seatsAvail  = 0;
                        int actualEnrol = 0;
                        try { creditHours = Integer.parseInt(creditHoursStr); } catch (Exception ignored) {}
                        try { seatsAvail  = Integer.parseInt(seatsAvailStr);  } catch (Exception ignored) {}
                        try { actualEnrol = Integer.parseInt(actualEnrolStr); } catch (Exception ignored) {}

                        // Save Section logic
                        if (sectionRepo.existsByCrn(crn)) {
                            sectionRepo.findByCrn(crn).ifPresent(existing -> {
                                existing.setSectionType(sectionType.isEmpty() ? null : sectionType);
                                existing.setLinkedCrns(linkedCrns.isEmpty() ? null : linkedCrns);
                                sectionRepo.save(existing);
                            });
                        } else {
                            Section section = new Section();
                            section.setCrn(crn);
                            section.setSectionNumber(sectionNum);
                            section.setProfessorName(prof);
                            section.setCourse(course);
                            section.setCreditHours(creditHours);
                            section.setCollege(college);
                            section.setSeatsAvailable(seatsAvail);
                            section.setActualEnrolment(actualEnrol);
                            section.setBeginTime1(beginTime1);
                            section.setEndTime1(endTime1);
                            section.setBuilding1(building1);
                            section.setRoom1(room1);
                            section.setDays1(days1);
                            section.setBeginTime2(beginTime2);
                            section.setEndTime2(endTime2);
                            section.setBuilding2(building2);
                            section.setRoom2(room2);
                            section.setDays2(days2);
                            section.setSectionType(sectionType.isEmpty() ? null : sectionType);
                            section.setLinkedCrns(linkedCrns.isEmpty() ? null : linkedCrns);
                            sectionRepo.save(section);
                            System.out.println("Imported: " + fullCode + " (" + sectionNum + ") - " + prof);
                        }
                    }
                }

                // Short pause to be gentle on the AUB server, so my ip doesnt get flagged
                Thread.sleep(3000);

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