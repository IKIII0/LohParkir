import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  Animated, ScrollView, Linking
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { qrApi } from '../../src/services/api';

interface OfficerData {
  officerId: string;
  namaPetugas: string;
  nip: string;
  badgeNumber: string;
  statusPetugas: string;
  zona: {
    nama: string;
    alamat: string;
    tarifMotor: number;
    tarifMobil: number;
  };
}

interface ScanResult {
  valid: boolean;
  hasil: 'valid' | 'invalid' | 'revoked' | 'network_error';
  pesan: string;
  data?: OfficerData;
  scanId?: string;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [lastScanned, setLastScanned] = useState<string>('');
  const resultAnim = useRef(new Animated.Value(0)).current;

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!scanning || loading || data === lastScanned) return;

    setLastScanned(data);
    setScanning(false);
    setLoading(true);

    try {
      // Ambil GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      let gpsLat, gpsLng;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        gpsLat = loc.coords.latitude;
        gpsLng = loc.coords.longitude;
      }

      const res = await qrApi.validate(data, gpsLat, gpsLng);
      const scanResult: ScanResult = res.data;
      setResult(scanResult);

      Animated.spring(resultAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();

    } catch (err: any) {
      const isNetwork = !err.response;
      setResult({
        valid: false,
        hasil: 'network_error',
        pesan: isNetwork
          ? 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.'
          : 'Terjadi kesalahan saat memvalidasi QR Code.',
      });
      Animated.spring(resultAnim, { toValue: 1, useNativeDriver: true }).start();
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setResult(null);
    setLastScanned('');
    resultAnim.setValue(0);
    setTimeout(() => setScanning(true), 500);
  };

  const handleReport = () => {
    router.push({
      pathname: '/(tabs)/report',
      params: { fromScan: 'true', scanId: result?.scanId },
    });
  };

  const handlePayment = () => {
    if (!result?.data) return;
    router.push({
      pathname: '/payment',
      params: {
        officerId: result.data.officerId,
        namaPetugas: result.data.namaPetugas,
        badgeNumber: result.data.badgeNumber,
        zonaId: result.data.zona?.nama,
      },
    });
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#1a237e" />
        <Text style={styles.permissionTitle}>Izin Kamera Diperlukan</Text>
        <Text style={styles.permissionText}>
          LohParkir membutuhkan akses kamera untuk memindai QR Code petugas parkir resmi.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Izinkan Akses Kamera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!result && (
        <>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
          >
            {/* Scanner Frame */}
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </View>
              <Text style={styles.scanHint}>
                {loading ? '⏳ Memvalidasi QR Code...' : 'Arahkan kamera ke QR Badge petugas'}
              </Text>
            </View>
          </CameraView>
        </>
      )}

      {/* Result Card */}
      {result && (
        <Animated.View
          style={[
            styles.resultContainer,
            {
              opacity: resultAnim,
              transform: [{ scale: resultAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
            },
          ]}
        >
          <ScrollView contentContainerStyle={styles.resultScroll}>
            {result.valid ? (
              /* Valid Officer Card */
              <View style={styles.validCard}>
                <LinearGradient colors={['#1b5e20', '#2e7d32']} style={styles.validHeader}>
                  <Ionicons name="shield-checkmark" size={40} color="#ffffff" />
                  <Text style={styles.validTitle}>Petugas Resmi Dishub</Text>
                  <Text style={styles.validSubtitle}>QR Code Valid & Terdaftar</Text>
                </LinearGradient>

                <View style={styles.officerInfo}>
                  <InfoRow icon="person" label="Nama Petugas" value={result.data!.namaPetugas} />
                  <InfoRow icon="card" label="Nomor Badge" value={result.data!.badgeNumber} />
                  <InfoRow icon="document" label="NIP" value={result.data!.nip} />
                  <InfoRow icon="checkmark-circle" label="Status" value="✅ Aktif Bertugas" />

                  <View style={styles.divider} />

                  <InfoRow icon="location" label="Zona Kerja" value={result.data!.zona.nama} />
                  <InfoRow icon="map" label="Alamat" value={result.data!.zona.alamat} />

                  <View style={styles.tarifRow}>
                    <View style={styles.tarifItem}>
                      <Ionicons name="bicycle" size={20} color="#1a237e" />
                      <Text style={styles.tarifLabel}>Motor</Text>
                      <Text style={styles.tarifValue}>Rp {result.data!.zona.tarifMotor.toLocaleString('id')}</Text>
                    </View>
                    <View style={styles.tarifItem}>
                      <Ionicons name="car" size={20} color="#1a237e" />
                      <Text style={styles.tarifLabel}>Mobil</Text>
                      <Text style={styles.tarifValue}>Rp {result.data!.zona.tarifMobil.toLocaleString('id')}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
                    <LinearGradient colors={['#1a237e', '#3949ab']} style={styles.payButtonGradient}>
                      <Ionicons name="card" size={20} color="#fff" />
                      <Text style={styles.payButtonText}>Bayar Digital (QRIS)</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.resetButton} onPress={resetScan}>
                    <Text style={styles.resetButtonText}>Scan Ulang</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Invalid QR Card */
              <View style={styles.invalidCard}>
                <View style={styles.invalidHeader}>
                  <Ionicons
                    name={result.hasil === 'network_error' ? 'wifi-outline' : 'warning'}
                    size={48}
                    color={result.hasil === 'network_error' ? '#ff6f00' : '#c62828'}
                  />
                  <Text style={styles.invalidTitle}>
                    {result.hasil === 'network_error' ? 'Gagal Terhubung' : 'QR Code Tidak Valid'}
                  </Text>
                  <Text style={styles.invalidMessage}>{result.pesan}</Text>
                </View>

                {result.hasil !== 'network_error' && (
                  <View style={styles.warningBox}>
                    <Ionicons name="information-circle" size={20} color="#e65100" />
                    <Text style={styles.warningText}>
                      Jangan bayar ke petugas yang tidak dapat menunjukkan QR Badge resmi!
                    </Text>
                  </View>
                )}

                <View style={styles.invalidActions}>
                  {result.hasil !== 'network_error' && (
                    <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
                      <Ionicons name="warning" size={18} color="#ffffff" />
                      <Text style={styles.reportButtonText}>Laporkan Parkir Ilegal</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.retryButton} onPress={resetScan}>
                    <Ionicons name="refresh" size={18} color="#1a237e" />
                    <Text style={styles.retryButtonText}>Coba Lagi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={16} color="#757575" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scanFrame: {
    width: 250, height: 250,
    position: 'relative',
  },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: '#ffeb3b', borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: '#ffeb3b', borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderColor: '#ffeb3b', borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderColor: '#ffeb3b', borderBottomRightRadius: 4 },
  scanHint: { marginTop: 24, color: '#ffffff', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },

  resultContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  resultScroll: { padding: 20 },

  validCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  validHeader: { padding: 24, alignItems: 'center', gap: 8 },
  validTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  validSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  officerInfo: { padding: 20, gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 13, color: '#757575', width: 110 },
  infoValue: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 4 },
  tarifRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  tarifItem: { flex: 1, backgroundColor: '#e8eaf6', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4 },
  tarifLabel: { fontSize: 12, color: '#5c6bc0' },
  tarifValue: { fontSize: 16, fontWeight: '700', color: '#1a237e' },
  actionButtons: { padding: 16, gap: 12 },
  payButton: { borderRadius: 14, overflow: 'hidden' },
  payButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
  payButtonText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  resetButton: { padding: 14, alignItems: 'center' },
  resetButtonText: { fontSize: 14, color: '#757575', fontWeight: '600' },

  invalidCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, gap: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  invalidHeader: { alignItems: 'center', gap: 12 },
  invalidTitle: { fontSize: 22, fontWeight: '800', color: '#c62828' },
  invalidMessage: { fontSize: 15, color: '#424242', textAlign: 'center', lineHeight: 22 },
  warningBox: { backgroundColor: '#fff3e0', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  warningText: { flex: 1, fontSize: 13, color: '#e65100', lineHeight: 20 },
  invalidActions: { gap: 12 },
  reportButton: { backgroundColor: '#c62828', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  reportButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  retryButton: { borderWidth: 1.5, borderColor: '#1a237e', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  retryButtonText: { fontSize: 14, fontWeight: '600', color: '#1a237e' },

  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16, backgroundColor: '#f5f5f5' },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
  permissionText: { fontSize: 15, color: '#616161', textAlign: 'center', lineHeight: 22 },
  permissionButton: { backgroundColor: '#1a237e', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  permissionButtonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
