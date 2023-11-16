import { describe, expect, test } from 'vitest';

import { toFunction } from './index';

describe('Object support', async () => {
  test('can bind to data', async () => {
    const something = toFunction('1 + foo * bar');
    expect(await something({ foo: 5, bar: 2 })).toBe(11);
    expect(await something({ foo: 2, bar: 1 })).toBe(3);
  });

  test('includes symbols with dots', async () => {
    expect(await toFunction('hello.world.foo')({ hello: { world: { foo: 123 } } })).toBe(123);
    expect(await toFunction('order.gooandstuff')({ order: { gooandstuff: 123 } })).toBe(123);
  });

  test('includes quoted symbols', async () => {
    expect(await toFunction("'hello-world-foo'")({ 'hello-world-foo': 123 })).toBe(123);
    expect(await toFunction("'order+goo*and#stuff'")({ 'order+goo*and#stuff': 123 })).toBe(123);
  });

  test('includes symbols with $ and _', async () => {
    expect(await toFunction('$_.0$$')({ $_: { '0$$': 123 } })).toBe(123);
  });

  test('disallows symbols starting with numerals', async () => {
    expect(() => toFunction('0hey')).toThrow();
    expect(() => toFunction('123.456hey')).toThrow();
  });

  test('null should be falsy', async () => {
    const checkfornull = toFunction('myobj.myprop');
    expect(await checkfornull({ myobj: { myprop: null } })).not.toBeTruthy();
  });
});
