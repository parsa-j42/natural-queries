import { AppShell, Group, Burger, Text, Button, useMantineColorScheme, Avatar } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle/ColorSchemeToggle';

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

export function Header({ opened, toggle }: HeaderProps) {
  const location = useLocation();
  const { colorScheme } = useMantineColorScheme();

  return (
    <AppShell.Header bg={colorScheme === "light" ? "#e5e9f0" : "#3b4252"}>
      <Group h="100%" px="md" justify="space-between">
        <Group>
          <Avatar src="favicon.jpeg" alt="Logo" radius="sm"/>
          <Text variant="gradient" component="span" gradient={{ from: '#a3be8c', to: '#d08770' }} size="xl" fw={800}>Natural Queries</Text>
        </Group>

        <Group>
          <Button
            component={Link}
            to="/playground"
            variant={location.pathname.startsWith('/playground') ? 'filled' : 'light'}
            radius="md"
            color={colorScheme === "light" ? "#5e81ac" : "#d08770"}
          >
            Playground Mode
          </Button>
          <Button
            component={Link}
            to="/story"
            variant={location.pathname.startsWith('/story') ? 'filled' : 'light'}
            radius="md"
            color={colorScheme === "light" ? "#5e81ac" : "#d08770"}
          >
            Story Mode
          </Button>
          <ColorSchemeToggle />

        </Group>
      </Group>
    </AppShell.Header>
  );
}
