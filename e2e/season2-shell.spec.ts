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
  await expect(page.getByLabel('About Pestivator')).toContainText('pestivator#2515')
  await expect(page.getByRole('heading', { name: 'L’ura Trainer' })).toHaveCount(0)
})

test('moves independently in all four Learn 2D directions and clears input on blur', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Launch Learn 2D' }).click()
  const player = page.getByLabel('Controlled character with 1 green and 3 red toxins')
  const position = async () => ({ x: Number(await player.getAttribute('data-position-x')), y: Number(await player.getAttribute('data-position-y')) })
  let before = await position()
  await page.keyboard.down('a'); await page.waitForTimeout(260); await page.keyboard.up('a')
  let after = await position(); expect(after.x).toBeLessThan(before.x)
  before = after
  await page.keyboard.down('d'); await page.waitForTimeout(420); await page.keyboard.up('d')
  after = await position(); expect(after.x).toBeGreaterThan(before.x)
  before = after
  await page.keyboard.down('s'); await page.waitForTimeout(260); await page.keyboard.up('s')
  after = await position(); expect(after.y).toBeGreaterThan(before.y)
  before = after
  await page.keyboard.down('w'); await page.waitForTimeout(260); await page.keyboard.up('w')
  after = await position(); expect(after.y).toBeLessThan(before.y)

  await page.keyboard.down('w'); await page.waitForTimeout(180)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await page.waitForTimeout(100)
  const stopped = await position()
  await page.waitForTimeout(300)
  expect(Math.abs((await position()).y - stopped.y)).toBeLessThan(.2)
  await page.keyboard.up('w')
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

test('opens paired contract rooms with full-raid ground reactions and paced 3D rendering', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open Learn 2D room' }).click()

  await expect(page.getByRole('heading', { name: 'Top-down reaction lab' })).toBeVisible()
  await expect(page.getByLabel(/ground rune$/)).toHaveCount(4)
  await expect(page.getByLabel(/NPC$/)).toHaveCount(19)
  await expect(page.getByLabel('Contract combat actions')).toBeVisible()
  await page.getByLabel('Contract player role').selectOption('tank')
  await page.getByRole('button', { name: /Shield/ }).click()
  await expect(page.getByRole('button', { name: /Shield/ })).toContainText(/20\.0s|19\.9s/)
  await page.getByRole('button', { name: 'Back to setup' }).click()
  await page.getByRole('button', { name: 'Open Train 3D room' }).click()

  await expect(page.getByRole('heading', { name: 'Reaction and movement lab' })).toBeVisible()
  await expect(page.getByLabel('Third-person 3D training arena')).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Training HUD' })).toContainText('event 1')
  await expect(page.getByRole('complementary', { name: 'Training HUD' })).toContainText('20-player raid')
  const renderedFrames = await page.evaluate(async () => {
    let frames = 0
    const start = performance.now()
    await new Promise<void>(resolve => {
      const tick = (now: number) => { frames += 1; if (now - start >= 1000) resolve(); else requestAnimationFrame(tick) }
      requestAnimationFrame(tick)
    })
    return frames
  })
  expect(renderedFrames).toBeGreaterThanOrEqual(20)
})

test('uses rebound movement keys and shared HUD settings in the Helical Toxins 3D drill', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Keys & Mouse' }).click()
  await page.getByRole('button', { name: 'Rebind forward, current W' }).click()
  await page.keyboard.press('ArrowUp')
  await page.getByRole('button', { name: 'HUD' }).click()
  await expect(page.getByLabel('Draggable HUD preview')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Player health + cooldowns' })).toBeVisible()
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
