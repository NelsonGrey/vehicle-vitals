"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIntegrationConfig = getIntegrationConfig;
function boolFromEnv(name, defaultValue = false) {
    const raw = (process.env[name] || "").trim().toLowerCase();
    if (!raw)
        return defaultValue;
    return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}
function providerFromEnv(name, fallback) {
    const raw = (process.env[name] || "").trim();
    if (!raw)
        return fallback;
    return raw;
}
function getIntegrationConfig() {
    return {
        providers: {
            vin: providerFromEnv("VIN_PROVIDER", "vpic"),
            manuals: providerFromEnv("MANUALS_PROVIDER", "none"),
            warranty: providerFromEnv("WARRANTY_PROVIDER", "none"),
            schedule: providerFromEnv("SCHEDULE_PROVIDER", "none"),
            calendar: providerFromEnv("CALENDAR_PROVIDER", "none"),
        },
        features: {
            manualsEnabled: boolFromEnv("MANUALS_ENABLED", false),
            warrantyEnabled: boolFromEnv("WARRANTY_ENABLED", false),
            maintenancePlanEnabled: boolFromEnv("MAINTENANCE_PLAN_ENABLED", false),
            calendarEnabled: boolFromEnv("CALENDAR_ENABLED", false),
        },
    };
}
//# sourceMappingURL=integrations.config.js.map