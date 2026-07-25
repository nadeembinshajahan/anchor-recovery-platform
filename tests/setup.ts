import "@testing-library/jest-dom/vitest";

// jsdom in this environment does not provide Web Storage; the app's
// safety-plan store depends on it. Install a spec-shaped in-memory
// implementation only when missing.
if (typeof window !== "undefined" && !window.localStorage) {
  const store = new Map<string, string>();
  const localStorageShim: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    key: (i: number) => [...store.keys()][i] ?? null,
    removeItem: (k: string) => {
      store.delete(k);
    },
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
  };
  Object.defineProperty(window, "localStorage", {
    value: localStorageShim,
    configurable: true,
  });
}
