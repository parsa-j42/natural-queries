import { AppShell, Button, Stack } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { useAccentColor } from '@/theme/useAccentColor';
import { navLinks } from './navLinks';

interface NavbarProps {
  // Called after a link is tapped so the parent can close the mobile drawer.
  onNavigate: () => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const location = useLocation();
  const accent = useAccentColor();

  return (
    <AppShell.Navbar p="md">
      <Stack gap="sm">
        {navLinks.map((link) => (
          <Button
            key={link.to}
            component={Link}
            to={link.to}
            onClick={onNavigate}
            fullWidth
            justify="flex-start"
            variant={location.pathname.startsWith(link.match) ? 'filled' : 'light'}
            radius="md"
            color={accent}
          >
            {link.label}
          </Button>
        ))}
      </Stack>
    </AppShell.Navbar>
  );
}
