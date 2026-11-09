import { test as baseTest } from '@playwright/test';
import { expect, expectNoHorizontalOverflow, openRoute, test } from './fixtures';

const ROUTES = [
  '/',
  '/courses',
  '/repertoire',
  '/repertoire/ode-to-joy',
  '/explorer',
  '/sight-reading',
  '/rhythm',
  '/loops',
  '/analysis',
  '/paths',
  '/paths/classical',
  '/glossary',
  '/assignments',
  '/practice',
  '/trainer',
  '/tools',
  '/metronome',
  '/tuner',
  '/settings',
];

test.describe('mobile layout', () => {
  test('uses the compact header and bottom navigation instead of the sidebar', async ({ page }) => {
    await openRoute(page, '/');

    await expect(page.locator('.mobile-header')).toBeVisible();
    await expect(page.locator('.mobile-nav')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeHidden();
    await expect(page.locator('.mobile-link')).toHaveCount(7);
    await expect(page.locator('.mobile-header .language-toggle')).toBeVisible();
    await expect(page.locator('.mobile-link.active')).toContainText('Today');
    await expect(page.locator('.install-prompt')).toHaveCount(0);

    await expectNoHorizontalOverflow(page);
  });

  test('navigates between every section from the bottom bar', async ({ page }) => {
    await openRoute(page, '/');

    const targets = [
      { href: '/courses', heading: 'From first notes to master form.' },
      { href: '/repertoire', heading: 'Graded repertoire' },
      { href: '/practice', heading: 'Daily practice' },
      { href: '/trainer', heading: 'Trainer' },
      { href: '/tools', heading: 'Tools' },
      { href: '/settings', heading: 'Settings' },
      { href: '/', heading: /Good (morning|afternoon|evening)\./ },
    ];

    for (const target of targets) {
      await page.locator(`.mobile-link[href="${target.href}"]`).click();
      await expect(page.locator('main h1')).toContainText(target.heading);
      await expect(page.locator('.mobile-link.active')).toHaveCount(1);
      await expectNoHorizontalOverflow(page);
    }
  });

  test('keeps every page inside the viewport', async ({ page }) => {
    test.setTimeout(90_000);
    for (const route of ROUTES) {
      await openRoute(page, route);
      await expectNoHorizontalOverflow(page);
    }
  });

  test('switches language from the header and remembers it', async ({ page }) => {
    await openRoute(page, '/');

    const toggle = page.locator('.mobile-header .language-toggle');
    await expect(toggle).toHaveAttribute('aria-label', 'Switch to Persian');
    await toggle.click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(await page.evaluate(() => localStorage.getItem('cadence.language'))).toBe('fa');
    await expect(page.locator('.mobile-link[href="/settings"]')).toContainText('تنظیمات');

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('.language-modal')).toHaveCount(0);

    await page.locator('.mobile-header .language-toggle').click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('floats the metronome dock above the bottom navigation', async ({ page }) => {
    await openRoute(page, '/');

    const dock = page.locator('.metronome-dock');
    const nav = page.locator('.mobile-nav');
    await expect(dock).toBeVisible();

    const dockBox = await dock.boundingBox();
    const navBox = await nav.boundingBox();
    expect(dockBox).not.toBeNull();
    expect(navBox).not.toBeNull();
    expect(dockBox!.y + dockBox!.height, 'dock must clear the fixed nav').toBeLessThanOrEqual(navBox!.y + 1);

    await dock.getByRole('button', { name: 'Start' }).click();
    await expect(dock).toHaveClass(/running/);

    await dock.getByRole('button', { name: 'Minimize the metronome' }).click();
    await expect(page.locator('.metronome-dock.collapsed')).toBeVisible();
    await page.getByRole('button', { name: 'Open the metronome' }).click();
    await expect(page.locator('.metronome-dock:not(.collapsed)')).toBeVisible();
  });

  test('opens a lesson and runs its exercise session on a phone', async ({ page }) => {
    await openRoute(page, '/lesson/treble-clef-reading');

    await expect(page.locator('.lesson-aside')).toBeHidden();
    await page.getByRole('button', { name: 'Start exercises' }).click();
    await expect(page.locator('.session-count')).toContainText('Question 1 / 10');
    await expect(page.locator('.choice').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.locator('.choice').first().click();
    await expect(page.locator('.feedback-panel')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

baseTest.describe('mobile first visit', () => {
  baseTest('asks for a language and applies the choice', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const dialog = page.locator('.language-modal');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button')).toHaveCount(2);

    await dialog.locator('.language-option[lang="fa"]').click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('.mobile-header')).toBeVisible();
    await expect(page.locator('.mobile-link.active')).toBeVisible();

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('.language-modal')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  baseTest('keeps the install card close to the metronome dock', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cadence.language', 'en');
      localStorage.removeItem('cadence.install.dismissed.v1');
    });
    await page.goto('/', { waitUntil: 'networkidle' });

    const prompt = page.locator('.install-prompt');
    await expect(prompt).toBeVisible();

    const dockBox = await page.locator('.metronome-dock').boundingBox();
    const promptBox = await prompt.boundingBox();
    expect(dockBox).not.toBeNull();
    expect(promptBox).not.toBeNull();

    const gap = promptBox!.y - (dockBox!.y + dockBox!.height);
    expect(gap, 'install card should hug the metronome dock').toBeGreaterThanOrEqual(0);
    expect(gap, 'install card should hug the metronome dock').toBeLessThanOrEqual(24);
  });
});
