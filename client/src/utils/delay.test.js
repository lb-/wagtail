import { delay } from './delay';

jest.useFakeTimers();
jest.spyOn(global, 'setTimeout');

describe('delay', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not delay if wait is not a number', () => {
    const func = jest.fn();

    delay(func);
    expect(func).toHaveBeenCalledTimes(1);

    delay(func, null);
    expect(func).toHaveBeenCalledTimes(2);

    delay(func, undefined);
    expect(func).toHaveBeenCalledTimes(3);

    delay(func, 0 / 0 /* NaN */);
    expect(func).toHaveBeenCalledTimes(4);
  });

  it('should provide the args to the function', async () => {
    const func = jest.fn();

    delay(func, null, 'a', 'b', 'c');
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('a', 'b', 'c');

    delay(func, 30, 'x', 'y', ['Z']);
    expect(func).toHaveBeenCalledTimes(1);

    await jest.runAllTimersAsync();
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenLastCalledWith('x', 'y', ['Z']);
  });

  it('should delay the function', async () => {
    const func = jest.fn();

    delay(func, 320);
    expect(func).toHaveBeenCalledTimes(0);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 320);

    await jest.runAllTimersAsync();
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should return a promise with the function result when delayed', () => {
    const func = jest.fn((prefix = '_') => `${prefix}:bar`);
    const promise = delay(func, 100, 'foo');

    expect(promise).toBeInstanceOf(Promise);
    expect(func).toHaveBeenCalledTimes(0);

    jest.runAllTimers();
    expect(func).toHaveBeenCalledTimes(1);

    return expect(promise).resolves.toBe('foo:bar');
  });

  it('should return a promise with the function result when not delayed', () => {
    const func = jest.fn((prefix = '_') => `${prefix}:bar`);
    const promise = delay(func);

    expect(promise).toBeInstanceOf(Promise);
    expect(func).toHaveBeenCalledTimes(1);

    return expect(promise).resolves.toBe('_:bar');
  });
});
