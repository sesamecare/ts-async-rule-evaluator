import { describe, expect, test } from 'vitest';

import { FiltrexType, resetObjectResolver, toFunction } from './index';

let counter = 0;
let nullCounter = 0;
const doc1 = {
  category: 'meal',
  obj: { num: 6, str: 'gasbuddy', more: { cowbell: true } },
  foo: ['green'],
};
const doc2 = {
  category: 'dessert',
  obj: { num: 1, str: 'gasbuddy' },
  foo: ['blue', 'red', 'green'],
};
const doc3 = {
  async delayed() {
    return new Promise((accept) => setTimeout(() => accept('meal'), 100));
  },
  cached() {
    counter += 1;
    return counter;
  },
  returnNull() {
    nullCounter += 1;
    return null;
  },
  async thrown() {
    return new Promise((accept, reject) => setTimeout(() => reject(new Error('Foobar')), 100));
  },
};

describe('test_function', () => {
  test('simple property match', async () => {
    const filter = toFunction('category == "meal"');
    expect(await filter(doc1), 'Should match intended target').toBeTruthy();
    expect(await filter(doc2), 'Should not match unintended target').not.toBeTruthy();
  });

  test('deep property match', async () => {
    const filter = toFunction('obj.num == 6');
    expect(await filter(doc1), 'Should match intended target').toBeTruthy();
    expect(await filter(doc2), 'Should not match unintended target').not.toBeTruthy();
  });

  test('deep property match', async () => {
    let filter = toFunction('obj.more.cowbell');
    expect(await filter(doc1), 'Should match intended target').toBeTruthy();
    expect(await filter(doc2), 'Should not match unintended target').not.toBeTruthy();

    filter = toFunction('obj.more.cowbell and category == "meal"');
    expect(await filter(doc1), 'Should match intended target').toBeTruthy();
    expect(await filter(doc2), 'Should not match unintended target').not.toBeTruthy();
  });

  test('promise match', async () => {
    let filter = toFunction('delayed == "meal"');
    expect(await filter(doc3), 'Should match intended target').toBeTruthy();
    filter = toFunction('delayed == "meal" and delayed != "dessert"');
    expect(await filter(doc3), 'Should match intended target with caching').toBeTruthy();
    filter = toFunction('delayed != "meal"');
    expect(await filter(doc3), 'Should not match unintended target').not.toBeTruthy();

    filter = toFunction('cached > 0 and cached == 1 and cached != 2');
    expect(await filter(doc3), 'Should match intended target').toBeTruthy();
    expect(await filter(doc2), 'Should not match unintended target').not.toBeTruthy();
    resetObjectResolver(doc3);
    filter = toFunction('cached == 2 and cached <= 2');
    expect(await filter(doc3), 'Should match intended target').toBeTruthy();

    nullCounter = 0;
    filter = toFunction('not returnNull');
    await filter(doc3);
    await filter(doc3);
    expect(nullCounter, 'Should only run the promise once').toBe(1);
  });

  test('inverted array match', async () => {
    const filter = toFunction('"red" in foo');
    expect(await filter(doc2), 'Should match intended target').toBeTruthy();
    expect(await filter(doc1), 'Should not match unintended target').not.toBeTruthy();
    expect(await filter(doc3), 'Should not match unintended target').not.toBeTruthy();
  });

  test('array length match', async () => {
    let filter = toFunction('foo.length > 1');
    expect(await filter(doc2), 'Should match intended target').toBeTruthy();
    expect(await filter(doc1), 'Should not match unintended target').not.toBeTruthy();
    expect(await filter(doc3), 'Should not match unintended target').not.toBeTruthy();

    filter = toFunction('length(foo) == 0');
    expect(await filter(doc3), 'Should match intended target').toBeTruthy();
  });

  test('string lower', async () => {
    let filter = toFunction('lower(foo) == "brookline"');
    expect(await filter({ foo: 'BROOKLINE' }), 'Should match intended target').toBeTruthy();
    expect(await filter({ foo: 'brookline' }), 'Should match intended target').toBeTruthy();
    expect(
      await filter({ foo: 'brooklinen' }),
      'Should not match unintended target',
    ).not.toBeTruthy();

    filter = toFunction('lower(foo) ~= "^brookline"');
    expect(await filter({ foo: 'BROOKLINE' }), 'Should match intended target').toBeTruthy();
  });

  test('substring', async () => {
    const filter = toFunction('substr(foo, 0, 5) == "01234"');
    expect(await filter({ foo: '0123456789' }), 'Should match intended target').toBeTruthy();
    expect(await filter({ foo: '01234' }), 'Should match intended target').toBeTruthy();
    expect(
      await filter({ foo: '12345678' }),
      'Should not match unintended target',
    ).not.toBeTruthy();
  });

  test('multiparam custom function', async () => {
    let filter = toFunction('add(1, "3") == 4', {
      functions: {
        add(a, b) {
          return Number(a) + Number(b);
        },
      },
    });
    expect(await filter({}), 'Should match intended target').toBeTruthy();

    filter = toFunction('add(\'1\', "3", 5) == nine', {
      functions: {
        add(...args: number[]) {
          return args.reduce((prev, cur) => Number(cur) + prev, 0);
        },
      },
    });
    expect(await filter({ nine: 9, 1: 1 }), 'Should match intended target').toBeTruthy();
    expect(await filter({}), 'Should not match unintended target').not.toBeTruthy();
  });

  test('event interception', () => {
    let code: string | undefined;
    toFunction('transactions <= 5 and abs(profit) > 20.5', {
      onParse({ functionObject }) {
        code = functionObject.toString();
      },
    });
    expect(
      code?.startsWith('async function anonymous(fns,std,prop'),
      'Code should start with expected value',
    ).toBeTruthy();
    expect(code, 'Code should match').toMatchInlineSnapshot(`
      "async function anonymous(fns,std,prop
      ) {
      return (std.numify((std.numify((await prop(\\"transactions\\"))<=(5)))&&(std.numify(((std.isfn(fns, \\"abs\\") ? (await fns[\\"abs\\"].call(prop, (await prop(\\"profit\\")))) : std.unknown(\\"abs\\")))> (20.5)))));
      }"
    `);
  });

  test('async function', async () => {
    async function delayed(v: number) {
      return new Promise((accept) => setTimeout(() => accept(v), 10));
    }
    const fn = toFunction('delayed(6) + 1', {
      functions: { delayed },
    });
    expect(fn({}), 'Should match intended target').resolves.toBe(7);
  });

  test('"this" is prop resolver', () => {
    function selfProp(this: (prop: string) => FiltrexType, x: string) {
      return this(x);
    }
    const fn = toFunction('selfProp("foo")', {
      functions: { selfProp },
    });
    expect(fn({ foo: 'bar' }), 'Should be able to access prop value').resolves.toBe('bar');
  })
});
