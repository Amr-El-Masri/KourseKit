package meme.reviewtool;

import meme.reviewtool.service.ScraperService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ReviewToolApplication {

    public static void main(String[] args) {
        SpringApplication.run(ReviewToolApplication.class, args);
    }

    @Bean
    CommandLineRunner start(ScraperService scraperService, meme.reviewtool.repository.CourseRepository courseRepo) { // Add repo here
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