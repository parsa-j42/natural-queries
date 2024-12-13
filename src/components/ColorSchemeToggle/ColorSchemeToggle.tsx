import { ActionIcon, Group, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Group>
      <ActionIcon
        onClick={() => toggleColorScheme()}
        color={colorScheme === "light" ? "#5e81ac" : "#ebcb8b"}
        variant="subtle"
        radius="xl"
        size={36}
      >
        {colorScheme === "light" ? <IconMoon size={24} /> : <IconSun size={24} />}
      </ActionIcon>
    </Group>
  );
}
