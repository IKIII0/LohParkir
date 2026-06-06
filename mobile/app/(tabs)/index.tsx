import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Location from "expo-location";
import { dashboardApi, transactionApi, emergencyApi } from "../../src/services/api";
import { useAuthStore } from "../../src/store/authStore";

interface PublicStats {
  totalScan: number;
  totalLokasiResmi: number;
  totalLaporan: number;
  totalPetugasAktif: number;
}

export default function HomeScreen() {
  const { user, isLoggedIn } = useAuthStore();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Officer States
  const [nominal, setNominal] = useState("");
  const [recordingCash, setRecordingCash] = useState(false);
  const [sendingEmergency, setSendingEmergency] = useState(false);

  // Persistent Animated Value fixing screen disappearing bug
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStats();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadStats = async () => {
    try {
      const res = await dashboardApi.publicStats();
      setStats(res.data.data);
    } catch (err) {
      console.log("Stats load failed:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handlePanic = async () => {
    Alert.alert(
      "Peringatan Darurat",
      "Apakah Anda yakin ingin mengirim sinyal darurat? Semua Admin Dishub akan menerima lokasi GPS Anda secara real-time.",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "YA, KIRIM ALARM",
          style: "destructive",
          onPress: async () => {
            setSendingEmergency(true);
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== "granted") {
                Alert.alert(
                  "Izin Lokasi Diperlukan",
                  "Aplikasi membutuhkan izin lokasi GPS untuk mengirimkan alarm darurat."
                );
                return;
              }
              const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });
              await emergencyApi.panic(loc.coords.latitude, loc.coords.longitude);
              Alert.alert(
                "Alarm Terkirim",
                "Sinyal darurat telah dikirim ke semua Admin Dishub Medan beserta koordinat GPS Anda."
              );
            } catch (err: any) {
              Alert.alert(
                "Gagal Mengirim Alarm",
                err.response?.data?.message || "Koneksi ke server gagal. Coba lagi."
              );
            } finally {
              setSendingEmergency(false);
            }
          },
        },
      ]
    );
  };

  const handleRecordCash = async (customNominal?: number) => {
    const valueToRecord = customNominal || parseInt(nominal);
    if (!valueToRecord || isNaN(valueToRecord) || valueToRecord <= 0) {
      Alert.alert("Nominal Tidak Valid", "Masukkan nominal uang pembayaran.");
      return;
    }

    const officerId = user?.officerId;
    if (!officerId) {
      Alert.alert(
        "Petugas Tidak Valid",
        "Gagal mendapatkan ID Petugas Anda. Silakan keluar dan login kembali."
      );
      return;
    }

    setRecordingCash(true);
    try {
      await transactionApi.create({
        officerId,
        nominal: valueToRecord,
        metode: "tunai",
      });
      Alert.alert(
        "Berhasil Dicatat",
        `Pembayaran tunai sebesar Rp ${valueToRecord.toLocaleString("id")} berhasil direkam.`
      );
      setNominal("");
    } catch (err: any) {
      Alert.alert(
        "Gagal Mencatat",
        err.response?.data?.message || "Terjadi kesalahan saat mencatat pembayaran tunai."
      );
    } finally {
      setRecordingCash(false);
    }
  };

  // ─── VIEW 1: DASHBOARD PETUGAS ─────────────────────────────────────────────
  if (isLoggedIn && user?.role === "officer") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a237e" />
          }
        >
          {/* Officer Hero */}
          <LinearGradient
            colors={["#e65100", "#ef6c00", "#f57c00"]}
            style={styles.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroLogo}>
                <Ionicons name="card" size={40} color="#ffeb3b" />
              </View>
              <Text style={styles.heroTitle}>LohParkir Petugas</Text>
              <Text style={styles.heroSubtitle}>
                Halo, {user.nama}!{"\n"}Petugas Resmi Dinas Perhubungan Medan
              </Text>
            </View>
          </LinearGradient>

          {/* Emergency Panic Section */}
          <View style={styles.officerSection}>
            <Text style={styles.sectionTitle}>Tombol Panik Darurat (Panic Button)</Text>
            <Text style={styles.sectionSubtitle}>
              Tekan jika terjadi tindak kriminal, pemerasan, atau kondisi darurat di lapangan.
            </Text>

            <TouchableOpacity
              style={styles.panicButton}
              onPress={handlePanic}
              disabled={sendingEmergency}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#d50000", "#c62828"]}
                style={styles.panicButtonCircle}
              >
                {sendingEmergency ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="alert-circle" size={48} color="#fff" />
                    <Text style={styles.panicButtonText}>DARURAT</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Cash Logging Section */}
          <View style={styles.officerSection}>
            <Text style={styles.sectionTitle}>Catat Pembayaran Tunai</Text>
            <Text style={styles.sectionSubtitle}>
              Catat setiap pembayaran parkir tunai yang diterima dari pengendara.
            </Text>

            {/* Quick nominal buttons */}
            <View style={styles.quickNominals}>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => handleRecordCash(2000)}
                disabled={recordingCash}
              >
                <Text style={styles.quickButtonText}>Rp 2.000</Text>
                <Text style={styles.quickButtonSub}>Motor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickButton}
                onPress={() => handleRecordCash(5000)}
                disabled={recordingCash}
              >
                <Text style={styles.quickButtonText}>Rp 5.000</Text>
                <Text style={styles.quickButtonSub}>Mobil</Text>
              </TouchableOpacity>
            </View>

            {/* Custom nominal input */}
            <View style={styles.customNominalContainer}>
              <Text style={styles.customNominalLabel}>Nominal Lainnya (Rp)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.cashInput}
                  placeholder="Contoh: 10000"
                  keyboardType="numeric"
                  value={nominal}
                  onChangeText={setNominal}
                  disabled={recordingCash}
                />
                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={() => handleRecordCash()}
                  disabled={recordingCash}
                >
                  {recordingCash ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── VIEW 2: DASHBOARD ADMIN ───────────────────────────────────────────────
  if (isLoggedIn && (user?.role === "admin" || user?.role === "superadmin")) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a237e" />
        }
      >
        <LinearGradient
          colors={["#1a237e", "#283593"]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroLogo}>
              <Ionicons name="shield" size={40} color="#ffeb3b" />
            </View>
            <Text style={styles.heroTitle}>LohParkir Admin</Text>
            <Text style={styles.heroSubtitle}>
              Selamat datang, {user.nama}!{"\n"}Administrator Sistem
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.adminMessageCard}>
          <Ionicons name="desktop-outline" size={50} color="#1a237e" />
          <Text style={styles.adminMessageTitle}>Gunakan Admin Web Dashboard</Text>
          <Text style={styles.adminMessageText}>
            Manajemen lengkap akun petugas, generate QR badge, analisis heatmap, verifikasi laporan
            parkir ilegal, serta audit trail dilakukan secara penuh melalui portal web admin.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // ─── VIEW 3: DASHBOARD PUBLIK (DEFAULT) ────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a237e" />
      }
    >
      {/* Hero Banner */}
      <LinearGradient
        colors={["#1a237e", "#283593", "#3949ab"]}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <View style={styles.heroLogo}>
            <Ionicons name="shield-checkmark" size={40} color="#ffeb3b" />
          </View>
          <Text style={styles.heroTitle}>LohParkir</Text>
          <Text style={styles.heroSubtitle}>
            Sistem Validasi Parkir Resmi{"\n"}Dinas Perhubungan Kota Medan
          </Text>
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <Animated.View style={[styles.actionSection, { opacity: fadeAnim }]}>
        <Text style={styles.sectionTitle}>Apa yang ingin Anda lakukan?</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/(tabs)/scan")}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#1a237e", "#3949ab"]}
            style={styles.primaryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="qr-code" size={28} color="#fff" />
            <View style={styles.buttonTextContainer}>
              <Text style={styles.primaryButtonText}>Scan QR Petugas</Text>
              <Text style={styles.primaryButtonSubtext}>Verifikasi keaslian petugas parkir</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/(tabs)/report")}
          activeOpacity={0.85}
        >
          <View style={styles.secondaryButtonInner}>
            <View style={[styles.buttonIcon, { backgroundColor: "#fff3e0" }]}>
              <Ionicons name="warning" size={24} color="#e65100" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.secondaryButtonText}>Laporkan Parkir Ilegal</Text>
              <Text style={styles.secondaryButtonSubtext}>
                Bantu jaga ketertiban parkir Kota Medan
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9e9e9e" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/(tabs)/history")}
          activeOpacity={0.85}
        >
          <View style={styles.secondaryButtonInner}>
            <View style={[styles.buttonIcon, { backgroundColor: "#e8f5e9" }]}>
              <Ionicons name="receipt" size={24} color="#2e7d32" />
            </View>
            <View style={styles.buttonTextContainer}>
              <Text style={styles.secondaryButtonText}>Riwayat Pembayaran</Text>
              <Text style={styles.secondaryButtonSubtext}>Lihat transaksi parkir Anda</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9e9e9e" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Stats Section */}
      {stats && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistik Parkir Resmi Medan</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="scan"
              label="Total Scan"
              value={stats.totalScan.toLocaleString("id")}
              color="#1a237e"
            />
            <StatCard
              icon="location"
              label="Lokasi Resmi"
              value={stats.totalLokasiResmi.toLocaleString("id")}
              color="#00695c"
            />
            <StatCard
              icon="people"
              label="Petugas Aktif"
              value={stats.totalPetugasAktif.toLocaleString("id")}
              color="#e65100"
            />
            <StatCard
              icon="document-text"
              label="Total Laporan"
              value={stats.totalLaporan.toLocaleString("id")}
              color="#7b1fa2"
            />
          </View>
        </View>
      )}

      {/* Warning Banner: Fake Officers */}
      <View style={styles.warningBanner}>
        <Ionicons name="warning" size={20} color="#e65100" />
        <View style={styles.warningContent}>
          <Text style={styles.warningTitle}>⚠️ Waspada Petugas Palsu!</Text>
          <Text style={styles.warningText}>
            Selalu minta petugas menunjukkan QR Badge resmi sebelum membayar. Petugas resmi Dishub
            Medan wajib memiliki badge digital terverifikasi. Jangan bayar kepada yang tidak bisa
            diverifikasi!
          </Text>
        </View>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#1565c0" />
        <Text style={styles.infoText}>
          LohParkir hanya mencakup parkir tepi jalan resmi yang dikelola Dinas Perhubungan Kota
          Medan.
        </Text>
      </View>
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { paddingBottom: 24 },

  hero: {
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: { alignItems: "center" },
  heroLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },

  actionSection: { padding: 20, gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },

  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#1a237e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  primaryButtonText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
  primaryButtonSubtext: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  secondaryButton: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  secondaryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  buttonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonTextContainer: { flex: 1 },
  secondaryButtonText: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  secondaryButtonSubtext: { fontSize: 12, color: "#757575", marginTop: 2 },

  statsSection: { paddingHorizontal: 20, paddingBottom: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "800", color: "#1a1a1a" },
  statLabel: { fontSize: 12, color: "#757575", textAlign: "center" },

  infoBanner: {
    margin: 20,
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  infoText: { flex: 1, fontSize: 13, color: "#1565c0", lineHeight: 20 },

  warningBanner: {
    marginHorizontal: 20,
    marginBottom: 4,
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#e65100",
  },
  warningContent: { flex: 1, gap: 4 },
  warningTitle: { fontSize: 14, fontWeight: "700", color: "#bf360c" },
  warningText: { fontSize: 13, color: "#e65100", lineHeight: 20 },

  // Officer-specific Styles
  officerSection: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    margin: 20,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#757575",
    marginTop: 2,
    marginBottom: 16,
    lineHeight: 18,
  },
  panicButton: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 12,
  },
  panicButtonCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#d50000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    gap: 6,
  },
  panicButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
  quickNominals: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  quickButton: {
    flex: 1,
    backgroundColor: "#fff3e0",
    borderWidth: 1.5,
    borderColor: "#ffe0b2",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    elevation: 1,
  },
  quickButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e65100",
  },
  quickButtonSub: {
    fontSize: 11,
    color: "#e65100",
    marginTop: 2,
  },
  customNominalContainer: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 16,
  },
  customNominalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    gap: 10,
  },
  cashInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: "#1a1a1a",
    backgroundColor: "#fafafa",
  },
  recordButton: {
    width: 54,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#e65100",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },

  // Admin-specific Styles
  adminMessageCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    margin: 20,
    padding: 30,
    alignItems: "center",
    textAlign: "center",
    gap: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  adminMessageTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a237e",
    textAlign: "center",
  },
  adminMessageText: {
    fontSize: 13,
    color: "#757575",
    lineHeight: 20,
    textAlign: "center",
  },
});
