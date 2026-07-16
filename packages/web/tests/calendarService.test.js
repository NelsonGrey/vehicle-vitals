import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/shared/firebaseConfig', () => ({
  firebaseConfig: { projectId: 'vehicle-vitals-test' },
  getFirebaseConfig: () => ({ projectId: 'vehicle-vitals-test' }),
}));

const makeFirebaseMocks = ({
  callableImpl,
  getIdTokenImpl = async () => 'token-123',
  withCurrentUser = true,
}) => {
  const callable = vi.fn(callableImpl);
  const httpsCallable = vi.fn(() => callable);
  const authUser = withCurrentUser
    ? {
        getIdToken: vi.fn(getIdTokenImpl),
      }
    : null;

  const firebase = {
    firestore: {},
    functions: {
      getFunctions: vi.fn(() => ({ region: 'us-central1' })),
      httpsCallable,
    },
    auth: {
      getAuth: vi.fn(() => ({
        currentUser: authUser,
      })),
    },
    app: {
      getApp: vi.fn(() => ({})),
      initializeApp: vi.fn(() => ({})),
    },
  };

  return { firebase, callable, httpsCallable };
};

describe('calendarService.createMaintenanceCalendarEvent', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uses callable path when callable succeeds', async () => {
    const { firebase, callable, httpsCallable } = makeFirebaseMocks({
      callableImpl: async () => ({
        data: {
          success: true,
          event: { eventId: 'evt-callable', actionUrl: 'https://calendar' },
        },
      }),
    });

    vi.stubGlobal('window', { firebase });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const { createMaintenanceCalendarEvent } = await import(
      '../src/utils/calendarService.js'
    );

    const event = await createMaintenanceCalendarEvent({
      vehicleVin: '1HGCM82633A123456',
      title: 'Oil Change',
      description: 'Maintenance reminder',
      startAt: '2026-09-01T10:00:00Z',
      endAt: '2026-09-01T11:00:00Z',
      target: 'google',
    });

    expect(callable).toHaveBeenCalledTimes(1);
    expect(httpsCallable).toHaveBeenCalledWith(
      expect.anything(),
      'createCalendarEventCallable'
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(event.eventId).toBe('evt-callable');
  });

  it('falls back to HTTP when callable throws and includes auth header', async () => {
    const { firebase } = makeFirebaseMocks({
      callableImpl: async () => {
        throw new Error('callable failed');
      },
    });

    vi.stubGlobal('window', { firebase });

    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        event: { eventId: 'evt-http', downloadUrl: 'data:text/calendar,...' },
      }),
    }));
    vi.stubGlobal('fetch', fetchSpy);

    const { createMaintenanceCalendarEvent } = await import(
      '../src/utils/calendarService.js'
    );

    const event = await createMaintenanceCalendarEvent({
      vehicleVin: '1HGCM82633A123456',
      title: 'Tire Rotation',
      description: 'Maintenance reminder',
      startAt: '2026-09-01T10:00:00Z',
      endAt: '2026-09-01T11:00:00Z',
      target: 'ics',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [endpoint, options] = fetchSpy.mock.calls[0];
    expect(endpoint).toContain(
      'https://us-central1-vehicle-vitals-test.cloudfunctions.net/createCalendarEvent'
    );
    expect(options.method).toBe('POST');
    expect(options.headers.authorization).toBe('Bearer token-123');
    expect(event.eventId).toBe('evt-http');
  });

  it('falls back to HTTP without authorization header when no user is signed in', async () => {
    const { firebase } = makeFirebaseMocks({
      callableImpl: async () => {
        throw new Error('callable failed');
      },
      withCurrentUser: false,
    });

    vi.stubGlobal('window', { firebase });

    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        event: { eventId: 'evt-http-unauthed' },
      }),
    }));
    vi.stubGlobal('fetch', fetchSpy);

    const { createMaintenanceCalendarEvent } = await import(
      '../src/utils/calendarService.js'
    );

    const event = await createMaintenanceCalendarEvent({
      vehicleVin: '1HGCM82633A123456',
      title: 'Brake Inspection',
      description: 'Maintenance reminder',
      startAt: '2026-09-01T10:00:00Z',
      endAt: '2026-09-01T11:00:00Z',
      target: 'apple',
    });

    const [, options] = fetchSpy.mock.calls[0];
    expect(options.headers.authorization).toBeUndefined();
    expect(event.eventId).toBe('evt-http-unauthed');
  });
});
