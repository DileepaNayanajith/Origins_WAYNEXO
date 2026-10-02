package com.waynexo.repo;

import com.waynexo.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface StockOrderRepository extends JpaRepository<StockOrder, Long> {
    Optional<StockOrder> findByCode(String code);
    long countByPlacedDate(LocalDate date);
    List<StockOrder> findByPlacedDateOrderByIdAsc(LocalDate date);
    List<StockOrder> findByOutletOrderByPlacedDateDescIdDesc(Outlet outlet);
    List<StockOrder> findByStatusOrderByIdAsc(OrderStatus status);
    List<StockOrder> findByVehicleAndStatus(Vehicle vehicle, OrderStatus status);
    List<StockOrder> findByOutletAndStatusOrderByDeliveryDateAsc(Outlet outlet, OrderStatus status);
    List<StockOrder> findByOutletAndDeliveryDateBetweenOrderByDeliveryDateAsc(Outlet outlet, LocalDate from, LocalDate to);
}
