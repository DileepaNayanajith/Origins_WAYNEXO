package com.waynexo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.waynexo.domain.*;
import com.waynexo.repo.*;
import com.waynexo.security.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.http.MediaType;
import java.util.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:auth-test;MODE=MySQL;DB_CLOSE_DELAY=-1", "spring.datasource.username=sa", "spring.datasource.password=", "waynexo.jwt-secret=test-only-unique-secret-at-least-32-characters", "waynexo.demo-seed=false"})
@AutoConfigureMockMvc
class AuthFlowTest {
    @Autowired MockMvc mvc;
    @Autowired AppUserRepository users;
    @Autowired DepotRepository depots;
    @Autowired VehicleRepository vehicles;
    @Autowired OutletRepository outlets;
    @Autowired PasswordHasher hasher;
    @Autowired ObjectMapper json;
    @Autowired JwtService jwt;
    @BeforeEach void fixtures() {
        users.deleteAll(); vehicles.deleteAll(); outlets.deleteAll(); depots.deleteAll();
        Depot d = new Depot(); d.setCode("HUB"); d.setName("Test hub"); d.setShortName("Hub"); depots.save(d);
        Vehicle v = new Vehicle(); v.setCode("V1"); v.setModel("Test van"); v.setType(VehicleType.REEFER); v.setState(VehicleState.AVAILABLE); v.setDepot(d); vehicles.save(v);
        Outlet o = new Outlet(); o.setCode("B1"); o.setName("Test store"); o.setArea("Test"); o.setBrand(Brand.FRESH); o.setDepot(d); outlets.save(o);
        for (Role role : Role.values()) {
            AppUser u = new AppUser(); u.setUsername(role.name().toLowerCase()); u.setRole(role); u.setFullName("Test " + role); u.setPasswordHash(hasher.hash("valid-pass")); users.save(u);
        }
    }
    String login(Role role) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(json.writeValueAsString(Map.of("username", role.name().toLowerCase(), "password", "valid-pass"))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.user.role").value(role.name())).andReturn();
        return json.readTree(r.getResponse().getContentAsString()).get("token").asText();
    }
    @Test void everyRoleAuthenticatesPersistsAndRejectsOtherRoles() throws Exception {
        Map<Role,String> areas = Map.of(Role.DRIVER,"/api/driver/home",Role.LOADER,"/api/loader/queue",Role.STORE_MANAGER,"/api/store/catalog",Role.DISPATCHER,"/api/dispatcher/overview");
        for (Role role : Role.values()) {
            String token = login(role);
            mvc.perform(get("/api/auth/me").header("Authorization","Bearer " + token)).andExpect(status().isOk()).andExpect(jsonPath("$.role").value(role.name()));
            for (var area : areas.entrySet()) if (area.getKey() != role)
                mvc.perform(get(area.getValue()).header("Authorization","Bearer " + token)).andExpect(status().isForbidden());
        }
    }
    @Test void setupOnlyContainsRelevantFieldsAndPersists() throws Exception {
        Map<Role,String> fields = Map.of(Role.DRIVER,"vehicleCode",Role.LOADER,"depotCode",Role.STORE_MANAGER,"outletCode");
        Map<Role,String> values = Map.of(Role.DRIVER,"V1",Role.LOADER,"HUB",Role.STORE_MANAGER,"B1");
        for (Role role : fields.keySet()) {
            String token = login(role); String h = "Bearer " + token;
            mvc.perform(get("/api/auth/setup").header("Authorization",h)).andExpect(status().isOk())
                .andExpect(jsonPath("$.fields.length()").value(1)).andExpect(jsonPath("$.fields[0].name").value(fields.get(role)));
            mvc.perform(put("/api/auth/setup").header("Authorization",h).contentType(MediaType.APPLICATION_JSON).content("{}")) .andExpect(status().isBadRequest());
            mvc.perform(put("/api/auth/setup").header("Authorization",h).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of(fields.get(role),"unknown")))).andExpect(status().isBadRequest());
            mvc.perform(put("/api/auth/setup").header("Authorization",h).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of(fields.get(role),values.get(role))))).andExpect(status().isOk());
            mvc.perform(get("/api/auth/setup").header("Authorization",h)).andExpect(jsonPath("$.fields.length()").value(0));
            mvc.perform(put("/api/auth/setup").header("Authorization",h).contentType(MediaType.APPLICATION_JSON).content("{\"vehicleCode\":\"V1\"}")) .andExpect(status().isBadRequest());
        }
        mvc.perform(get("/api/auth/setup").header("Authorization","Bearer " + login(Role.DISPATCHER))).andExpect(jsonPath("$.fields.length()").value(0));
    }
    @Test void rejectBadgeBypassInvalidPasswordsTokensAndUnauthenticatedAccess() throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"loader\",\"portal\":\"LOADER\"}")) .andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"loader\",\"password\":\"wrong\",\"portal\":\"LOADER\"}")) .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization","Bearer " + login(Role.DRIVER) + "tampered")).andExpect(status().isUnauthorized());
        AppUser u = users.findByUsernameIgnoreCase("loader").orElseThrow(); u.setPasswordHash(null); users.save(u);
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"loader\",\"password\":\"valid-pass\"}")) .andExpect(status().isUnauthorized());
        assertNull(new JwtService("expired-test-secret-at-least-32-characters", -1).verify(new JwtService("expired-test-secret-at-least-32-characters", -1).issue(1,Role.DRIVER)));
    }
    @Test void incompleteAccountsCannotUseOperationalApi() throws Exception {
        mvc.perform(get("/api/driver/home").header("Authorization","Bearer " + login(Role.DRIVER))).andExpect(status().isConflict());
    }
    @Test void corsPreflightAllowsConfiguredOriginOnly() throws Exception {
        mvc.perform(options("/api/auth/login").header("Origin","http://localhost:5173").header("Access-Control-Request-Method","POST"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin","http://localhost:5173"));
        mvc.perform(options("/api/auth/login").header("Origin","https://untrusted.example").header("Access-Control-Request-Method","POST")) .andExpect(status().isForbidden());
    }
}
