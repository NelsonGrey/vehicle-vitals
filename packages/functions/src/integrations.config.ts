export type ProviderName =
  | "none"
  | "vpic"
  | "manuals_primary"
  | "warranty_primary"
  | "schedule_primary"
  | "calendar_primary";

interface IntegrationConfig {
  providers: {
    vin: ProviderName;
    manuals: ProviderName;
    warranty: ProviderName;
    schedule: ProviderName;
    calendar: ProviderName;
  };
  features: {
    manualsEnabled: boolean;
    warrantyEnabled: boolean;
    maintenancePlanEnabled: boolean;
    calendarEnabled: boolean;
  };
}

function boolFromEnv(name: string, defaultValue = false): boolean {
  const raw = (process.env[name] || "").trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function providerFromEnv(name: string, fallback: ProviderName): ProviderName {
  const raw = (process.env[name] || "").trim();
  if (!raw) return fallback;
  return raw as ProviderName;
}

export function getIntegrationConfig(): IntegrationConfig {
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
