import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { reportApi } from '../../src/services/api';

export default function ReportScreen() {
  const { fromScan, scanId } = useLocalSearchParams<{ fromScan?: string; scanId?: string }>();
  const [photo, setPhoto] = useState<string | null>(null);
  const [deskripsi, setDeskripsi] = useState('');
  const [gps, setGps] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNo, setTicketNo] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    getGPS();
  }, []);

  const getGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lokasi Diperlukan', 'LohParkir membutuhkan lokasi GPS untuk laporan. Aktifkan izin lokasi di pengaturan.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [address] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setGps({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        address: address ? `${address.street || ''} ${address.district || ''} ${address.city || ''}`.trim() : undefined,
      });
    } catch (err) {
      Alert.alert('Gagal Mendapatkan Lokasi', 'Pastikan GPS aktif dan coba lagi.');
    } finally {
      setGpsLoading(false);
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Foto Diperlukan', 'Berikan izin akses galeri foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Kamera Diperlukan', 'Berikan izin akses kamera.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!photo) {
      Alert.alert('Foto Wajib', 'Sertakan foto sebagai bukti laporan.');
      return;
    }
    if (!gps) {
      Alert.alert('Lokasi Belum Tersedia', 'Tunggu sebentar, GPS sedang diambil.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('foto', {
        uri: photo,
        type: 'image/jpeg',
        name: 'bukti.jpg',
      } as any);
      formData.append('gpsLat', String(gps.lat));
      formData.append('gpsLng', String(gps.lng));
      if (gps.address) formData.append('alamatLokasi', gps.address);
      if (deskripsi) formData.append('deskripsi', deskripsi);
      if (scanId) formData.append('relatedScanId', scanId);

      const res = await reportApi.submit(formData);
      setTicketNo(res.data.data.ticketNo);
      setSubmitted(true);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal mengirim laporan. Coba lagi.';
      Alert.alert('Gagal Mengirim Laporan', msg);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successContainer}>
        <LinearGradient colors={['#1b5e20', '#2e7d32', '#43a047']} style={styles.successGradient}>
          <Ionicons name="checkmark-circle" size={80} color="#ffffff" />
          <Text style={styles.successTitle}>Laporan Terkirim!</Text>
          <Text style={styles.successSubtitle}>Terima kasih telah membantu menjaga ketertiban parkir Kota Medan.</Text>

          <View style={styles.ticketBox}>
            <Text style={styles.ticketLabel}>Nomor Tiket Laporan</Text>
            <Text style={styles.ticketNo}>{ticketNo}</Text>
            <Text style={styles.ticketHint}>Simpan nomor ini untuk melacak status laporan Anda</Text>
          </View>

          <TouchableOpacity style={styles.successButton} onPress={() => {
            setSubmitted(false);
            setPhoto(null);
            setDeskripsi('');
            setTicketNo('');
          }}>
            <Text style={styles.successButtonText}>Buat Laporan Baru</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>

        {fromScan === 'true' && (
          <View style={styles.fromScanBanner}>
            <Ionicons name="warning" size={18} color="#c62828" />
            <Text style={styles.fromScanText}>Laporan ini terkait dengan QR Code tidak valid yang baru Anda scan.</Text>
          </View>
        )}

        {/* Foto Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto Bukti <Text style={styles.required}>*</Text></Text>
          {photo ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity style={styles.changePhotoButton} onPress={pickPhoto}>
                <Text style={styles.changePhotoText}>Ganti Foto</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                <Ionicons name="camera" size={28} color="#1a237e" />
                <Text style={styles.photoButtonText}>Ambil Foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
                <Ionicons name="images" size={28} color="#1a237e" />
                <Text style={styles.photoButtonText}>Dari Galeri</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* GPS Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lokasi</Text>
          {gpsLoading ? (
            <View style={styles.gpsLoading}>
              <ActivityIndicator color="#1a237e" size="small" />
              <Text style={styles.gpsLoadingText}>Mengambil lokasi GPS...</Text>
            </View>
          ) : gps ? (
            <View style={styles.gpsInfo}>
              <Ionicons name="location" size={16} color="#2e7d32" />
              <Text style={styles.gpsText}>{gps.address || `${gps.lat.toFixed(6)}, ${gps.lng.toFixed(6)}`}</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.getGpsButton} onPress={getGPS}>
              <Ionicons name="locate" size={16} color="#1a237e" />
              <Text style={styles.getGpsText}>Ambil Lokasi GPS</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Deskripsi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deskripsi <Text style={styles.optional}>(opsional)</Text></Text>
          <TextInput
            style={styles.textInput}
            placeholder="Contoh: Petugas tidak bisa menunjukkan badge resmi..."
            value={deskripsi}
            onChangeText={setDeskripsi}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{deskripsi.length}/500</Text>
        </View>

        {/* Notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="shield-checkmark" size={18} color="#1565c0" />
          <Text style={styles.noticeText}>
            Identitas Anda dilindungi enkripsi. Laporan tidak dapat diedit setelah dikirim. Maks. 5 laporan per hari.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (!photo || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!photo || loading}
        >
          <LinearGradient
            colors={photo ? ['#c62828', '#d32f2f'] : ['#9e9e9e', '#bdbdbd']}
            style={styles.submitGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#fff" />
                <Text style={styles.submitText}>Kirim Laporan</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, gap: 16 },

  fromScanBanner: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderLeftWidth: 4, borderLeftColor: '#c62828',
  },
  fromScanText: { flex: 1, fontSize: 13, color: '#c62828', lineHeight: 20 },

  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', marginBottom: 12 },
  required: { color: '#c62828' },
  optional: { fontWeight: '400', color: '#9e9e9e', fontSize: 13 },

  photoButtons: { flexDirection: 'row', gap: 12 },
  photoButton: {
    flex: 1, backgroundColor: '#e8eaf6', borderRadius: 12,
    padding: 20, alignItems: 'center', gap: 8,
    borderWidth: 2, borderColor: '#c5cae9', borderStyle: 'dashed',
  },
  photoButtonText: { fontSize: 13, color: '#1a237e', fontWeight: '600' },
  photoPreview: { gap: 10 },
  photo: { width: '100%', height: 200, borderRadius: 12 },
  changePhotoButton: { padding: 10, alignItems: 'center' },
  changePhotoText: { color: '#1a237e', fontWeight: '600', fontSize: 14 },

  gpsInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', borderRadius: 10, padding: 12 },
  gpsText: { flex: 1, fontSize: 13, color: '#2e7d32' },
  gpsLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  gpsLoadingText: { fontSize: 13, color: '#757575' },
  getGpsButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8eaf6', borderRadius: 10, padding: 12, justifyContent: 'center' },
  getGpsText: { fontSize: 13, color: '#1a237e', fontWeight: '600' },

  textInput: {
    borderWidth: 1.5, borderColor: '#e0e0e0',
    borderRadius: 12, padding: 14,
    fontSize: 14, color: '#1a1a1a',
    minHeight: 100, backgroundColor: '#fafafa',
  },
  charCount: { fontSize: 12, color: '#9e9e9e', textAlign: 'right', marginTop: 4 },

  noticeBox: {
    backgroundColor: '#e3f2fd', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
  },
  noticeText: { flex: 1, fontSize: 13, color: '#1565c0', lineHeight: 20 },

  submitButton: { borderRadius: 16, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, gap: 10 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  successContainer: { flex: 1 },
  successGradient: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 20 },
  successTitle: { fontSize: 28, fontWeight: '800', color: '#ffffff' },
  successSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22 },
  ticketBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 20,
    alignItems: 'center', gap: 8, width: '100%',
  },
  ticketLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  ticketNo: { fontSize: 24, fontWeight: '800', color: '#ffffff', letterSpacing: 1 },
  ticketHint: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  successButton: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  successButtonText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
});
