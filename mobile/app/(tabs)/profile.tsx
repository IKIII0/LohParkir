import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';

export default function ProfileScreen() {
  const { user, logout, loadUser, updateProfilePicture } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  // Generate QR Code URL using qrserver API (no extra library needed)
  const officerQrData = encodeURIComponent(`lohparkir://officer/${user?.officerId || user?.id}`);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${officerQrData}`;
  const qrCodeUrlLarge = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${officerQrData}`;

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUser();
    setRefreshing(false);
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

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Galeri Diperlukan', 'Mohon izinkan akses galeri untuk mengubah foto profil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Kamera Diperlukan', 'Mohon izinkan akses kamera untuk mengambil foto profil.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      await updateProfilePicture(uri);
      Alert.alert('Berhasil', 'Foto profil Anda berhasil diperbarui.');
    } catch (err: any) {
      Alert.alert('Gagal Mengunggah', err.response?.data?.message || 'Terjadi kesalahan saat mengunggah foto.');
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert(
      'Ubah Foto Profil',
      'Pilih sumber foto profil Anda:',
      [
        { text: 'Ambil Foto (Kamera)', onPress: takePhoto },
        { text: 'Pilih dari Galeri', onPress: pickPhoto },
        { text: 'Batal', style: 'cancel' }
      ]
    );
  };

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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'officer':
        return '#e65100';
      case 'admin':
        return '#1a237e';
      case 'superadmin':
        return '#7b1fa2';
      default:
        return '#2e7d32';
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a237e" />
      }
    >
      {/* Profile Header */}
      <LinearGradient
        colors={['#1a237e', '#283593']}
        style={styles.profileHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.avatarCircle, { borderColor: getRoleColor(user?.role || '') }]}>
          {user?.foto_url ? (
            <Image
              source={{ uri: `https://lohparkir-production.up.railway.app${user.foto_url}` }}
              style={styles.avatarImage}
            />
          ) : (
            <Ionicons name="person" size={50} color="#1a237e" />
          )}
          <TouchableOpacity
            style={[styles.editAvatarBadge, { backgroundColor: getRoleColor(user?.role || '') }]}
            onPress={handleChangeAvatar}
            activeOpacity={0.8}
          >
            <Ionicons name="camera" size={15} color="#fff" />
          </TouchableOpacity>
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

        {/* QR Badge Resmi - Only for Officers */}
        {user?.role === 'officer' && (
          <View style={styles.qrBadgeCard}>
            <LinearGradient
              colors={['#e65100', '#ef6c00']}
              style={styles.qrBadgeHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="qr-code" size={20} color="#fff" />
              <Text style={styles.qrBadgeHeaderTitle}>QR Badge Resmi</Text>
            </LinearGradient>

            <View style={styles.qrBadgeBody}>
              <View style={styles.qrImageContainer}>
                <Image
                  source={{ uri: qrCodeUrl }}
                  style={styles.qrBadgeImage}
                  resizeMode="contain"
                  accessibilityLabel="QR Badge Petugas Parkir Resmi"
                />
                <View style={styles.qrCornerTL} />
                <View style={styles.qrCornerTR} />
                <View style={styles.qrCornerBL} />
                <View style={styles.qrCornerBR} />
              </View>

              <Text style={styles.qrBadgeName}>{user?.nama}</Text>
              <Text style={styles.qrBadgeId}>ID: {user?.officerId || user?.id}</Text>

              <View style={styles.qrBadgeInfoRow}>
                <Ionicons name="information-circle-outline" size={14} color="#e65100" />
                <Text style={styles.qrBadgeInfoText}>
                  Tunjukkan QR ini kepada pengendara agar mereka dapat memverifikasi identitas Anda sebagai petugas resmi.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.enlargeQrButton}
                onPress={() => setQrModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="expand-outline" size={18} color="#e65100" />
                <Text style={styles.enlargeQrButtonText}>Perbesar QR</Text>
              </TouchableOpacity>
            </View>
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

      {/* QR Fullscreen Modal */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#e65100', '#ef6c00']}
              style={styles.modalHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="qr-code" size={22} color="#fff" />
              <Text style={styles.modalHeaderTitle}>QR Badge Petugas</Text>
            </LinearGradient>

            <View style={styles.modalBody}>
              <View style={styles.modalQrContainer}>
                <Image
                  source={{ uri: qrCodeUrlLarge }}
                  style={styles.modalQrImage}
                  resizeMode="contain"
                  accessibilityLabel="QR Badge Petugas Parkir Resmi - Diperbesar"
                />
              </View>
              <Text style={styles.modalOfficerName}>{user?.nama}</Text>
              <Text style={styles.modalOfficerId}>ID Petugas: {user?.officerId || user?.id}</Text>
              <Text style={styles.modalInstruction}>
                Arahkan kamera pengendara ke QR Code ini untuk memverifikasi identitas Anda.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setQrModalVisible(false)}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.modalCloseText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { paddingBottom: 32 },

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
    position: 'relative',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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

  // QR Badge Card Styles
  qrBadgeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#e65100',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  qrBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  qrBadgeHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  qrBadgeBody: {
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  qrImageContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffe0b2',
    position: 'relative',
    padding: 12,
  },
  qrBadgeImage: {
    width: 170,
    height: 170,
  },
  qrCornerTL: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 18,
    height: 18,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#e65100',
    borderTopLeftRadius: 4,
  },
  qrCornerTR: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#e65100',
    borderTopRightRadius: 4,
  },
  qrCornerBL: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 18,
    height: 18,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#e65100',
    borderBottomLeftRadius: 4,
  },
  qrCornerBR: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 18,
    height: 18,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#e65100',
    borderBottomRightRadius: 4,
  },
  qrBadgeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 4,
  },
  qrBadgeId: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  qrBadgeInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  qrBadgeInfoText: {
    flex: 1,
    fontSize: 11,
    color: '#e65100',
    lineHeight: 16,
  },
  enlargeQrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#e65100',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  enlargeQrButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e65100',
  },

  // QR Fullscreen Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  modalBody: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  modalQrContainer: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffe0b2',
    padding: 10,
  },
  modalQrImage: {
    width: 240,
    height: 240,
  },
  modalOfficerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    marginTop: 8,
  },
  modalOfficerId: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  modalInstruction: {
    fontSize: 12,
    color: '#9e9e9e',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  modalCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e65100',
    paddingVertical: 14,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  versionText: { textAlign: 'center', fontSize: 11, color: '#9e9e9e', marginTop: 10 },
});
