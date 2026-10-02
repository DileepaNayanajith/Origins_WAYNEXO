package com.waynexo.web;

import com.waynexo.domain.*;
import com.waynexo.dto.AuthDtos.*;
import com.waynexo.repo.*;
import com.waynexo.security.AuthContext;
import com.waynexo.security.JwtService;
import com.waynexo.security.PasswordHasher;
import com.waynexo.service.Labels;
import com.waynexo.service.Mapper;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AppUserRepository users;
    private final VehicleRepository vehicles;
    private final OutletRepository outlets;
    private final DepotRepository depots;
    private final PasswordHasher hasher;
    private final JwtService jwt;
    private final AuthContext auth;

    public AuthController(AppUserRepository users, VehicleRepository vehicles, OutletRepository outlets, DepotRepository depots,
                          PasswordHasher hasher, JwtService jwt, AuthContext auth) {
        this.users = users; this.vehicles = vehicles; this.outlets = outlets; this.depots = depots;
        this.hasher = hasher; this.jwt = jwt; this.auth = auth;
    }

    @PostMapping("/auth/login")
    @Transactional
    public LoginResponse login(@RequestBody LoginRequest req) {
        String id = req.identifier() == null ? "" : req.identifier().trim();
        if (id.isEmpty()) throw ApiException.badRequest("Enter your email or employee ID");

        AppUser user = users.findByEmailIgnoreCase(id)
                .or(() -> users.findByEmployeeIdIgnoreCase(id))
                .or(() -> users.findByUsernameIgnoreCase(id))
                .orElseThrow(() -> ApiException.unauthorized("We couldn't find that account"));

        boolean dockBadge = "LOADER".equalsIgnoreCase(req.portal()) && user.getRole() == Role.LOADER;
        if (dockBadge) {
            // Dock terminals sign loaders in with their badge/employee ID at the selected depot.
            if (req.depotCode() != null) depots.findByCode(req.depotCode()).ifPresent(user::setDepot);
        } else {
            if (user.getPasswordHash() == null) throw ApiException.unauthorized("Use the dock terminal badge sign-in for this account");
            if (!hasher.matches(req.password(), user.getPasswordHash())) throw ApiException.unauthorized("Incorrect password");
        }

        if (user.getRole() == Role.DRIVER && req.vehicleCode() != null && !req.vehicleCode().isBlank()) {
            Vehicle v = vehicles.findByCode(req.vehicleCode()).orElseThrow(() -> ApiException.badRequest("Unknown vehicle"));
            user.setVehicleCode(v.getCode());
        }
        if (user.getRole() == Role.STORE_MANAGER && req.outletCode() != null && !req.outletCode().isBlank()) {
            // Managers covering several outlets pick the one they are working at today.
            outlets.findByCode(req.outletCode()).ifPresent(user::setOutlet);
        }
        return new LoginResponse(jwt.issue(user.getId(), user.getRole()), Mapper.user(user));
    }

    @GetMapping("/auth/me")
    public UserDto me() {
        return Mapper.user(auth.user());
    }

    /** Dropdown data for the login screens (no sign-in needed). */
    @GetMapping("/public/login-options")
    @Transactional(readOnly = true)
    public LoginOptions loginOptions() {
        List<Option> v = vehicles.findAllByOrderByIdAsc().stream()
                .filter(x -> x.getState() != VehicleState.IN_WORKSHOP)
                .sorted(Comparator.comparing(Vehicle::getCode))
                .map(x -> new Option(x.getCode(), Labels.plate(x) + " (" + x.getModel() + ")", x.getDepot().getShortName()))
                .toList();
        List<Option> o = outlets.findAllByOrderByOutletNoAsc().stream()
                .map(x -> new Option(x.getCode(), Labels.outletFull(x), x.getBrand().name()))
                .toList();
        List<Option> d = depots.findAll().stream().map(x -> new Option(x.getCode(), x.getName(), x.getShortName())).toList();
        return new LoginOptions(v, o, d);
    }

}
