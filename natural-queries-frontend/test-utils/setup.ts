// Global Vitest setup: jest-dom matchers plus the browser APIs Mantine reaches
// for that jsdom does not implement.
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mantine reads matchMedia (responsive props, color scheme). jsdom has none.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// ScrollArea and friends observe size; jsdom has no ResizeObserver.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
