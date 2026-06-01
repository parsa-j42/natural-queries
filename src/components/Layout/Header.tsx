import { AppShell, Avatar, Burger, Button, Group, Text, useMantineColorScheme } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle/ColorSchemeToggle';
import { brand, nord } from '@/theme/colors';
import { useAccentColor } from '@/theme/useAccentColor';
import { navLinks } from './navLinks';

interface HeaderProps {
  opened: boolean;
  toggle: () => void;
}

export function Header({ opened, toggle }: HeaderProps) {
  const location = useLocation();
  const { colorScheme } = useMantineColorScheme();
  const accent = useAccentColor();

  return (
    <AppShell.Header bg={colorScheme === 'light' ? nord.snow1 : nord.night1}>
      <Group h="100%" px="md" justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          {/* Burger only shows below the navbar breakpoint, where the drawer takes over */}
          <Burger opened={opened} onClick={toggle} size="sm" hiddenFrom="sm" />
          <Avatar src="/favicon.jpeg" alt="Natural Queries logo" radius="sm" />
          <Text
            variant="gradient"
            component="span"
            gradient={{ from: brand.playground, to: brand.accentDark }}
            size="xl"
            fw={800}
            style={{ whiteSpace: 'nowrap' }}
          >
            Natural Queries
          </Text>
        </Group>

        <Group gap="sm" wrap="nowrap">
          <Group gap="sm" visibleFrom="sm">
            {navLinks.map((link) => (
              <Button
                key={link.to}
                component={Link}
                to={link.to}
                variant={location.pathname.startsWith(link.match) ? 'filled' : 'light'}
                radius="md"
                color={accent}
              >
                {link.label}
              </Button>
            ))}
          </Group>
          <ColorSchemeToggle />
        </Group>
      </Group>
    </AppShell.Header>
  );
}
