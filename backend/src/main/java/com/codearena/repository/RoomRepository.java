package com.codearena.repository;

import com.codearena.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, String> {

    List<Room> findByCreatedBy(String createdBy);

    List<Room> findByStatus(Room.RoomStatus status);

    @Query("SELECT r FROM Room r LEFT JOIN FETCH r.participants WHERE r.id = :id")
    Optional<Room> findByIdWithParticipants(@Param("id") String id);

    // Note: Use findByIdWithParticipants instead as problem relationship was
    // removed

    boolean existsById(String id);
}
