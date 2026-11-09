import { expect, openRoute, test } from './fixtures';

const BPM = '.metronome-stage-tempo strong';

async function bpm(page: import('@playwright/test').Page): Promise<number> {
  return Number(await page.locator(BPM).innerText());
}

test.describe('metronome', () => {
  test('draws a visible rod and starts and stops the pulse', async ({ page }) => {
    await openRoute(page, '/metronome');

    await expect(page.locator(BPM)).toHaveText('72');
    await expect(page.locator('.metronome-stage-beat')).toHaveCount(4);
    await expect(page.locator('.metronome-stage-beat.strong')).toHaveCount(1);

    // The metronome fixed the rod being invisible; assert the actual rect has
    // real geometry and a gradient fill, not just the brass weight.
    const rod = page.locator('.metronome-figure-rod > rect').first();
    expect(await rod.getAttribute('height')).toBe('214');
    const box = await rod.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width, 'rod is thin but visible').toBeGreaterThan(1);
    expect(box!.height, 'rod spans most of the cabinet').toBeGreaterThan(150);
    expect(await rod.getAttribute('fill')).toMatch(/^url\(/);
    await expect(page.locator('.metronome-figure')).toHaveAttribute('aria-label', /72 beats per minute/);

    await page.locator('.metronome-play').click();
    await expect(page.locator('.metronome-play')).toContainText('Stop');
    await expect(page.locator('.metronome-stage-visual')).toHaveClass(/running/);
    await expect(page.locator('.metronome-stage-beat.active')).toHaveCount(1);

    await page.locator('.metronome-play').click();
    await expect(page.locator('.metronome-play')).toContainText('Start');
    await expect(page.locator('.metronome-stage-visual')).not.toHaveClass(/running/);
    await expect(page.locator('.metronome-stage-beat.active')).toHaveCount(0);
  });

  test('changes tempo by buttons, slider, presets, and keyboard', async ({ page }) => {
    await openRoute(page, '/metronome');
    await expect.poll(() => bpm(page)).toBe(72);

    await page.getByRole('button', { name: 'Faster by one' }).click();
    await expect.poll(() => bpm(page)).toBe(73);
    await page.getByRole('button', { name: 'Slower by one' }).click();
    await expect.poll(() => bpm(page)).toBe(72);

    await page.getByRole('button', { name: '120', exact: true }).click();
    await expect.poll(() => bpm(page)).toBe(120);
    await expect(page.locator('.metronome-tempo-row input[type="range"]')).toHaveValue('120');

    await page.locator('.metronome-tempo-row input[type="range"]').fill('96');
    await expect.poll(() => bpm(page)).toBe(96);

    // Keyboard shortcuts only fire when focus is not on a control.
    await page.locator('main h1').click();
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => bpm(page)).toBe(97);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => bpm(page)).toBe(96);

    await page.keyboard.press('Space');
    await expect(page.locator('.metronome-play')).toContainText('Stop');
    await page.keyboard.press('Space');
    await expect(page.locator('.metronome-play')).toContainText('Start');
  });

  test('sets the weight position from the tempo', async ({ page }) => {
    await openRoute(page, '/metronome');

    const weight = page.locator('.metronome-figure-weight');
    const slow = await weight.getAttribute('style');
    await page.locator('.metronome-tempo-row input[type="range"]').fill('240');
    await expect.poll(() => bpm(page)).toBe(240);
    const fast = await weight.getAttribute('style');

    expect(slow).toMatch(/translate\(110px, [\d.]+px\)/);
    expect(fast).toMatch(/translate\(110px, [\d.]+px\)/);
    expect(fast, 'faster tempos push the weight toward the pivot').not.toBe(slow);
  });

  test('saves meter, subdivision, accent, and volume across reloads', async ({ page }) => {
    await openRoute(page, '/metronome');

    await page.locator('.metronome-option').filter({ hasText: '3/4' }).click();
    await expect(page.locator('.metronome-option.active')).toContainText('3/4');
    await expect(page.locator('.metronome-stage-beat')).toHaveCount(3);

    await page.locator('.metronome-segmented button').filter({ hasText: 'Triplets' }).click();
    await expect(page.locator('.metronome-segmented button.active')).toContainText('Triplets');

    const accent = page.locator('.metronome-switch input[type="checkbox"]');
    await expect(accent).toBeChecked();
    await accent.uncheck();
    await expect(accent).not.toBeChecked();

    await page.getByRole('slider', { name: 'Metronome volume' }).fill('55');
    await expect(page.locator('.metronome-settings-grid section').filter({ hasText: 'Volume' })).toContainText('55%');

    await expect
      .poll(async () => {
        const raw = await page.evaluate(() => localStorage.getItem('cadence.metronome.v1'));
        return raw ? JSON.parse(raw) : null;
      })
      .toMatchObject({ bpm: 72, beatsPerBar: 3, subdivision: 'triplet', accentFirst: false, volume: 0.55 });

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator(BPM)).toHaveText('72');
    await expect(page.locator('.metronome-option.active')).toContainText('3/4');
    await expect(page.locator('.metronome-segmented button.active')).toContainText('Triplets');
    await expect(page.locator('.metronome-switch input[type="checkbox"]')).not.toBeChecked();
    await expect(page.getByRole('slider', { name: 'Metronome volume' })).toHaveValue('55');
  });

  test('tap tempo derives the pulse from five clicks', async ({ page }) => {
    await openRoute(page, '/metronome');

    // Click inside the page so the tap timestamps are not stretched by
    // Playwright's per-action actionability checks under parallel load.
    await page.evaluate(async () => {
      const button = document.querySelector<HTMLButtonElement>('.metronome-tap');
      if (!button) throw new Error('Tap tempo button missing');
      for (let index = 0; index < 5; index += 1) {
        button.click();
        if (index < 4) await new Promise((resolve) => window.setTimeout(resolve, 200));
      }
    });

    await expect.poll(() => bpm(page), { timeout: 5_000 }).toBeGreaterThan(120);
    await expect.poll(() => bpm(page)).toBeLessThanOrEqual(260);
    expect(await bpm(page), 'tapping overrides the default tempo').not.toBe(72);
  });

  test('keeps running in the dock and links back to the full page', async ({ page }) => {
    await openRoute(page, '/metronome');
    await page.getByRole('button', { name: '120', exact: true }).click();
    await page.locator('.metronome-play').click();
    await expect(page.locator('.metronome-play')).toContainText('Stop');

    await page.locator('.side-link[href="/"]').click();
    const dock = page.locator('.metronome-dock');
    await expect(dock).toHaveClass(/collapsed/);
    await page.getByRole('button', { name: 'Open the metronome' }).click();
    await expect(dock).not.toHaveClass(/collapsed/);
    await expect(dock).toBeVisible();
    await expect(dock).toHaveClass(/running/);
    await expect(dock.locator('.metronome-dock-tempo strong')).toHaveText('120');

    await dock.getByRole('button', { name: 'Faster' }).click();
    await expect(dock.locator('.metronome-dock-tempo strong')).toHaveText('124');
    await dock.getByRole('button', { name: 'Stop' }).click();
    await expect(dock).not.toHaveClass(/running/);

    await dock.getByRole('button', { name: 'Minimize the metronome' }).click();
    await expect(page.locator('.metronome-dock.collapsed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open the metronome' })).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('.metronome-dock.collapsed')).toBeVisible();
    await page.getByRole('button', { name: 'Open the metronome' }).click();
    await expect(page.locator('.metronome-dock:not(.collapsed)')).toBeVisible();

    await page.getByRole('link', { name: 'Open metronome settings' }).click();
    await expect(page.locator('main h1')).toHaveText('Metronome');
    await expect(page.locator('.metronome-dock')).toHaveCount(0);
  });
});
