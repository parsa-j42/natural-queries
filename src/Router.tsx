import { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LoadingOverlay } from '@mantine/core';

// Lazy load components
const AppShellLayout = lazy(() => import('./components/Layout/AppShellLayout').then(module => ({
  default: module.AppShellLayout
})));

const HomePage = lazy(() => import('./pages/Home.page').then(module => ({
  default: module.HomePage
})));

const StoryMode = lazy(() => import('./pages/StoryMode.page').then(module => ({
  default: module.StoryMode
})));

const PlaygroundMode = lazy(() => import('./pages/PlaygroundMode.page').then(module => ({
  default: module.PlaygroundMode
})));

// Loading fallback component
const PageLoader = () => (
  <LoadingOverlay
    zIndex={1000}
    visible={true}
    overlayProps={{ radius: 'sm', blur: 2 }}
    loaderProps={{ color: '#8fbcbb', type: 'bars', size: 'lg' }}
  />
);

// Wrap component with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Create router with lazy-loaded routes
const router = createBrowserRouter([
  {
    path: '/',
    element: withSuspense(AppShellLayout),
    children: [
      {
        index: true,
        element: withSuspense(HomePage),
      },
      {
        path: 'story/*',
        element: withSuspense(StoryMode),
      },
      {
        path: 'playground',
        element: withSuspense(PlaygroundMode),
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}

// Enable webpack/vite preloading hints
const preloadRoute = (route: string) => {
  const routes = {
    home: () => import('./pages/Home.page'),
    story: () => import('./pages/StoryMode.page'),
    playground: () => import('./pages/PlaygroundMode.page'),
  };

  if (route in routes) {
    routes[route as keyof typeof routes]();
  }
};

// Export preload function for manual route preloading
export { preloadRoute };