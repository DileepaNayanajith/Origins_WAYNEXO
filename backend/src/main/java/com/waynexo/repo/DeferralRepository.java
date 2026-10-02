package com.waynexo.repo;

import com.waynexo.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DeferralRepository extends JpaRepository<Deferral, Long> {
    List<Deferral> findByResolvedFalseOrderByIdAsc();
    long countByResolvedFalse();
    Optional<Deferral> findFirstByOrderAndResolvedFalse(StockOrder order);
    List<Deferral> findByOrder_OutletOrderByCreatedAtDesc(Outlet outlet);
}
