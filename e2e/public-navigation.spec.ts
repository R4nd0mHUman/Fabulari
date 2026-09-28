import { test, expect } from '@playwright/test';

// Verify that the public login page loads correctly and displays the expected Fabulari branding.
test('public application loads and exposes the Fabulari branding', async ({ page }) => {
    // Navigate to the public login page.
    await page.goto('/login');

    // Confirm that the page has loaded and the document body is visible.
    await expect(page.locator('body')).toBeVisible();

    // Confirm that the Fabulari logo is displayed on the page.
    await expect(page.locator('img[src*="fabulari-logo"]')).toBeVisible();
});

// Verify that unauthenticated users cannot access a protected page.
test('protected user page redirects an unauthenticated browser', async ({ page }) => {
    // Attempt to access the protected user page without logging in.
    await page.goto('/user');

    // The application should redirect unauthenticated users to the login page.
    await expect(page).toHaveURL(/login/);
});