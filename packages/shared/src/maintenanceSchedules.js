// Manufacturer maintenance schedules data
// Hand-ported to packages/mobile/lib/models/maintenance_schedule.dart - keep both in sync.
export const manufacturerSchedules = {
  // Toyota schedules
  'Toyota': {
    'Camry': {
      'oilChange': {
        interval: 5000, // miles
        description: 'Oil and filter change',
        frequency: 'Every 5,000 miles or 6 months'
      },
      'tireRotation': {
        interval: 5000,
        description: 'Tire rotation',
        frequency: 'Every 5,000 miles'
      },
      'brakeInspection': {
        interval: 10000,
        description: 'Brake inspection',
        frequency: 'Every 10,000 miles'
      },
      'transmissionService': {
        interval: 30000,
        description: 'Transmission fluid change',
        frequency: 'Every 30,000 miles'
      }
    },
    'Corolla': {
      'oilChange': {
        interval: 5000,
        description: 'Oil and filter change',
        frequency: 'Every 5,000 miles or 6 months'
      },
      'tireRotation': {
        interval: 5000,
        description: 'Tire rotation',
        frequency: 'Every 5,000 miles'
      },
      'airFilter': {
        interval: 15000,
        description: 'Air filter replacement',
        frequency: 'Every 15,000 miles'
      }
    }
  },
  // Honda schedules
  'Honda': {
    'Civic': {
      'oilChange': {
        interval: 7500,
        description: 'Oil and filter change',
        frequency: 'Every 7,500 miles or 1 year'
      },
      'tireRotation': {
        interval: 7500,
        description: 'Tire rotation',
        frequency: 'Every 7,500 miles'
      },
      'brakeInspection': {
        interval: 15000,
        description: 'Brake inspection',
        frequency: 'Every 15,000 miles'
      }
    },
    'Accord': {
      'oilChange': {
        interval: 7500,
        description: 'Oil and filter change',
        frequency: 'Every 7,500 miles or 1 year'
      },
      'tireRotation': {
        interval: 7500,
        description: 'Tire rotation',
        frequency: 'Every 7,500 miles'
      },
      'transmissionService': {
        interval: 30000,
        description: 'Transmission fluid change',
        frequency: 'Every 30,000 miles'
      }
    }
  },
  // Ford schedules
  'Ford': {
    'F-150': {
      'oilChange': {
        interval: 7500,
        description: 'Oil and filter change',
        frequency: 'Every 7,500 miles or 6 months'
      },
      'tireRotation': {
        interval: 7500,
        description: 'Tire rotation',
        frequency: 'Every 7,500 miles'
      },
      'brakeInspection': {
        interval: 12500,
        description: 'Brake inspection',
        frequency: 'Every 12,500 miles'
      }
    },
    'Explorer': {
      'oilChange': {
        interval: 7500,
        description: 'Oil and filter change',
        frequency: 'Every 7,500 miles or 6 months'
      },
      'tireRotation': {
        interval: 7500,
        description: 'Tire rotation',
        frequency: 'Every 7,500 miles'
      },
      'airFilter': {
        interval: 15000,
        description: 'Air filter replacement',
        frequency: 'Every 15,000 miles'
      }
    }
  }
};

// Get maintenance schedule for a specific vehicle
export const getMaintenanceSchedule = (make, model) => {
  if (!make || !model) return null;

  const makeSchedules = manufacturerSchedules[make];
  if (!makeSchedules) return null;

  return makeSchedules[model] || null;
};

// Get all available maintenance items for a vehicle
export const getMaintenanceItems = (make, model) => {
  const schedule = getMaintenanceSchedule(make, model);
  if (!schedule) return [];

  return Object.entries(schedule).map(([key, item]) => ({
    id: key,
    ...item
  }));
};

// Calculate next due date based on current mileage
export const calculateNextDue = (currentMileage, interval) => {
  const nextMileage = Math.ceil(currentMileage / interval) * interval + interval;
  return nextMileage;
};

// Get upcoming maintenance items
export const getUpcomingMaintenance = (make, model, currentMileage, maxMileage = 50000) => {
  const items = getMaintenanceItems(make, model);
  if (!items.length) return [];

  return items
    .map(item => ({
      ...item,
      nextDueMileage: calculateNextDue(currentMileage, item.interval),
      milesUntilDue: calculateNextDue(currentMileage, item.interval) - currentMileage
    }))
    .filter(item => item.nextDueMileage <= maxMileage)
    .sort((a, b) => a.nextDueMileage - b.nextDueMileage);
};