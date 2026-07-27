import { CacheKeyBuilder } from './CacheKeyBuilder';

describe('CacheKeyBuilder', () => {
  let builder: CacheKeyBuilder;

  beforeEach(() => {
    builder = new CacheKeyBuilder();
  });

  it('should build string keys', () => {
    expect(builder.build(['user', 'profile', '123'])).toBe('user:profile:123');
  });

  it('should handle numbers and booleans', () => {
    expect(builder.build(['item', 42, true, false])).toBe('item:42:true:false');
  });

  it('should handle null and undefined', () => {
    expect(builder.build(['key', null, undefined])).toBe('key:null:undefined');
  });

  it('should handle arrays', () => {
    expect(builder.build(['tags', ['a', 'b']])).toBe('tags:["a","b"]');
  });

  it('should handle objects and nested objects deterministically', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    expect(builder.build(['query', obj1])).toBe('query:{"a":1,"b":{"c":2}}');
  });

  it('should handle mixed values', () => {
    expect(builder.build(['test', 1, null, { x: 'y' }])).toBe(
      'test:1:null:{"x":"y"}',
    );
  });
});
