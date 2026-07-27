export interface ICacheKeyBuilder {
  build(parts: readonly unknown[]): string;
}
