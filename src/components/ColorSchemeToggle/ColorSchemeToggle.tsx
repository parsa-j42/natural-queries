import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import { nord } from '@/theme/colors';

export function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isLight = colorScheme === 'light';

  return (
    <ActionIcon
      onClick={toggleColorScheme}
      color={isLight ? nord.frost3 : nord.yellow}
      variant="subtle"
      radius="xl"
      size={36}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {isLight ? <IconMoon size={24} /> : <IconSun size={24} />}
    </ActionIcon>
  );
}
