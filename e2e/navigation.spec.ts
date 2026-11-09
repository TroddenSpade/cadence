import { collectPageErrors, expect, expectNoHorizontalOverflow, openRoute, test } from './fixtures';

const ROUTES = [
  { path: '/', heading: /Good (morning|afternoon|evening)\./, nav: 'Today' },
  { path: '/courses', heading: 'From first notes to master form.', nav: 'Courses' },
  { path: '/courses/staff-pitch', heading: 'Pitch & the Staff' },
  { path: '/lesson/treble-clef-reading', heading: 'Reading the Treble Clef' },
  { path: '/repertoire', heading: 'Graded repertoire', nav: 'Repertoire' },
  { path: '/repertoire/ode-to-joy', heading: 'Ode to Joy' },
  { path: '/explorer', heading: 'Scale & chord explorer' },
  { path: '/sight-reading', heading: 'Sight-reading room' },
  { path: '/rhythm', heading: 'Rhythm room' },
  { path: '/loops', heading: 'Backing loops' },
  { path: '/analysis', heading: 'Harmony analysis' },
  { path: '/paths', heading: 'Style paths' },
  { path: '/paths/classical', heading: 'The classical path' },
  { path: '/glossary', heading: 'Glossary' },
  { path: '/assignments', heading: 'Assignments & worksheets' },
  { path: '/practice', heading: 'Daily practice', nav: 'Practice' },
  { path: '/trainer', heading: 'Trainer', nav: 'Trainer' },
  { path: '/tools', heading: 'Tools', nav: 'Tools' },
  { path: '/metronome', heading: 'Metronome' },
  { path: '/tuner', heading: 'Tuner' },
  { path: '/settings', heading: 'Settings', nav: 'Settings' },
];

test('every route renders one heading and no horizontal overflow', async ({ page }) => {
  test.setTimeout(90_000);
  const errors = collectPageErrors(page);

  for (const route of ROUTES) {
    await openRoute(page, route.path);
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.locator('main h1')).toContainText(route.heading);
    await expectNoHorizontalOverflow(page);
  }

  expect(errors, errors.join('\n')).toEqual([]);
});

test('sidebar marks the current section and reaches every page', async ({ page }) => {
  await openRoute(page, '/');
  const nav = page.getByRole('navigation', { name: 'Main navigation' }).first();

  for (const route of ROUTES.filter((item) => item.nav)) {
    await page.locator(`.side-link[href="${route.path}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${route.path.replace('/', '\\/')}$`));
    await expect(nav.locator('.side-link.active')).toHaveCount(1);
    await expect(nav.locator('.side-link.active')).toContainText(route.nav!);
    await expect(page.locator('main h1')).toBeVisible();
  }
});

test('course cards and lessons drill down without leaving the app', async ({ page }) => {
  await openRoute(page, '/courses');

  const courseCard = page.locator('.course-card').first();
  const courseTitle = (await courseCard.locator('h3').innerText()).trim();
  await courseCard.click();
  await page.waitForURL(/\/courses\//);
  await expect(page.locator('main h1')).toContainText(courseTitle);

  const lessonRow = page.locator('.lesson-row').first();
  await lessonRow.click();
  await page.waitForURL(/\/lesson\//);
  await expect(page.locator('.lesson-header h1')).toBeVisible();
  await expect(page.locator('.lesson-section').first()).toBeVisible();
  await expect(page.locator('.practice-banner')).toBeVisible();

  await page.getByRole('link', { name: /Courses/ }).first().click();
  await expect(page.locator('main h1')).toContainText('From first notes to master form.');
});

test('unknown routes show the not-found page with working exits', async ({ page }) => {
  await openRoute(page, '/this-page-does-not-exist');
  await expect(page.locator('main h1')).toHaveText('This page is off the staff.');
  await expect(page.locator('main h1')).toHaveCount(1);

  await page.getByRole('link', { name: 'Back to today' }).click();
  await expect(page.locator('.hero')).toBeVisible();

  await page.goto('/lesson/not-a-real-lesson', { waitUntil: 'networkidle' });
  await expect(page.locator('main h1')).toHaveText('This page is off the staff.');

  await page.goto('/courses/not-a-real-course', { waitUntil: 'networkidle' });
  await expect(page.locator('main h1')).toHaveText('This page is off the staff.');
});

test('the metronome dock is available away from its full page only', async ({ page }) => {
  await openRoute(page, '/metronome');
  await expect(page.locator('.metronome-dock')).toHaveCount(0);

  await page.locator('.side-link[href="/"]').click();
  await expect(page.locator('.metronome-dock')).toBeVisible();
  await expect(page.locator('.metronome-dock.collapsed')).toBeVisible();
  await expect(page.locator('.metronome-dock')).toHaveCount(1);
  await expect(page.locator('.metronome-dock-fab')).toHaveCount(1);

  await page.goto('/tuner', { waitUntil: 'networkidle' });
  await expect(page.locator('.metronome-dock')).toHaveCount(0);
});

test('the sidebar and mobile navigation expose the same destinations', async ({ page }) => {
  await openRoute(page, '/');
  const sidebarLinks = await page.locator('.side-link').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );
  const mobileLinks = await page.locator('.mobile-link').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );
  expect(mobileLinks).toEqual(sidebarLinks);
});
