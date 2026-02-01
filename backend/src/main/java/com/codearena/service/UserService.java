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

    public UserProfileResponse getUserProfile(String id) {
        User user = userRepository.findById(id)
                .or(() -> userRepository.findByUsername(id)) // Fallback search by username if ID lookup fails
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

    @org.springframework.transaction.annotation.Transactional
    public User syncUser(String id, String email, String username, boolean isAdmin) {
        User user = userRepository.findById(id).orElseGet(() -> {
            User newUser = new User();
            newUser.setId(id);
            newUser.setEmail(email);
            newUser.setUsername(username);
            newUser.setPassword(""); // No password for external auth
            newUser.setRating(1200);
            newUser.setProblemsSolved(0);
            return newUser; // Don't save yet
        });

        // Always ensure email/username are up to date
        user.setEmail(email);
        if (username != null)
            user.setUsername(username);

        // Sync Roles
        if (isAdmin) {
            user.getRoles().add("ROLE_ADMIN");
        } else {
            // Optional: Remove admin if not in JWT? careful with this.
            // For safety, let's only ADD admin if JWT says so, but not remove it
            // automatically
            // to prevent accidental lockouts if JWT is just a standard login.
            // Actually, if using service_role, it's definitely admin.
        }

        return userRepository.save(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public void grantAdmin(com.codearena.dto.GrantAdminRequest request) {
        // Try to find user by ID first, then email
        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId()).orElse(null);
        }

        if (user == null && request.getEmail() != null) {
            user = userRepository.findByEmail(request.getEmail()).orElse(null);
        }

        // If still null, we need to provision the user (JIT via Admin)
        if (user == null) {
            if (request.getUserId() == null || request.getEmail() == null) {
                throw new RuntimeException("User not found and insufficient details to provision (need ID and Email)");
            }

            user = new User();
            user.setId(request.getUserId());
            user.setEmail(request.getEmail());
            user.setUsername(request.getUsername() != null ? request.getUsername() : request.getEmail().split("@")[0]);
            user.setPassword("");
            user.setRating(1200);
            user.setProblemsSolved(0);
        }

        // Ensure Admin Role
        if (!user.getRoles().contains("ROLE_ADMIN")) {
            user.getRoles().add("ROLE_ADMIN");
        }

        userRepository.save(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public void revokeAdmin(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        user.getRoles().remove("ROLE_ADMIN");
        userRepository.save(user);
    }

    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
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
                null // avatarUrl not stored in User entity currently, handled by Supabase storage
                     // directly usually
        );
    }
}
