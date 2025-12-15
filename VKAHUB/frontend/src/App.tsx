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
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
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
