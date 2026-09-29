import { test, expect } from '@playwright/test';

// Navigate to the public login page before each test.
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});

// Verify that the public login page loads correctly and displays the expected Fabulari branding.
test('public login page displays Fabulari branding', async ({ page }) => {
  // Confirm that the Fabulari logo is displayed on the page.
  await expect(page.locator('img[src*="fabulari-logo"]')).toBeVisible();

  // Confirm that the option to continue as a guest is displayed.
  await expect(page.getByAltText('Continue as Guest')).toBeVisible();
});

// Verify that unauthenticated users cannot access a protected page.
test('protected user page redirects an unauthenticated browser', async ({ page }) => {
  // Attempt to access the protected user page without logging in.
  await page.goto('/user');

  // The application should redirect unauthenticated users to the login page.
  await expect(page).toHaveURL(/login/);
});

// Verify that a user can enter guest mode from the public login page.
test('guest button enters guest mode and opens the guest dashboard', async ({ page }) => {
  // Select the option to continue as a guest.
  await page.getByAltText('Continue as Guest').click();

  // Confirm that the application navigates to the guest dashboard.
  await expect(page).toHaveURL(/guest/);

  // Confirm that guest mode is stored in local storage.
  await expect.poll(() => page.evaluate(() => localStorage.getItem('guest'))).toBe('true');
});

// Verify that the registration page can be reached from the public login page.
test('registration page is reachable from the public login page', async ({ page }) => {
  // Select the sign-up option from the login page.
  await page.getByAltText(/sign/i).click();

  // Confirm that the application navigates to the registration page.
  await expect(page).toHaveURL(/register/);
});