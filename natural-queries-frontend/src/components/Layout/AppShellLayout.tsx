import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navbar } from './Navbar';

export function AppShellLayout() {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 240,
        breakpoint: 'sm',
        // The navbar is only a mobile menu. On desktop the nav lives in the header,
        // so it is collapsed there.
        collapsed: { mobile: !opened, desktop: true },
      }}
      padding="md"
    >
      <Header opened={opened} toggle={toggle} />
      <Navbar onNavigate={close} />
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
