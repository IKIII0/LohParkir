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
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function RegisterScreen() {
  const { register, isLoading } = useAuthStore();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'public' | 'officer'>('public');
  
  // Officer-specific inputs
  const [nip, setNip] = useState('');
  const [nomorHp, setNomorHp] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!nama || !email || !password) {
      Alert.alert('Form Belum Lengkap', 'Nama, Email, dan Password wajib diisi.');
      return;
    }

    if (role === 'officer' && (!nip || !nomorHp)) {
      Alert.alert('Form Belum Lengkap', 'NIP dan Nomor HP wajib diisi untuk pendaftaran Petugas.');
      return;
    }

    try {
      await register({
        nama: nama.trim(),
        email: email.trim(),
        password,
        role,
        nip: role === 'officer' ? nip.trim() : undefined,
        nomorHp: role === 'officer' ? nomorHp.trim() : undefined,
      });

      Alert.alert(
        'Pendaftaran Berhasil',
        'Akun Anda berhasil didaftarkan! Silakan masuk ke akun Anda menggunakan email dan password tersebut.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(auth)/login');
            },
          },
        ]
      );
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || 'Registrasi gagal. Email atau NIP mungkin sudah terdaftar.';
      Alert.alert('Gagal Mendaftar', errorMsg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient
          colors={['#1a237e', '#283593', '#3949ab']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="person-add" size={50} color="#ffeb3b" />
          <Text style={styles.headerTitle}>Buat Akun Baru</Text>
          <Text style={styles.headerSubtitle}>Silakan isi data diri Anda dengan lengkap</Text>
        </LinearGradient>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Role Picker (Segmented Toggle) */}
          <Text style={styles.inputLabel}>Daftar Sebagai:</Text>
          <View style={styles.rolePickerContainer}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                role === 'public' && styles.roleOptionActive,
              ]}
              onPress={() => setRole('public')}
              disabled={isLoading}
            >
              <Ionicons
                name="people"
                size={18}
                color={role === 'public' ? '#fff' : '#757575'}
              />
              <Text
                style={[
                  styles.roleOptionText,
                  role === 'public' && styles.roleOptionTextActive,
                ]}
              >
                Masyarakat Umum
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleOption,
                role === 'officer' && styles.roleOptionActive,
              ]}
              onPress={() => setRole('officer')}
              disabled={isLoading}
            >
              <Ionicons
                name="card"
                size={18}
                color={role === 'officer' ? '#fff' : '#757575'}
              />
              <Text
                style={[
                  styles.roleOptionText,
                  role === 'officer' && styles.roleOptionTextActive,
                ]}
              >
                Petugas Parkir
              </Text>
            </TouchableOpacity>
          </View>

          {/* Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nama Lengkap</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#9e9e9e" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan nama lengkap Anda"
                value={nama}
                onChangeText={setNama}
                disabled={isLoading}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Alamat Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#9e9e9e" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="contoh: budi@gmail.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                disabled={isLoading}
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
                placeholder="Masukkan password baru"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                disabled={isLoading}
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

          {/* Conditional Officer Fields */}
          {role === 'officer' && (
            <Animated.View style={styles.officerFields}>
              {/* NIP Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>NIP / ID Petugas (Wajib)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="barcode-outline" size={20} color="#9e9e9e" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: 19950112345"
                    value={nip}
                    onChangeText={setNip}
                    keyboardType="numeric"
                    disabled={isLoading}
                  />
                </View>
              </View>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nomor HP Aktif (Wajib)</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#9e9e9e" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: 08123456789"
                    value={nomorHp}
                    onChangeText={setNomorHp}
                    keyboardType="phone-pad"
                    disabled={isLoading}
                  />
                </View>
              </View>
            </Animated.View>
          )}

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#1a237e', '#3949ab']}
              style={styles.registerButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={22} color="#fff" />
                  <Text style={styles.registerButtonText}>Daftar Sekarang</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Go back to Login Link */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.replace('/(auth)/login')}
            disabled={isLoading}
          >
            <Text style={styles.loginLinkText}>
              Sudah punya akun? <Text style={{ color: '#1a237e', fontWeight: 'bold' }}>Masuk di sini</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { paddingBottom: 32 },

  header: {
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 10 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 4 },

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

  rolePickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  roleOptionActive: {
    backgroundColor: '#1a237e',
    elevation: 1,
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
  },
  roleOptionTextActive: {
    color: '#fff',
  },

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

  officerFields: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },

  registerButton: { borderRadius: 12, overflow: 'hidden', marginTop: 16, elevation: 2 },
  registerButtonDisabled: { opacity: 0.6 },
  registerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    gap: 8,
  },
  registerButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  loginLink: { marginTop: 20, alignItems: 'center', padding: 8 },
  loginLinkText: { fontSize: 13, color: '#757575' },
});
