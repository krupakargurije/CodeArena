package com.codearena.repository;

import com.codearena.entity.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

    List<RoomParticipant> findByRoomIdAndLeftAtIsNull(String roomId);

    Optional<RoomParticipant> findByRoomIdAndUserIdAndLeftAtIsNull(String roomId, String userId);

    boolean existsByRoomIdAndUserIdAndLeftAtIsNull(String roomId, String userId);

    @Query("SELECT rp FROM RoomParticipant rp JOIN FETCH rp.room r WHERE rp.userId = :userId AND rp.leftAt IS NULL ORDER BY rp.joinedAt DESC")
    List<RoomParticipant> findActiveRoomsByUserId(@Param("userId") String userId);

    long countByRoomIdAndLeftAtIsNull(String roomId);

    long countByLeftAtIsNull();

    List<RoomParticipant> findByUserId(String userId);
}
