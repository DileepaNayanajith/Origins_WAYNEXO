package com.waynexo.service;

import com.waynexo.domain.AppUser;
import com.waynexo.domain.Depot;
import com.waynexo.domain.Outlet;
import com.waynexo.dto.AuthDtos;

/** Entity -> DTO helpers shared by the controllers. */
public final class Mapper {
    private Mapper() {}

    public static AuthDtos.DepotDto depot(Depot d) {
        return d == null ? null : new AuthDtos.DepotDto(d.getCode(), d.getName(), d.getShortName());
    }

    public static AuthDtos.OutletDto outlet(Outlet o) {
        return o == null ? null : new AuthDtos.OutletDto(o.getId(), o.getCode(), o.getBrand().name(), o.getName(), o.getArea(),
                o.getDistrict(), o.getOutletNo(), Labels.outletFull(o),
                Labels.brandTitle(o.getBrand()) + " Outlet • " + o.getDepot().getShortName() + " #" + String.format("%02d", o.getOutletNo()));
    }

    public static AuthDtos.UserDto user(AppUser u) {
        return new AuthDtos.UserDto(u.getId(), u.getFullName(), Labels.initials(u.getFullName()), u.getRole().name(), u.getTitle(),
                u.getEmployeeId(), u.getEmail(), u.getAvatar(), depot(u.getDepot()), outlet(u.getOutlet()), u.getVehicleCode());
    }
}
