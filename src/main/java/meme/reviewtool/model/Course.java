package meme.reviewtool.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Table(name = "courses")
@Data
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String courseCode; // e.g., CMPS 200
    private String title;

    @JsonIgnore
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private List<Section> sections;

    public Course() {}
    public Course(String courseCode, String title) {
        this.courseCode = courseCode;
        this.title = title;
    }
}