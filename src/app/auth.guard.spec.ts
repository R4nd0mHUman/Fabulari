import { TestBed } from '@angular/core/testing'; // Provides Angular testing utilities for configuring and running unit tests.
import { Router, provideRouter } from '@angular/router'; // Provides router functionality for testing route guards and redirects.
import { authGuard, guestGuard, superAdminGuard } from './auth.guard'; // Imports the route guards being tested.

// Defines the test suite for the application's route guards.
describe('route guards', () => {

  // Reset browser state and configure the router before each test.
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([])]
    });
  });

  // Tests that anonymous users are redirected to login with their requested URL.
  it('authGuard redirects anonymous users to login with the requested return URL', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/groups' } as any)
    );

    const router = TestBed.inject(Router);

    // Confirm the redirect includes the original requested route.
    expect(router.serializeUrl(result as any)).toContain('/login?returnUrl=%2Fgroups');
  });

  // Tests that authenticated users can access protected routes.
  it('authGuard allows a logged-in user', () => {
    localStorage.setItem('userId', 'user-1');

    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/user' } as any)
    );

    // A logged-in user should be allowed through the guard.
    expect(result).toBe(true);
  });

  // Tests that only super administrators can access protected admin routes.
  it('superAdminGuard rejects a regular user and allows a super administrator', () => {
    localStorage.setItem('role', 'user');

    const denied = TestBed.runInInjectionContext(() =>
      superAdminGuard({} as any, {} as any)
    );

    // Regular users should be redirected to the user page.
    expect(TestBed.inject(Router).serializeUrl(denied as any)).toBe('/user');

    localStorage.setItem('role', 'super-admin');

    const allowed = TestBed.runInInjectionContext(() =>
      superAdminGuard({} as any, {} as any)
    );

    // Super administrators should be allowed through the guard.
    expect(allowed).toBe(true);
  });

  // Tests that guest access requires an explicit guest-mode flag.
  it('guestGuard only allows browsers explicitly placed in guest mode', () => {
    const denied = TestBed.runInInjectionContext(() =>
      guestGuard({} as any, {} as any)
    );

    // Browsers without guest mode should be redirected to login.
    expect(TestBed.inject(Router).serializeUrl(denied as any)).toBe('/login');

    localStorage.setItem('guest', 'true');

    const allowed = TestBed.runInInjectionContext(() =>
      guestGuard({} as any, {} as any)
    );

    // Browsers in guest mode should be allowed through the guard.
    expect(allowed).toBe(true);
  });
});