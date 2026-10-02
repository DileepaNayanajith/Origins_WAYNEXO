package com.waynexo.dto;

import java.util.List;

public final class AuthDtos {
    private AuthDtos() {}

    /**
     * identifier = email, employee ID or username. portal tells which login screen was used
     * (DISPATCHER / STORE / DRIVER / LOADER); the user's own role always decides the interface.
     */
    public record LoginRequest(String identifier, String password, String portal, String vehicleCode, String depotCode, String outletCode) {}

    public record DepotDto(String code, String name, String shortName) {}

    public record OutletDto(Long id, String code, String brand, String name, String area, String district, int outletNo, String label,
                            String consoleLabel) {}

    public record UserDto(Long id, String fullName, String initials, String role, String title, String employeeId, String email,
                          String avatar, DepotDto depot, OutletDto outlet, String vehicleCode) {}

    public record LoginResponse(String token, UserDto user) {}

    public record Option(String value, String label, String tag) {}

    public record LoginOptions(List<Option> vehicles, List<Option> outlets, List<Option> depots) {}
}
