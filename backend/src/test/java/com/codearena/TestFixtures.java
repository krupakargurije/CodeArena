package com.codearena;

import com.codearena.common.security.JwtTokenProvider;
import com.codearena.problems.entity.Problem;
import com.codearena.problems.entity.Submission;
import com.codearena.profile.entity.User;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

public class TestFixtures {

    public static User createUser(String username, String email, String rawPassword, PasswordEncoder passwordEncoder, String... roles) {
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder != null ? passwordEncoder.encode(rawPassword) : rawPassword);
        user.setRating(1200);
        user.setProblemsSolved(0);
        user.setBio("Test user bio");
        user.setCountry("US");
        user.setOrganization("CodeArena");
        Set<String> roleSet = new HashSet<>();
        if (roles != null && roles.length > 0) {
            roleSet.addAll(Arrays.asList(roles));
        } else {
            roleSet.add("ROLE_USER");
        }
        user.setRoles(roleSet);
        return user;
    }

    public static String generateTokenForUser(User user, JwtTokenProvider jwtTokenProvider) {
        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
        org.springframework.security.core.userdetails.User userDetails =
                new org.springframework.security.core.userdetails.User(user.getId(), user.getPassword(), authorities);
        return jwtTokenProvider.generateToken(userDetails);
    }

    public static Problem createProblem(String title, Problem.Difficulty difficulty) {
        Problem p = new Problem();
        p.setTitle(title);
        p.setDescription("Problem description for " + title);
        p.setDifficulty(difficulty);
        p.setTags(new ArrayList<>(List.of("algorithms", "test")));
        p.setInputFormat("Sample input format");
        p.setOutputFormat("Sample output format");
        p.setConstraints("1 <= N <= 10^5");
        p.setSampleInput("1 2");
        p.setSampleOutput("3");
        p.setExplanation("Sample explanation");
        p.setTotalSubmissions(0);
        p.setAcceptedSubmissions(0);
        p.setAcceptanceRate(0.0);
        return p;
    }

    public static Submission createSubmission(User user, Problem problem, String code, String language, Submission.Status status) {
        Submission s = new Submission();
        s.setUser(user);
        s.setProblem(problem);
        s.setCode(code);
        s.setLanguage(language);
        s.setStatus(status);
        s.setSubmittedAt(LocalDateTime.now());
        s.setExecutionTime(10);
        s.setMemoryUsed(20);
        s.setTestCasesPassed(1);
        s.setTotalTestCases(1);
        return s;
    }
}
