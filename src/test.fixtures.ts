import { FiltrexType, toFunction } from './index';

export async function runFilter(input: string, data: FiltrexType = {}) {
  const fn = toFunction(input);
  return fn(data);
}
