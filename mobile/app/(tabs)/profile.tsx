import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

export default function ProfileScreen() {
  const { user, isLoggedIn, isLoading, login, logout } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Form Belum Lengkap', 'Silakan masukkan email dan password.');
      return;
    }

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || 'Login gagal. Periksa kembali email dan password Anda.';
      Alert.alert('Gagal Masuk', errorMsg);
    }
  };

  const handleLogout = () => {
    Alert.alert('Keluar Akun', 'Apakah Anda yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  // ─── Tampilan Jika Belum Login ─────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <LinearGradient
            colors={['#1a237e', '#283593', '#3949ab']}
            style={styles.loginHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="shield-checkmark" size={60} color="#ffeb3b" />
            <Text style={styles.headerTitle}>LohParkir Mobile</Text>
            <Text style={styles.headerSubtitle}>Masuk untuk mengakses fitur khusus petugas</Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Masuk Akun</Text>
            <Text style={styles.formSubtitle}>Petugas terdaftar & Admin Dishub</Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Alamat Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#9e9e9e" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="contoh: petugas@dishub.go.id"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#9e9e9e" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9e9e9e"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#1a237e', '#3949ab']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={22} color="#fff" />
                    <Text style={styles.loginButtonText}>Masuk Sekarang</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Registration Reminder Alert */}
            <View style={styles.reminderBox}>
              <Ionicons name="information-circle" size={18} color="#e65100" />
              <Text style={styles.reminderText}>
                <Text style={{ fontWeight: 'bold' }}>Catatan Penting:</Text> Akun baru didaftarkan oleh Admin Dishub. Setelah didaftarkan, Anda harus login di sini terlebih dahulu sebelum dapat menggunakan aplikasi.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Helper formatting role
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'officer':
        return 'Petugas Parkir Resmi';
      case 'admin':
        return 'Admin Dinas Perhubungan';
      case 'superadmin':
        return 'Superadmin / Database Administrator';
      case 'public':
        return 'Masyarakat Umum';
      default:
        return role;
    }
  };

  // Helper getting role color theme
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'officer':
        return '#e65100'; // Orange
      case 'admin':
        return '#1a237e'; // Blue
      case 'superadmin':
        return '#7b1fa2'; // Purple
      default:
        return '#2e7d32'; // Green
    }
  };

  // ─── Tampilan Jika Sudah Login ─────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <LinearGradient
        colors={['#1a237e', '#283593']}
        style={styles.profileHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.avatarCircle, { borderColor: getRoleColor(user?.role || '') }]}>
          <Ionicons name="person" size={50} color="#1a237e" />
        </View>
        <Text style={styles.profileName}>{user?.nama}</Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user?.role || '') + '15', borderColor: getRoleColor(user?.role || '') }]}>
          <Text style={[styles.roleText, { color: getRoleColor(user?.role || '') }]}>
            {getRoleLabel(user?.role || '')}
          </Text>
        </View>
      </LinearGradient>

      {/* Details Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.cardTitle}>Detail Akun</Text>

        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={20} color="#757575" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Alamat Email</Text>
            <Text style={styles.detailValue}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="key-outline" size={20} color="#757575" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>ID Pengguna</Text>
            <Text style={styles.detailValue}>{user?.id}</Text>
          </View>
        </View>

        {user?.role === 'officer' && (
          <View style={styles.officerNotice}>
            <Ionicons name="checkmark-circle" size={18} color="#2e7d32" style={{ marginTop: 2 }} />
            <Text style={styles.officerNoticeText}>
              Sebagai <Text style={{ fontWeight: 'bold' }}>Petugas Resmi</Text>, Anda memiliki akses untuk mencatat pembayaran tunai dan mengirim sinyal darurat melalui halaman Beranda.
            </Text>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#c62828" />
          <Text style={styles.logoutButtonText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <Text style={styles.versionText}>LohParkir Mobile v1.0.0 · Dishub Medan</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { paddingBottom: 32 },

  // Login Styles
  loginHeader: {
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 12 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 6, paddingHorizontal: 40 },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  formSubtitle: { fontSize: 12, color: '#757575', marginTop: 2, marginBottom: 20 },

  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#757575', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 14, color: '#1a1a1a' },
  eyeIcon: { padding: 4 },

  loginButton: { borderRadius: 12, overflow: 'hidden', marginTop: 10, elevation: 2 },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    gap: 8,
  },
  loginButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  reminderBox: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  reminderText: { flex: 1, fontSize: 11.5, color: '#e65100', lineHeight: 17 },

  // Profile Styles
  profileHeader: {
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  roleBadge: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  roleText: { fontSize: 12, fontWeight: '700' },

  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    margin: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  detailTextContainer: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#9e9e9e', fontWeight: '600' },
  detailValue: { fontSize: 14, color: '#1a1a1a', fontWeight: '500', marginTop: 1 },

  officerNotice: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  officerNoticeText: { flex: 1, fontSize: 12, color: '#2e7d32', lineHeight: 18 },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#ffebee',
    borderRadius: 12,
    height: 48,
    marginTop: 20,
    backgroundColor: '#fffbfa',
  },
  logoutButtonText: { fontSize: 14, fontWeight: '700', color: '#c62828' },

  versionText: { textAlign: 'center', fontSize: 11, color: '#9e9e9e', marginTop: 10 },
});
