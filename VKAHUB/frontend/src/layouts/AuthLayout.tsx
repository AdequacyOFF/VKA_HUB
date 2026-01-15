import { Outlet } from 'react-router-dom';
import { Container, Paper, Center } from '@mantine/core';

export function AuthLayout() {
  return (
    <Center style={{ minHeight: '100vh', padding: '20px' }}>
      <Container size="sm">
        <Paper
          className="glass-card"
          p="xl"
          radius={0}
          style={{
            border: '1px solid rgba(255, 255, 255, 0.18)',
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Center>
  );
}
