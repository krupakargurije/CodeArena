package com.codearena.monitoring.repository;

import com.codearena.monitoring.entity.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

    @Query("SELECT i FROM Incident i WHERE i.incidentKey = :key AND i.status IN ('OPEN', 'ACKNOWLEDGED')")
    Optional<Incident> findActiveByIncidentKey(@Param("key") String key);

    List<Incident> findByStatusInOrderByLastSeenAtDesc(List<Incident.Status> statuses);

    Page<Incident> findByStatus(Incident.Status status, Pageable pageable);

    Page<Incident> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(Incident.Status status);

    long countByStatusIn(List<Incident.Status> statuses);
}
