import { expect, test } from 'vitest';

import { runFilter } from './test.fixtures';

import { toFunction } from './index';

test('Security', async () => {
  expect(await runFilter('toString')).toBeUndefined();
  const polluted = global as unknown as { p0wned: boolean };

  polluted.p0wned = false;
  const attack = toFunction(
    'constructor.constructor.name.replace("",constructor.constructor("global.p0wned=true"))',
  );
  expect(attack, 'Should compile').toBeTruthy();
  const result = await attack().catch((e) => e);
  expect(result instanceof Error, 'Should be an error return').toBeTruthy();
  expect(polluted.p0wned, 'Should not modify global').toBe(false);

  expect(
    await toFunction('a')(Object.create({ a: 42 })),
    'Should not access prototype props',
  ).toBeUndefined();
});
