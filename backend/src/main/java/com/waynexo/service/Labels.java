package com.waynexo.service;

import com.waynexo.domain.*;

import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/** Display strings shared by every interface (kept on the server so all clients agree). */
public final class Labels {

    private Labels() {}

    private static final DateTimeFormatter MONTH_DAY = DateTimeFormatter.ofPattern("MMM d", Locale.ENGLISH);
    private static final DateTimeFormatter LONG = DateTimeFormatter.ofPattern("MMM dd, yyyy", Locale.ENGLISH);

    public static String brandTitle(Brand b) {
        return switch (b) { case FRESH -> "Fresh"; case STYLE -> "Style"; case TECH -> "Tech"; };
    }

    public static String temp(TempClass t) {
        if (t == null) return "";
        return switch (t) {
            case CHILLED -> "Chilled (2-8°C)";
            case FROZEN -> "Frozen (-18°C)";
            case AMBIENT -> "Ambient";
            case AMBIENT_FRAGILE -> "Ambient (Fragile)";
        };
    }

    public static boolean needsReefer(TempClass t) { return t == TempClass.CHILLED || t == TempClass.FROZEN; }

    public static String vehicleType(VehicleType t) {
        return switch (t) { case REEFER -> "Refrigerated Truck"; case DRY_BOX -> "Dry-Box Truck"; case VAN -> "Small Delivery Van"; };
    }

    /** Registration-style code used on the dock/driver screens, e.g. RE-04 -> WP-RE-04. */
    public static String plate(Vehicle v) { return v == null ? "-" : "WP-" + v.getCode(); }

    public static String outletName(Outlet o) { return brandTitle(o.getBrand()) + " - " + o.getName(); }

    public static String outletFull(Outlet o) {
        return o.getName().equals(o.getArea()) ? o.getName() : o.getName() + " — " + o.getArea();
    }

    public static String monthDay(LocalDate d) { return d == null ? "" : d.format(MONTH_DAY); }
    public static String longDate(LocalDate d) { return d == null ? "" : d.format(LONG); }

    public static String num(double v) { return new DecimalFormat("#,##0").format(v); }
    public static String num1(double v) { return new DecimalFormat("#,##0.0").format(v); }

    public static int pct(double part, double whole) { return whole <= 0 ? 0 : (int) Math.round(part * 100.0 / whole); }

    public static String initials(String name) {
        StringBuilder sb = new StringBuilder();
        for (String p : name.trim().split("\\s+")) if (!p.isEmpty() && sb.length() < 2) sb.append(Character.toUpperCase(p.charAt(0)));
        return sb.toString();
    }
}
