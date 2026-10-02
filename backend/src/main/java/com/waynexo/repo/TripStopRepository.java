package com.waynexo.repo;

import com.waynexo.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TripStopRepository extends JpaRepository<TripStop, Long> {
    List<TripStop> findByTripOrderBySeqAsc(Trip trip);
    List<TripStop> findByOrder(StockOrder order);
}
