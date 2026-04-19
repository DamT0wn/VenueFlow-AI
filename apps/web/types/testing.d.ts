import 'vitest';

declare module 'jest-axe' {
  export function axe(node: Element | DocumentFragment): Promise<unknown>;
  export const toHaveNoViolations: Record<string, (...args: unknown[]) => unknown>;
}

declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }

  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}

export {};
