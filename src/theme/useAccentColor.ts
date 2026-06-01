import { useMantineColorScheme } from '@mantine/core';
import { brand } from './colors';

// The interactive accent flips between schemes (blue on light, orange on dark).
export function useAccentColor() {
  const { colorScheme } = useMantineColorScheme();
  return colorScheme === 'dark' ? brand.accentDark : brand.accentLight;
}
