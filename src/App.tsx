import '@mantine/core/styles.css';
import './global.css';
import { MantineProvider } from '@mantine/core';
import { Router } from './Router';
import { theme } from './theme';
import { Notifications } from '@mantine/notifications';
import '@mantine/notifications/styles.css';
import { SchemaProvider } from './contexts/SchemaContext';

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <SchemaProvider>
      <Notifications position="top-right" zIndex={1000}/>
      <Router />
        </SchemaProvider>
    </MantineProvider>
  );
}
