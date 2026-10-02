package com.waynexo.repo;

import com.waynexo.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    Optional<Vehicle> findByCode(String code);
    List<Vehicle> findAllByOrderByIdAsc();
    long countByType(VehicleType type);
    long countByState(VehicleState state);
    long countByTypeAndStateIn(VehicleType type, Collection<VehicleState> states);
}
