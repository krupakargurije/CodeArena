package com.codearena.profile.repository;

import com.codearena.profile.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles WHERE u.id = :identifier OR u.username = :identifier OR u.email = :identifier")
    Optional<User> findByIdentifierWithRoles(@Param("identifier") String identifier);

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles")
    List<User> findAllWithRoles();

    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.roles ORDER BY u.rating DESC")
    List<User> findAllOrderByRatingDescWithRoles();

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Boolean existsByUsername(String username);

    Boolean existsByEmail(String email);
}
