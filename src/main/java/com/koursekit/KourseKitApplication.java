package com.koursekit;

import com.koursekit.service.ScraperService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class KourseKitApplication {

    public static void main(String[] args) {
        SpringApplication.run(KourseKitApplication.class, args);
    }

    @Bean
    CommandLineRunner start(ScraperService scraperService, com.koursekit.repository.CourseRepository courseRepo) { // Add repo here
        return args -> {
            if (courseRepo.count() == 0) { // Now this will work
                System.out.println("DB Empty. Starting Scraper...");
                scraperService.scrapeCourseCatalogue();
                System.out.println("done scraping");
            } else {
                System.out.println("Data already exists. Skipping Scraper.");
            }
            System.out.println("Backend now running.");
        };
    }
}