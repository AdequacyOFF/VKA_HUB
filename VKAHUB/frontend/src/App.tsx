import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Notifications } from '@mantine/notifications';
import { AppRouter } from './routes';
import { theme } from './theme';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import './styles/glassmorphism.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Data immediately stale → always refetch on mount
      gcTime: 5 * 60 * 1000, // Keep in cache 5 minutes for background use
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnMount: true, // Combined with staleTime: 0 → always refetches
      refetchOnReconnect: true, // Refetch when reconnecting to network
      retry: 1, // Only retry once on failure
    },
  },
});

// Listen for logout event to clear React Query cache
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    queryClient.clear();
  });
}

function App() {
  return (
    <>
      <ColorSchemeScript defaultColorScheme="dark" />
      <MantineProvider theme={theme} forceColorScheme="dark">
        <Notifications position="top-right" />
        <QueryClientProvider client={queryClient}>
          <AppRouter />
        </QueryClientProvider>
      </MantineProvider>
    </>
  );
}

export default App;
