package com.waynexo.repo;

import com.waynexo.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OpsEventRepository extends JpaRepository<OpsEvent, Long> {
    List<OpsEvent> findTop20ByKindAndResolvedFalseOrderByCreatedAtDesc(EventKind kind);
}
