package com.koursekit.model;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class GradeCalculator {

    // Letter grade to GPA points mapping (AUB 4.3 scale)
    private static final Map<String, Double> GRADE_POINTS = new HashMap<>();
    static {
        GRADE_POINTS.put("A+", 4.3);
        GRADE_POINTS.put("A", 4.0);
        GRADE_POINTS.put("A-", 3.7);
        GRADE_POINTS.put("B+", 3.3);
        GRADE_POINTS.put("B", 3.0);
        GRADE_POINTS.put("B-", 2.7);
        GRADE_POINTS.put("C+", 2.3);
        GRADE_POINTS.put("C", 2.0);
        GRADE_POINTS.put("C-", 1.7);
        GRADE_POINTS.put("D+", 1.3);
        GRADE_POINTS.put("D", 1.0);
        GRADE_POINTS.put("F", 0.0);
    }

    // Letter grade to quality points mapping
    public static Map<String, Double> getQualityPoints() {
        Map<String, Double> map = new LinkedHashMap<>();
        map.put("A+", 4.3);
        map.put("A", 4.0);
        map.put("A-", 3.7);
        map.put("B+", 3.3);
        map.put("B", 3.0);
        map.put("B-", 2.7);
        map.put("C+", 2.3);
        map.put("C", 2.0);
        map.put("C-", 1.7);
        map.put("D+", 1.3);
        map.put("D", 1.0);
        map.put("F", 0.0);
        return map;
    }

    // Letter grade to boundaries mapping
    public static Map<String, String> getGradeBoundaries() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("A+", "93–100");
        map.put("A", "87–92");
        map.put("A-", "83–86");
        map.put("B+", "79–82");
        map.put("B", "75–78");
        map.put("B-", "72–74");
        map.put("C+", "69–71");
        map.put("C", "66–68");
        map.put("C-", "63–65");
        map.put("D+", "61–62");
        map.put("D", "60");
        map.put("F", "< 60");
        return map;
    }

    // Course class
    public static class Course {
        public final String name;
        public final String grade;
        public final int credits;

        public Course(String grade, int credits) {
            this("Unknown", grade, credits);
        }

        public Course(String name, String grade, int credits) {
            if (grade == null || grade.trim().isEmpty()) {
                throw new IllegalArgumentException("Grade cannot be empty");
            }
            if (credits < 0) {
                throw new IllegalArgumentException("Credits cannot be negative");
            }

            this.name = name;
            this.grade = grade.trim().toUpperCase();
            this.credits = credits;

            // Validate grade exists in mapping
            if (!GRADE_POINTS.containsKey(this.grade)) {
                throw new IllegalArgumentException("Invalid grade: " + this.grade);
            }
        }

        @Override
        public String toString() {
            return String.format("%s: %s (%d credits)", name, grade, credits);
        }
    }

    // US-09: Semester GPA Calculation
    public static double calculateSemesterGPA(List<Course> courses) {
        if (courses == null || courses.isEmpty()) {
            return 0.0;
        }

        double totalPoints = 0.0;
        int totalCredits = 0;

        for (Course course : courses) {
            if (course.credits == 0) {
                continue; // Skip 0-credit courses
            }

            Double points = GRADE_POINTS.get(course.grade);
            if (points == null) {
                throw new IllegalArgumentException("Invalid grade: " + course.grade);
            }

            totalPoints += points * course.credits;
            totalCredits += course.credits;
        }

        return roundToTwoDecimals(totalCredits == 0 ? 0.0 : totalPoints / totalCredits);
    }

    // Semester class
    public static class Semester {
        public final String semesterName;
        public final double gpa;
        public final int credits;

        public Semester(double gpa, int credits) {
            this("Unknown Semester", gpa, credits);
        }

        public Semester(String semesterName, double gpa, int credits) {
            if (gpa < 0.0 || gpa > 4.3) {
                throw new IllegalArgumentException("GPA must be between 0.0 and 4.3");
            }
            if (credits < 0) {
                throw new IllegalArgumentException("Credits cannot be negative");
            }

            this.semesterName = semesterName;
            this.gpa = gpa;
            this.credits = credits;
        }

        @Override
        public String toString() {
            return String.format("%s: GPA %.2f (%d credits)", semesterName, gpa, credits);
        }
    }

    // US-10: Cumulative GPA Calculation
    public static double calculateCumulativeGPA(List<Semester> semesters) {
        if (semesters == null || semesters.isEmpty()) {
            return 0.0;
        }

        double totalPoints = 0.0;
        int totalCredits = 0;

        for (Semester semester : semesters) {
            if (semester.credits == 0) {
                continue; // Skip semesters with 0 credits
            }
            totalPoints += semester.gpa * semester.credits;
            totalCredits += semester.credits;
        }

        return roundToTwoDecimals(totalCredits == 0 ? 0.0 : totalPoints / totalCredits);
    }

    // Helper method
    private static double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    // Assessment class
    public static class Assessment {
        final String name;
        final double grade;
        final double weight;

        public Assessment(String name, double grade, double weight) {
            if (name == null || name.trim().isEmpty()) {
                throw new IllegalArgumentException("Assessment name cannot be empty");
            }
            if (grade < 0 || grade > 100) {
                throw new IllegalArgumentException("Grade must be between 0 and 100");
            }
            if (weight < 0 || weight > 100) {
                throw new IllegalArgumentException("Weight must be between 0 and 100");
            }

            this.name = name.trim();
            this.grade = grade;
            this.weight = weight;
        }

        @Override
        public String toString() {
            return String.format("%s: %.2f/100 (%.1f%%)", name, grade, weight);
        }
    }

    // US-11: Course Grade Calculation
    public static double calculateCourseGrade(List<Assessment> assessments) {
        if (assessments == null || assessments.isEmpty()) {
            throw new IllegalArgumentException("No assessments provided");
        }

        double totalWeight = 0.0;
        double weightedSum = 0.0;

        for (Assessment a : assessments) {
            weightedSum += a.grade * (a.weight / 100.0);
            totalWeight += a.weight;
        }

        if (totalWeight <= 0) {
            throw new IllegalArgumentException("Total weight must be greater than 0");
        }

        // Normalize by actual total weight so partial grades work correctly
        return roundToTwoDecimals((weightedSum / totalWeight) * 100.0);
    }

    public static String numericToLetterGrade(double numericGrade) {
        if (numericGrade >= 93) return "A+";
        if (numericGrade >= 87) return "A";
        if (numericGrade >= 83) return "A-";
        if (numericGrade >= 79) return "B+";
        if (numericGrade >= 75) return "B";
        if (numericGrade >= 72) return "B-";
        if (numericGrade >= 69) return "C+";
        if (numericGrade >= 66) return "C";
        if (numericGrade >= 63) return "C-";
        if (numericGrade >= 61) return "D+";
        if (numericGrade >= 60) return "D";
        return "F";
    }

    // US-12: Grade Simulation
    public static class SimulationResult {
        public final double simulatedCourseGrade;
        public final String simulatedLetterGrade;
        public final double simulatedSemesterGPA;
        public final double gpaChange;

        public SimulationResult(double courseGrade, String letterGrade, double semesterGPA, double originalGPA) {
            this.simulatedCourseGrade = courseGrade;
            this.simulatedLetterGrade = letterGrade;
            this.simulatedSemesterGPA = semesterGPA;
            this.gpaChange = roundToTwoDecimals(semesterGPA - originalGPA);
        }

        @Override
        public String toString() {
            String changeIndicator = gpaChange > 0 ? "+" : "";
            return String.format(
                "Simulated Course Grade: %.2f (%s) | Semester GPA: %.2f (%s%.2f)",
                simulatedCourseGrade, simulatedLetterGrade, simulatedSemesterGPA, changeIndicator, gpaChange
            );
        }
    }

    public static SimulationResult simulateGradeChange(
            List<Assessment> modifiedAssessments,
            List<Course> allCourses,
            int courseIndex) {

        if (courseIndex < 0 || courseIndex >= allCourses.size()) {
            throw new IllegalArgumentException("Invalid course index");
        }

        // Calculate original GPA for comparison
        double originalGPA = calculateSemesterGPA(allCourses);

        // Calculate simulated course grade
        double simulatedCourseGrade = calculateCourseGrade(modifiedAssessments);
        String simulatedLetterGrade = numericToLetterGrade(simulatedCourseGrade);

        // Create new course list with simulated grade
        List<Course> simulatedCourses = new ArrayList<>();
        for (int i = 0; i < allCourses.size(); i++) {
            if (i == courseIndex) {
                simulatedCourses.add(new Course(
                    allCourses.get(i).name,
                    simulatedLetterGrade,
                    allCourses.get(i).credits
                ));
            } else {
                simulatedCourses.add(allCourses.get(i));
            }
        }

        double simulatedGPA = calculateSemesterGPA(simulatedCourses);
        return new SimulationResult(simulatedCourseGrade, simulatedLetterGrade, simulatedGPA, originalGPA);
    }

    // US-13: Required Final Grade Calculator
    public static class FinalGradeRequirement {
        public final double requiredFinalGrade;
        public final boolean isAchievable;
        public final String message;
        public final String targetLetterGrade;

        public FinalGradeRequirement(double required, boolean achievable, String msg, double targetNumeric) {
            this.requiredFinalGrade = roundToTwoDecimals(required);
            this.isAchievable = achievable;
            this.message = msg;
            this.targetLetterGrade = numericToLetterGrade(targetNumeric);
        }

        @Override
        public String toString() {
            return message;
        }
    }

    public static FinalGradeRequirement calculateRequiredFinalGrade(
            List<Assessment> completedAssessments,
            double finalExamWeight,
            double targetCourseGrade) {

        if (finalExamWeight < 0 || finalExamWeight > 100) {
            throw new IllegalArgumentException("Final exam weight must be between 0 and 100");
        }
        if (targetCourseGrade < 0 || targetCourseGrade > 100) {
            throw new IllegalArgumentException("Target grade must be between 0 and 100");
        }

        double completedWeight = 0.0;
        double currentWeightedSum = 0.0;

        for (Assessment a : completedAssessments) {
            completedWeight += a.weight;
            currentWeightedSum += a.grade * (a.weight / 100.0);
        }

        double totalWeight = completedWeight + finalExamWeight;
        if (Math.abs(totalWeight - 100.0) > 0.01) {
            throw new IllegalArgumentException(
                String.format("Total weights must sum to 100%%. Current: %.2f%% + %.2f%% = %.2f%%",
                    completedWeight, finalExamWeight, totalWeight)
            );
        }

        double requiredFinalGrade = (targetCourseGrade - currentWeightedSum) / (finalExamWeight / 100.0);
        boolean isAchievable = requiredFinalGrade >= 0 && requiredFinalGrade <= 100;

        String message;
        if (requiredFinalGrade < 0) {
            message = String.format(
                "You've already exceeded your target! Current: %.2f, Target: %.2f (%s)",
                currentWeightedSum, targetCourseGrade, numericToLetterGrade(targetCourseGrade)
            );
        } else if (requiredFinalGrade > 100) {
            message = String.format(
                "Target grade (%s) is not achievable. You would need %.2f/100 on the final.",
                numericToLetterGrade(targetCourseGrade), requiredFinalGrade
            );
        } else {
            message = String.format(
                "You need %.2f/100 on the final to achieve %.2f (%s)",
                requiredFinalGrade, targetCourseGrade, numericToLetterGrade(targetCourseGrade)
            );
        }

        return new FinalGradeRequirement(requiredFinalGrade, isAchievable, message, targetCourseGrade);
    }

    // Allow letter grade target
    public static FinalGradeRequirement calculateRequiredFinalGrade(
            List<Assessment> completedAssessments,
            double finalExamWeight,
            String targetLetterGrade) {

        double targetNumeric = getMinimumScoreForGrade(targetLetterGrade);
        return calculateRequiredFinalGrade(completedAssessments, finalExamWeight, targetNumeric);
    }

    // Get minimum score needed for a letter grade
    private static double getMinimumScoreForGrade(String letterGrade) {
        letterGrade = letterGrade.trim().toUpperCase();
        switch (letterGrade) {
            case "A+": return 93.0;
            case "A": return 87.0;
            case "A-": return 83.0;
            case "B+": return 79.0;
            case "B": return 75.0;
            case "B-": return 72.0;
            case "C+": return 69.0;
            case "C": return 66.0;
            case "C-": return 63.0;
            case "D+": return 61.0;
            case "D": return 60.0;
            case "F": return 0.0;
            default: throw new IllegalArgumentException("Invalid letter grade: " + letterGrade);
        }
    }

    // Find highest impact course for GPA improvement (EXTRA FEATURE)
    public static int findHighestImpactCourse(List<Course> courses) {
        double maxImpact = -1;
        int index = -1;

        for (int i = 0; i < courses.size(); i++) {
            Course c = courses.get(i);
            if (c.credits == 0) continue;

            double points = GRADE_POINTS.get(c.grade);
            double impact = points * c.credits;

            if (impact > maxImpact) {
                maxImpact = impact;
                index = i;
            }
        }
        return index;
    }

    // Calculate what GPA you need in remaining semesters to reach target CGPA (EXTRA FEATURE)
    public static double calculateRequiredFutureGPA(
            double currentCGPA,
            int completedCredits,
            double targetCGPA,
            int remainingCredits) {

        if (remainingCredits <= 0) {
            throw new IllegalArgumentException("Remaining credits must be positive");
        }

        double currentPoints = currentCGPA * completedCredits;
        double targetPoints = targetCGPA * (completedCredits + remainingCredits);
        double requiredPoints = targetPoints - currentPoints;
        double requiredGPA = requiredPoints / remainingCredits;

        return roundToTwoDecimals(requiredGPA);
    }
}
