package com.waynexo.service;

import com.waynexo.domain.*;
import com.waynexo.dto.AuthDtos.*;
import com.waynexo.repo.*;
import com.waynexo.web.ApiException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class UserConfiguration {
    private final AppUserRepository users;
    private final VehicleRepository vehicles;
    private final OutletRepository outlets;
    private final DepotRepository depots;
    public UserConfiguration(VehicleRepository vehicles, OutletRepository outlets, DepotRepository depots, AppUserRepository users) {
        this.users = users; this.vehicles = vehicles; this.outlets = outlets; this.depots = depots;
    }
    @Transactional(readOnly = true)
    public SetupResponse describe(AppUser account) {
        AppUser u = users.findById(account.getId()).orElseThrow(() -> ApiException.unauthorized("Unknown user"));
        List<SetupField> fields = new ArrayList<>();
        switch (u.getRole()) {
            case DRIVER -> {
                if (u.getDepot() == null || u.getVehicleCode() == null || vehicles.findByCode(u.getVehicleCode()).filter(v -> v.getState() != VehicleState.IN_WORKSHOP).isEmpty())
                    fields.add(new SetupField("vehicleCode", "Vehicle", vehicles.findAllByOrderByIdAsc().stream()
                        .filter(v -> v.getState() != VehicleState.IN_WORKSHOP && (u.getDepot() == null || Objects.equals(v.getDepot().getId(), u.getDepot().getId())))
                        .map(v -> new Option(v.getCode(), Labels.plate(v) + " (" + v.getModel() + ")", v.getDepot().getShortName())).toList()));
            }
            case LOADER -> {
                if (u.getDepot() == null) fields.add(new SetupField("depotCode", "Loading hub", depots.findAll().stream()
                    .map(d -> new Option(d.getCode(), d.getName(), d.getShortName())).toList()));
            }
            case STORE_MANAGER -> {
                if (u.getDepot() == null || u.getOutlet() == null) fields.add(new SetupField("outletCode", "Store / branch", outlets.findAllByOrderByOutletNoAsc().stream()
                    .filter(o -> u.getDepot() == null || Objects.equals(o.getDepot().getId(), u.getDepot().getId()))
                    .map(o -> new Option(o.getCode(), Labels.outletFull(o), o.getBrand().name())).toList()));
            }
            case DISPATCHER -> { /* Global control tower has no required selection. */ }
        }
        return new SetupResponse(fields);
    }
    @Transactional
    public void save(AppUser u, SetupRequest r) {
        Map<String, String> supplied = new HashMap<>();
        supplied.put("vehicleCode", r.vehicleCode()); supplied.put("depotCode", r.depotCode()); supplied.put("outletCode", r.outletCode());
        List<SetupField> fields = describe(u).fields();
        Set<String> allowed = new HashSet<>();
        for (SetupField f : fields) allowed.add(f.name());
        for (var e : supplied.entrySet()) if (e.getValue() != null && !allowed.contains(e.getKey()))
            throw ApiException.badRequest("This configuration is not required for your account");
        for (SetupField f : fields) {
            String value = supplied.get(f.name());
            if (value == null || f.options().stream().noneMatch(o -> o.value().equals(value)))
                throw ApiException.badRequest("Select a valid " + f.label().toLowerCase());
        }
        // Validate every value before mutating the user; never accept role or user id from the client.
        if (allowed.contains("vehicleCode")) {
            Vehicle v = vehicles.findByCode(r.vehicleCode()).orElseThrow(() -> ApiException.badRequest("Unknown vehicle"));
            u.setVehicleCode(v.getCode()); u.setDepot(v.getDepot());
        }
        if (allowed.contains("depotCode")) u.setDepot(depots.findByCode(r.depotCode()).orElseThrow(() -> ApiException.badRequest("Unknown hub")));
        if (allowed.contains("outletCode")) {
            Outlet o = outlets.findByCode(r.outletCode()).orElseThrow(() -> ApiException.badRequest("Unknown branch"));
            u.setOutlet(o); u.setDepot(o.getDepot());
        }
    }
}
