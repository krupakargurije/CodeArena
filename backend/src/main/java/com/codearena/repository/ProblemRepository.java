package com.codearena.repository;

import com.codearena.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByDifficulty(Problem.Difficulty difficulty);
    boolean existsByTitle(String title);
    java.util.Optional<Problem> findByTitle(String title);

    // List<Problem> findByTagsContaining(String tag);
}
