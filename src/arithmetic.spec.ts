import { describe, expect, test } from 'vitest';

import { runFilter } from './test.fixtures';

describe('Arithmetics', () => {
  test('can do simple numeric expressions', async () => {
    expect(await runFilter('1 + 2 * 3')).toBe(7);
    expect(await runFilter('2 * 3 + 1')).toBe(7);
    expect(await runFilter('1 + (2 * 3)')).toBe(7);
    expect(await runFilter('(1 + 2) * 3')).toBe(9);
    expect(await runFilter('((1 + 2) * 3 / 2 + 1 - 4 + (2 ^ 3)) * -2')).toBe(-19);
    expect(await runFilter('1.4 * 1.1')).toBe(1.54);
    expect(await runFilter('97 % 10')).toBe(7);
  });

  test('does math functions', async () => {
    expect(await runFilter('abs(-5)')).toBe(5);
    expect(await runFilter('abs(5)')).toBe(5);
    expect(await runFilter('ceil(4.1)')).toBe(5);
    expect(await runFilter('ceil(4.6)')).toBe(5);
    expect(await runFilter('floor(4.1)')).toBe(4);
    expect(await runFilter('floor(4.6)')).toBe(4);
    expect(await runFilter('round(4.1)')).toBe(4);
    expect(await runFilter('round(4.6)')).toBe(5);
    expect(await runFilter('sqrt(9)')).toBe(3);
  });

  test('supports functions with multiple args', async () => {
    expect(await runFilter('random() >= 0')).toBe(1);
    expect(await runFilter('min(2)')).toBe(2);
    expect(await runFilter('max(2)')).toBe(2);
    expect(await runFilter('min(2, 5)')).toBe(2);
    expect(await runFilter('max(2, 5)')).toBe(5);
    expect(await runFilter('min(2, 5, 6)')).toBe(2);
    expect(await runFilter('max(2, 5, 6)')).toBe(6);
    expect(await runFilter('min(2, 5, 6, 1)')).toBe(1);
    expect(await runFilter('max(2, 5, 6, 1)')).toBe(6);
    expect(await runFilter('min(2, 5, 6, 1, 9)')).toBe(1);
    expect(await runFilter('max(2, 5, 6, 1, 9)')).toBe(9);
    expect(await runFilter('min(2, 5, 6, 1, 9, 12)')).toBe(1);
    expect(await runFilter('max(2, 5, 6, 1, 9, 12)')).toBe(12);
  });

  test('can do comparisons', async () => {
    expect(await runFilter('foo == 4', { foo: 4 })).toBe(1);
    expect(await runFilter('foo == 4', { foo: 3 })).toBe(0);
    expect(await runFilter('foo == 4', { foo: -4 })).toBe(0);
    expect(await runFilter('foo != 4', { foo: 4 })).toBe(0);
    expect(await runFilter('foo != 4', { foo: 3 })).toBe(1);
    expect(await runFilter('foo != 4', { foo: -4 })).toBe(1);
    expect(await runFilter('foo > 4', { foo: 3 })).toBe(0);
    expect(await runFilter('foo > 4', { foo: 4 })).toBe(0);
    expect(await runFilter('foo > 4', { foo: 5 })).toBe(1);
    expect(await runFilter('foo >= 4', { foo: 3 })).toBe(0);
    expect(await runFilter('foo >= 4', { foo: 4 })).toBe(1);
    expect(await runFilter('foo >= 4', { foo: 5 })).toBe(1);
    expect(await runFilter('foo < 4', { foo: 3 })).toBe(1);
    expect(await runFilter('foo < 4', { foo: 4 })).toBe(0);
    expect(await runFilter('foo < 4', { foo: 5 })).toBe(0);
    expect(await runFilter('foo <= 4', { foo: 3 })).toBe(1);
    expect(await runFilter('foo <= 4', { foo: 4 })).toBe(1);
    expect(await runFilter('foo <= 4', { foo: 5 })).toBe(0);
  });

  test('can do boolean logic', async () => {
    expect(await runFilter('0 and 0')).toBe(0);
    expect(await runFilter('0 and 1')).toBe(0);
    expect(await runFilter('1 and 0')).toBe(0);
    expect(await runFilter('1 and 1')).toBe(1);
    expect(await runFilter('0 or 0')).toBe(0);
    expect(await runFilter('0 or 1')).toBe(1);
    expect(await runFilter('1 or 0')).toBe(1);
    expect(await runFilter('1 or 1')).toBe(1);
    expect(await runFilter('this_is_undefined.really or 1')).toBe(1);
    expect(await runFilter('thisis.really or 0', { thisis: {} })).toBe(0);
    expect(await runFilter('thisis.really or 1', { thisis: {} })).toBe(1);
    expect(await runFilter('thisis.really or 0', { thisis: { really: {} } })).toBe(1);
    expect(await runFilter('not 0')).toBe(1);
    expect(await runFilter('not 1')).toBe(0);
    expect(await runFilter('(0 and 1) or 1')).toBe(1);
    expect(await runFilter('0 and (1 or 1)')).toBe(0);
    expect(await runFilter('0 and 1 or 1')).toBe(1);
    expect(await runFilter('1 or 1 and 0')).toBe(1);
    expect(await runFilter('not 1 and 0')).toBe(0);
  });
});
