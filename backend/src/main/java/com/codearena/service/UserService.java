package com.codearena.service;

import com.codearena.dto.UserProfileResponse;
import com.codearena.entity.User;
import com.codearena.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileResponse getUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toProfileResponse(user);
    }

    public UserProfileResponse getUserProfile(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toProfileResponse(user);
    }

    public List<UserProfileResponse> getLeaderboard() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "rating"))
                .stream()
                .limit(100)
                .map(this::toProfileResponse)
                .collect(Collectors.toList());
    }

    public User updateProfile(String username, User updates) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.getBio() != null)
            user.setBio(updates.getBio());
        if (updates.getCountry() != null)
            user.setCountry(updates.getCountry());
        if (updates.getOrganization() != null)
            user.setOrganization(updates.getOrganization());

        return userRepository.save(user);
    }

    private UserProfileResponse toProfileResponse(User user) {
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getBio(),
                user.getCountry(),
                user.getOrganization(),
                user.getRating(),
                user.getProblemsSolved());
    }
}
