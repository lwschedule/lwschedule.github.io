const { test, expect } = require('@playwright/test');

function parseTranslateX(transform) {
  if (!transform || transform === 'none') return 0;

  const matrix3d = transform.match(/^matrix3d\((.+)\)$/);
  if (matrix3d) {
    const values = matrix3d[1].split(',').map((value) => Number(value.trim()));
    return values[12] || 0;
  }

  const matrix2d = transform.match(/^matrix\((.+)\)$/);
  if (matrix2d) {
    const values = matrix2d[1].split(',').map((value) => Number(value.trim()));
    return values[4] || 0;
  }

  return 0;
}

test('page loads animate from left before ready class', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('#digitalClock')).toHaveCount(1);

  const state = await page.evaluate(async () => {
    const target = document.querySelector('#digitalClock');
    document.body.classList.remove(
      'page-transition-ready',
      'page-transition-exit-forward',
      'page-transition-exit-back'
    );
    const style = window.getComputedStyle(target);

    return {
      opacity: style.opacity,
      transform: style.transform
    };
  });

  expect(Number(state.opacity)).toBeLessThan(1);
  expect(
    parseTranslateX(state.transform),
    'Expected initial enter transform to be leftward (negative X)'
  ).toBeLessThan(0);
});

test('all exits animate to the right', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('#digitalClock')).toHaveCount(1);

  for (const exitClass of ['page-transition-exit-forward', 'page-transition-exit-back']) {
    const state = await page.evaluate((currentExitClass) => {
      const target = document.querySelector('#digitalClock');
      document.body.classList.remove(
        'page-transition-ready',
        'page-transition-exit-forward',
        'page-transition-exit-back'
      );
      document.body.classList.add(currentExitClass);

      const style = window.getComputedStyle(target);

      return {
        opacity: style.opacity,
        transform: style.transform
      };
    }, exitClass);

    expect(Number(state.opacity)).toBeLessThan(1);
    expect(
      parseTranslateX(state.transform),
      'Expected exit transform to move rightward (positive X)'
    ).toBeGreaterThan(0);
  }
});

test('404 page initializes transition runtime', async ({ page }) => {
  await page.goto('/404.html');

  await expect.poll(async () => {
    return page.evaluate(() => document.body.classList.contains('page-transition-ready'));
  }).toBe(true);
});

for (const path of ['/index.html', '/today/index.html', '/settings/index.html', '/week/index.html', '/404.html']) {
  test(`shared transition runtime initializes on ${path}`, async ({ page }) => {
    await page.goto(path);

    await expect.poll(async () => {
      return page.evaluate(async () => {
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));
        return {
          loaded: window.__lws_common_loaded === true,
          ready: document.body.classList.contains('page-transition-ready')
        };
      });
    }).toMatchObject({ loaded: true, ready: true });
  });
}
