import { test, expect } from '@playwright/test';

test('has branding and skip link', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/EVERYWEAR/);

  // Skip link
  const skipLink = page.locator('text=Skip to main content');
  await expect(skipLink).toHaveAttribute('href', '#main-content');
});

test('adds item to cart', async ({ page }) => {
  await page.goto('http://localhost:3000/shop');

  // Find a product and click add to cart
  const addToCartButton = page.locator('button:has-text("Add")').first();
  await addToCartButton.click();

  // Verify cart badge increments (wait for toast/badge update)
  const cartBadge = page.locator('a[aria-label="Cart"] span').first();
  await expect(cartBadge).toBeVisible();
});
