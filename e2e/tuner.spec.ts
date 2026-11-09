import { expect, openRoute, test } from './fixtures';

test.describe('tuner', () => {
  test('starts on the guitar with standard tuning and a quiet microphone', async ({ page }) => {
    await openRoute(page, '/tuner');

    await expect(page.locator('.header-stat')).toContainText('Guitar');
    await expect(page.locator('.header-stat')).toContainText('Standard E');
    await expect(page.getByLabel('Tuning')).toHaveValue('standard');
    await expect(page.locator('.tuner-string')).toHaveCount(6);
    await expect(page.locator('.tuner-status-pill')).toHaveText('Microphone off');
    await expect(page.locator('.tuner-actions')).toContainText('Start listening');
    await expect(page.locator('.tuner-cents')).toContainText('A4 = 440.0 Hz');
  });

  test('switches instruments and tunings', async ({ page }) => {
    await openRoute(page, '/tuner');

    await page.locator('.tuner-instrument').filter({ hasText: 'Bass guitar' }).click();
    await expect(page.locator('.header-stat')).toContainText('Bass guitar');
    await expect(page.locator('.tuner-string')).toHaveCount(4);

    await page.locator('.tuner-instrument').filter({ hasText: 'Guitar' }).first().click();
    await page.getByLabel('Tuning').selectOption('drop-d');
    await expect(page.locator('.header-stat')).toContainText('Drop D');
    await expect(page.locator('.tuner-fixed-value, .metronome-note').first()).toBeVisible();
    await expect(page.locator('.tuner-string')).toHaveCount(6);

    await page.locator('.tuner-instrument').filter({ hasText: 'Piano' }).click();
    await expect(page.locator('.header-stat')).toContainText('Piano');
    await expect(page.locator('.tuner-strings-panel')).toContainText('Any note');
    await expect(page.locator('.tuner-strings-panel')).toContainText('detect any semitone');
    await expect(page.locator('.tuner-mode button').nth(0)).toBeDisabled();
    await expect(page.locator('.tuner-mode button').nth(2)).toBeEnabled();
  });

  test('selects strings and microphone modes', async ({ page }) => {
    await openRoute(page, '/tuner');

    const strings = page.locator('.tuner-string');
    await strings.nth(2).locator('.tuner-string-main').click();
    await expect(strings.nth(2)).toHaveClass(/selected/);

    await page.locator('.tuner-mode button').filter({ hasText: 'Fixed string' }).click();
    await expect(page.locator('.tuner-mode button.active')).toContainText('Fixed string');
    await expect(page.locator('.tuner-strings-panel .metronome-note')).toContainText('Measure against the selected string');

    await page.locator('.tuner-mode button').filter({ hasText: 'Chromatic' }).click();
    await expect(page.locator('.tuner-mode button.active')).toContainText('Chromatic');
  });

  test('changes the reference pitch and plays reference tones', async ({ page }) => {
    await openRoute(page, '/tuner');
    const reference = page.locator('.tuner-reference-panel');

    await reference.getByRole('button', { name: '432', exact: true }).click();
    await expect(reference.locator('.tuner-reference-value')).toHaveText('432.0');
    await expect(reference.locator('.panel-note')).toHaveText('A4 = 432.0 Hz');

    await page.getByRole('slider', { name: 'Reference pitch for A4 in hertz' }).fill('442');
    await expect(reference.locator('.tuner-reference-value')).toHaveText('442.0');

    await page.locator('.tuner-actions').getByRole('button', { name: /^A4 442.0/ }).click();
    await expect(page.locator('.tuner-status-pill')).toHaveText('Reference tone');
    await expect(page.locator('.tuner-note-sub')).toHaveText('Playing the target pitch');
    await expect
      .poll(async () => page.locator('.tuner-status-pill').textContent(), { timeout: 5_000 })
      .toBe('Microphone off');
  });

  test('builds and resets a custom string set', async ({ page }) => {
    await openRoute(page, '/tuner');
    await page.locator('.tuner-instrument').filter({ hasText: 'Custom strings' }).click();

    const panel = page.locator('.tuner-custom-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.tuner-custom-row')).toHaveCount(6);
    await expect(panel.locator('.panel-note').first()).toContainText('6 of 12');

    await panel.getByRole('button', { name: 'Add string' }).click();
    await expect(panel.locator('.tuner-custom-row')).toHaveCount(7);

    await panel.getByRole('button', { name: 'Remove string' }).last().click();
    await expect(panel.locator('.tuner-custom-row')).toHaveCount(6);

    await panel.locator('.tuner-select').first().selectOption('52');
    await expect(panel.locator('.tuner-select').first()).toHaveValue('52');

    await panel.getByRole('button', { name: 'Reset to guitar standard' }).click();
    await expect(panel.locator('.tuner-custom-row')).toHaveCount(6);
    await expect(panel.locator('.tuner-select').first()).toHaveValue('40');
  });

  test('remembers instrument, tuning, mode, and reference across reloads', async ({ page }) => {
    await openRoute(page, '/tuner');

    await page.locator('.tuner-instrument').filter({ hasText: 'Bass guitar' }).click();
    await page.getByLabel('Tuning').selectOption('bass-five');
    await page.locator('.tuner-mode button').filter({ hasText: 'Fixed string' }).click();
    await page.locator('.tuner-reference-panel').getByRole('button', { name: '415', exact: true }).click();

    await expect
      .poll(async () => {
        const raw = await page.evaluate(() => localStorage.getItem('cadence.tuner.v1'));
        return raw ? JSON.parse(raw) : null;
      })
      .toMatchObject({ instrumentId: 'bass', tuningId: 'bass-five', mode: 'string', reference: 415 });

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('.header-stat')).toContainText('Bass guitar');
    await expect(page.locator('.header-stat')).toContainText('5-string low B');
    await expect(page.locator('.tuner-string')).toHaveCount(5);
    await expect(page.locator('.tuner-mode button.active')).toContainText('Fixed string');
    await expect(page.locator('.tuner-reference-value')).toHaveText('415.0');
  });

  test('hides its dock on the tuner while the metronome keeps its state', async ({ page }) => {
    await openRoute(page, '/');
    await page.getByRole('button', { name: 'Open the metronome' }).click();
    await page.locator('.metronome-dock').getByRole('button', { name: 'Start' }).click();
    await expect(page.locator('.metronome-dock')).toHaveClass(/running/);

    await page.locator('.side-link[href="/tools"]').click();
    await page.locator('.tool-card[href="/tuner"]').click();
    await expect(page).toHaveURL(/\/tuner$/);
    await expect(page.locator('.metronome-dock')).toHaveCount(0);

    await page.locator('.side-link[href="/"]').click();
    await expect(page.locator('.metronome-dock')).toBeVisible();
    await expect(page.locator('.metronome-dock')).toHaveClass(/running/);
  });
});
