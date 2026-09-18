package com.codearena.leaderboard.service;

import com.codearena.profile.dto.UserProfileResponse;
import com.codearena.profile.entity.User;
import com.codearena.profile.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final UserRepository userRepository;

    public List<UserProfileResponse> getLeaderboard() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "rating"))
                .stream()
                .limit(100)
                .map(this::toProfileResponse)
                .collect(Collectors.toList());
    }

    private UserProfileResponse toProfileResponse(User user) {
        boolean isAdmin = user.getRoles().contains("ROLE_ADMIN");
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getBio(),
                user.getCountry(),
                user.getOrganization(),
                user.getRating(),
                user.getProblemsSolved(),
                isAdmin,
                user.getCreatedAt(),
                null
        );
    }
}
