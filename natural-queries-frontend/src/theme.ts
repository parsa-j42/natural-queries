import { createTheme } from '@mantine/core';

export const theme = createTheme({
  // Mantine accepts any CSS color in the `color` prop and derives variants from it,
  // so we keep the Nord accents as semantic tokens (see theme/colors.ts) rather than
  // registering full color scales. Defaults below just set a consistent baseline.
  defaultRadius: 'md',
  cursorType: 'pointer',
  fontFamilyMonospace: "'Monaco', 'Courier New', monospace",
});
