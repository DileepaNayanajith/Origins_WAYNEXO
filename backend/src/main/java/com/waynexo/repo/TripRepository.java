package com.waynexo.repo;

import com.waynexo.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TripRepository extends JpaRepository<Trip, Long> {
    boolean existsByVehicleAndStatusNot(Vehicle vehicle, TripStatus status);
    List<Trip> findByTripDateAndDriverOrderByNumberAsc(LocalDate date, AppUser driver);
    List<Trip> findByTripDateOrderByIdAsc(LocalDate date);
    List<Trip> findByStatusOrderByIdAsc(TripStatus status);
    List<Trip> findByTripDateAndVehicleOrderByNumberAsc(LocalDate date, Vehicle vehicle);
}
