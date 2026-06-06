import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a237e' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Masuk - LohParkir' }} />
      <Stack.Screen name="register" options={{ title: 'Daftar Akun Baru' }} />
    </Stack>
  );
}
