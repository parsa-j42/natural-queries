// Custom render that wraps components in MantineProvider, since Mantine
// components read theme context. Use this instead of RTL's render directly.
import type { ReactElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { render as testingLibraryRender } from '@testing-library/react';

export function render(ui: ReactElement) {
  return testingLibraryRender(ui, {
    wrapper: ({ children }) => <MantineProvider>{children}</MantineProvider>,
  });
}
