import { expect, test } from '@playwright/test'

test('boots the standalone Season 2 shell with runtimes held behind the package contract', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Midnight Season 2 Trainer')
  await expect(page.getByRole('heading', { name: 'Midnight Season 2 Trainer' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Entombed Sentinels' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Learn 2D' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Train 3D' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Runtime pending' })).toHaveCount(2)
  await expect(page.getByRole('heading', { name: 'L’ura Trainer' })).toHaveCount(0)
})

test('retains the v0.9.1 source application behind a development-only reference route', async ({ page }) => {
  await page.goto('/?reference=lura-v0.9.1')
  await expect(page.getByRole('heading', { name: 'L’ura Trainer' })).toBeVisible()
})
