import { expect, test } from '@playwright/test'

test('boots the standalone Season 2 shell with the first package runtimes ready', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Midnight Season 2 Trainer')
  await expect(page.getByRole('heading', { name: 'Midnight Season 2 Trainer' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Entombed Sentinels' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Learn 2D' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Train 3D' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Launch Learn 2D' })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Launch Train 3D' })).toBeEnabled()
  await expect(page.getByRole('heading', { name: 'L’ura Trainer' })).toHaveCount(0)
})

test('moves the player through the Helical Toxins Learn 2D icon drill', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Launch Learn 2D' }).click()

  await expect(page.getByRole('heading', { name: 'Helical Toxins tutorial' })).toBeVisible()
  await expect(page.getByLabel('Controlled character with 1 green and 3 red toxins')).toBeVisible()
  await expect(page.getByRole('img', { name: '3 green toxins and 1 red toxin' })).toBeVisible()
  await page.keyboard.down('w')
  await page.waitForTimeout(1800)
  await page.keyboard.up('w')
  await page.keyboard.down('d')
  await page.waitForTimeout(950)
  await page.keyboard.up('d')
  await expect(page.getByText('Resolved: your pair combines to exactly four green.')).toBeVisible()
})

test('opens the development contract room with seeded aura and spell events', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open contract room' }).click()

  await expect(page.getByRole('heading', { name: 'Reaction and movement lab' })).toBeVisible()
  await expect(page.getByLabel('Third-person 3D training arena')).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Training HUD' })).toContainText('event 1')
  await expect(page.getByText(/fixed steps per second/)).toBeVisible()
})

test('uses rebound movement keys and shared HUD settings in the Helical Toxins 3D drill', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Keys & Mouse' }).click()
  await page.getByRole('button', { name: 'Rebind forward, current W' }).click()
  await page.keyboard.press('ArrowUp')
  await page.getByRole('button', { name: 'HUD' }).click()
  await page.getByRole('checkbox', { name: 'Show objective' }).uncheck()
  await page.getByRole('button', { name: 'Game settings' }).click()
  await page.getByRole('button', { name: 'Launch Train 3D' }).click()

  await expect(page.getByRole('heading', { name: 'Helical Toxins movement drill' })).toBeVisible()
  const arena = page.getByLabel('Third-person 3D training arena')
  await expect(arena).toBeVisible()
  await arena.hover()
  await page.mouse.wheel(0, 300)
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('midnight-s2:training-settings:v1') || '{}').camera?.zoom ?? 0)).toBeGreaterThan(22)
  await expect(page.getByRole('complementary', { name: 'Training HUD' }).getByText('Objective')).toHaveCount(0)
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(500)
  await page.keyboard.up('ArrowUp')
  await expect(page.getByRole('complementary', { name: 'Training HUD' }).getByText(/-22\.0 · -/)).toBeVisible()
})

test('retains the v0.9.1 source application behind a development-only reference route', async ({ page }) => {
  await page.goto('/?reference=lura-v0.9.1')
  await expect(page.getByRole('heading', { name: 'L’ura Trainer' })).toBeVisible()
})
