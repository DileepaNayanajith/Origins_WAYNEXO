package com.waynexo.repo;

import com.waynexo.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OutletRepository extends JpaRepository<Outlet, Long> {
    Optional<Outlet> findByCode(String code);
    long countByBrand(Brand brand);
    List<Outlet> findAllByOrderByOutletNoAsc();
}
