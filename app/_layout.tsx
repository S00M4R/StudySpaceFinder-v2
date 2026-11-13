import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../src/lib/AuthContext';
import { AuthScreen } from '../src/screens/AuthScreen';
import { SpacesProvider } from '../src/lib/SpacesContext';
import { LoadingScreen } from '../src/components/UI';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;
  return (
    <SpacesProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="space/[id]" />
      </Stack>
    </SpacesProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}