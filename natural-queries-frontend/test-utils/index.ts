// Re-export Testing Library with our Mantine-aware render, so tests import
// everything from '@test-utils'.
import userEvent from '@testing-library/user-event';

export * from '@testing-library/react';
export { render } from './render';
export { userEvent };
