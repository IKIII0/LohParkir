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
          
          {/* Premium Role Cards Selector */}
          <Text style={styles.inputLabel}>Daftar Sebagai:</Text>
          <View style={styles.roleCardsContainer}>
            {/* Option 1: Public */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                role === 'public' && styles.roleCardActivePublic,
              ]}
              onPress={() => setRole('public')}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={[
                styles.roleCardIconBg,
                role === 'public' && styles.roleCardIconBgActivePublic
              ]}>
                <Ionicons
                  name="people"
                  size={22}
                  color={role === 'public' ? '#1a237e' : '#757575'}
                />
              </View>
              <View style={styles.roleCardContent}>
                <Text style={[
                  styles.roleCardTitle,
                  role === 'public' && styles.roleCardTitleActivePublic
                ]}>
                  Masyarakat Umum
                </Text>
                <Text style={styles.roleCardDesc}>
                  Untuk verifikasi keaslian juru parkir & melaporkan parkir liar
                </Text>
              </View>
              {role === 'public' && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-circle" size={22} color="#1a237e" />
                </View>
              )}
            </TouchableOpacity>

            {/* Option 2: Officer */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                role === 'officer' && styles.roleCardActiveOfficer,
              ]}
              onPress={() => setRole('officer')}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <View style={[
                styles.roleCardIconBg,
                role === 'officer' && styles.roleCardIconBgActiveOfficer
              ]}>
                <Ionicons
                  name="card"
                  size={22}
                  color={role === 'officer' ? '#e65100' : '#757575'}
                />
              </View>
              <View style={styles.roleCardContent}>
                <Text style={[
                  styles.roleCardTitle,
                  role === 'officer' && styles.roleCardTitleActiveOfficer
                ]}>
                  Petugas Parkir (Jukir)
                </Text>
                <Text style={styles.roleCardDesc}>
                  Untuk catat pembayaran tunai & kirim alarm darurat lapangan
                </Text>
              </View>
              {role === 'officer' && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark-circle" size={22} color="#e65100" />
                </View>
              )}
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
                editable={!isLoading}
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
                editable={!isLoading}
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
                editable={!isLoading}
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
            <View style={styles.officerFields}>
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
                    editable={!isLoading}
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
                    editable={!isLoading}
                  />
                </View>
              </View>
            </View>
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

  // Premium Role Selection styles
  roleCardsContainer: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
    marginTop: 8,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  roleCardActivePublic: {
    borderColor: '#1a237e',
    backgroundColor: '#f5f6ff',
  },
  roleCardActiveOfficer: {
    borderColor: '#e65100',
    backgroundColor: '#fffcf9',
  },
  roleCardIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardIconBgActivePublic: {
    backgroundColor: '#e8eaf6',
  },
  roleCardIconBgActiveOfficer: {
    backgroundColor: '#ffe0b2',
  },
  roleCardContent: {
    flex: 1,
  },
  roleCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
  },
  roleCardTitleActivePublic: {
    color: '#1a237e',
  },
  roleCardTitleActiveOfficer: {
    color: '#e65100',
  },
  roleCardDesc: {
    fontSize: 11,
    color: '#757575',
    marginTop: 2,
    lineHeight: 15,
  },
  checkBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
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
