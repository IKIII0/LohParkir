import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { transactionApi } from "../src/services/api";
import { generateIdempotencyKey, formatRupiah } from "../src/utils/helpers";

const NOMINALS = [2000, 3000, 5000, 7000, 10000];

// Static dummy QRIS URLs
const QRIS_MOTOR_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=LOHPARKIR_QRIS_MOTOR_DUMMY';
const QRIS_MOBIL_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=LOHPARKIR_QRIS_MOBIL_DUMMY';
const NOMINAL_THRESHOLD = 3000; // <= 3000 = Motor, > 3000 = Mobil

type PaymentStep = "select" | "qris_show" | "success";

export default function PaymentScreen() {
  const { officerId, namaPetugas, badgeNumber, zonaId } = useLocalSearchParams<{
    officerId: string;
    namaPetugas: string;
    badgeNumber: string;
    zonaId?: string;
  }>();

  const [selectedNominal, setSelectedNominal] = useState<number | null>(null);
  const [customNominal, setCustomNominal] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<PaymentStep>("select");
  const [successMethod, setSuccessMethod] = useState<"qris" | "tunai">("tunai");
  const [vehicleType, setVehicleType] = useState<"motor" | "mobil">("motor");

  const effectiveNominal = useCustom
    ? parseInt(customNominal.replace(/\D/g, ""), 10) || 0
    : (selectedNominal ?? 0);

  const isNominalValid = effectiveNominal >= 1000;

  const handleSelectPreset = (n: number) => {
    setSelectedNominal(n);
    setUseCustom(false);
    setCustomNominal("");
  };

  const handleCustomInput = (text: string) => {
    const digits = text.replace(/\D/g, "");
    setCustomNominal(digits);
    setUseCustom(true);
    setSelectedNominal(null);
  };

  // ── QRIS (Statis / Dummy) ─────────────────────────────────────────────────
  const handleCreateQris = () => {
    if (!isNominalValid) {
      Alert.alert("Nominal Tidak Valid", "Masukkan nominal minimal Rp 1.000");
      return;
    }
    // Determine vehicle type based on nominal threshold
    setVehicleType(effectiveNominal <= NOMINAL_THRESHOLD ? "motor" : "mobil");
    setStep("qris_show");
  };

  const handleQrisConfirmPaid = () => {
    setSuccessMethod("qris");
    setStep("success");
  };

  // ── Tunai ─────────────────────────────────────────────────────────────────
  const handleCashPayment = () => {
    if (!isNominalValid) {
      Alert.alert("Nominal Tidak Valid", "Masukkan nominal minimal Rp 1.000");
      return;
    }
    Alert.alert(
      "Konfirmasi Pembayaran Tunai",
      `Bayar ${formatRupiah(effectiveNominal)} secara tunai kepada petugas ${namaPetugas}?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Konfirmasi",
          onPress: async () => {
            setLoading(true);
            try {
              await transactionApi.create({
                officerId,
                zonaId,
                nominal: effectiveNominal,
                metode: "tunai",
                idempotencyKey: generateIdempotencyKey("cash"),
              });
              setSuccessMethod("tunai");
              setStep("success");
            } catch (err: any) {
              Alert.alert(
                "Gagal",
                err.response?.data?.message ||
                  "Gagal mencatat pembayaran tunai.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <View style={styles.successContainer}>
        <LinearGradient
          colors={["#1b5e20", "#2e7d32", "#43a047"]}
          style={styles.successGradient}
        >
          <Ionicons name="checkmark-circle" size={80} color="#ffffff" />
          <Text style={styles.successTitle}>Pembayaran Berhasil!</Text>
          <Text style={styles.successSub}>
            Terima kasih telah membayar parkir resmi Kota Medan.
          </Text>

          <View style={styles.successDetail}>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Metode</Text>
              <Text style={styles.successValue}>
                {successMethod === "qris" ? "QRIS Digital" : "Tunai"}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Nominal</Text>
              <Text style={[styles.successValue, styles.successAmount]}>
                {formatRupiah(effectiveNominal)}
              </Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Petugas</Text>
              <Text style={styles.successValue}>{namaPetugas}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.doneBtnText}>Selesai</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // ── QRIS QR display screen ────────────────────────────────────────────────
  if (step === "qris_show") {
    const isMotor = vehicleType === "motor";
    const qrisUrl = isMotor ? QRIS_MOTOR_URL : QRIS_MOBIL_URL;
    const vehicleLabel = isMotor ? "MOTOR" : "MOBIL";
    const vehicleBadgeColors: [string, string] = isMotor
      ? ["#e65100", "#ef6c00"]
      : ["#1a237e", "#283593"];

    return (
      <View style={styles.qrisScreen}>
        <ScrollView contentContainerStyle={styles.qrisContent}>
          <View style={styles.qrisCard}>
            <LinearGradient
              colors={["#1a237e", "#3949ab"]}
              style={styles.qrisCardHeader}
            >
              <Text style={styles.qrisCardTitle}>Scan QRIS untuk Membayar</Text>
              <Text style={styles.qrisCardSub}>
                Gunakan aplikasi bank atau e-wallet Anda
              </Text>
            </LinearGradient>

            <View style={styles.qrisBody}>
              {/* Vehicle Type Badge */}
              <LinearGradient
                colors={vehicleBadgeColors}
                style={styles.vehicleTypeBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons
                  name={isMotor ? "bicycle" : "car-sport"}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.vehicleTypeBadgeText}>
                  QRIS STATIS — {vehicleLabel}
                </Text>
              </LinearGradient>

              {/* Static QRIS Image */}
              <Image
                source={{ uri: qrisUrl }}
                style={styles.qrImage}
                resizeMode="contain"
                accessibilityLabel={`Kode QRIS pembayaran parkir ${vehicleLabel}`}
              />

              <Text style={styles.qrisAmount}>
                {formatRupiah(effectiveNominal)}
              </Text>
              <Text style={styles.qrisOfficer}>
                Petugas: {namaPetugas} · {badgeNumber}
              </Text>

              <View style={styles.qrisInfoRow}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#5c6bc0"
                />
                <Text style={styles.qrisInfoText}>
                  Scan kode QR ini dengan aplikasi bank atau e-wallet Anda, lalu
                  tekan tombol konfirmasi setelah pembayaran selesai.
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.confirmPaidBtn}
            onPress={handleQrisConfirmPaid}
          >
            <LinearGradient
              colors={["#1b5e20", "#2e7d32"]}
              style={styles.confirmPaidGradient}
            >
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.confirmPaidText}>
                Konfirmasi Pembayaran Selesai
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelQrisBtn}
            onPress={() => setStep("select")}
          >
            <Text style={styles.cancelQrisBtnText}>Batalkan & Kembali</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Main selection screen ─────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Officer Card */}
        <View style={styles.officerCard}>
          <View style={styles.officerIconWrap}>
            <Ionicons name="person" size={28} color="#1a237e" />
          </View>
          <View style={styles.officerMeta}>
            <Text style={styles.officerName}>{namaPetugas}</Text>
            <Text style={styles.officerBadge}>Badge: {badgeNumber}</Text>
            {zonaId ? (
              <Text style={styles.officerZona}>Zona: {zonaId}</Text>
            ) : null}
          </View>
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#2e7d32" />
            <Text style={styles.verifiedText}>Resmi</Text>
          </View>
        </View>

        {/* Nominal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pilih Nominal Parkir</Text>
          <View style={styles.nominalGrid}>
            {NOMINALS.map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => handleSelectPreset(n)}
                style={[
                  styles.nominalBtn,
                  !useCustom &&
                    selectedNominal === n &&
                    styles.nominalBtnSelected,
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.nominalText,
                    !useCustom &&
                      selectedNominal === n &&
                      styles.nominalTextSelected,
                  ]}
                >
                  {formatRupiah(n)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customNominalWrap}>
            <Text style={styles.customNominalLabel}>
              Atau masukkan nominal lain:
            </Text>
            <View
              style={[
                styles.customNominalInputRow,
                useCustom && styles.customNominalInputRowActive,
              ]}
            >
              <Text style={styles.rpPrefix}>Rp</Text>
              <TextInput
                style={styles.customNominalInput}
                placeholder="Contoh: 4000"
                placeholderTextColor="#bdbdbd"
                keyboardType="numeric"
                value={customNominal}
                onChangeText={handleCustomInput}
                maxLength={8}
              />
            </View>
            {useCustom && effectiveNominal > 0 && (
              <Text style={styles.customNominalPreview}>
                Nominal: {formatRupiah(effectiveNominal)}
              </Text>
            )}
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>

          {/* QRIS */}
          <TouchableOpacity
            style={[
              styles.payMethodBtn,
              !isNominalValid && styles.payMethodBtnDisabled,
            ]}
            onPress={handleCreateQris}
            disabled={!isNominalValid || loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                isNominalValid ? ["#1a237e", "#3949ab"] : ["#9e9e9e", "#bdbdbd"]
              }
              style={styles.payMethodGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="qr-code" size={24} color="#fff" />
                  <View style={styles.payMethodMeta}>
                    <Text style={styles.payMethodText}>Bayar via QRIS</Text>
                    <Text style={styles.payMethodSub}>
                      Semua bank & e-wallet
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="rgba(255,255,255,0.7)"
                  />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Tunai */}
          <TouchableOpacity
            style={[
              styles.cashBtn,
              !isNominalValid && styles.payMethodBtnDisabled,
            ]}
            onPress={handleCashPayment}
            disabled={!isNominalValid || loading}
            activeOpacity={0.85}
          >
            <View style={[styles.cashIcon, { backgroundColor: "#e8f5e9" }]}>
              <Ionicons name="cash" size={22} color="#2e7d32" />
            </View>
            <View style={styles.payMethodMeta}>
              <Text style={styles.cashBtnText}>Bayar Tunai</Text>
              <Text style={styles.cashBtnSub}>
                Catat pembayaran tunai ke petugas
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9e9e9e" />
          </TouchableOpacity>
        </View>

        {/* Info notice */}
        <View style={styles.noticeBox}>
          <Ionicons name="lock-closed-outline" size={16} color="#1565c0" />
          <Text style={styles.noticeText}>
            Transaksi dienkripsi & tercatat secara resmi. Nominal sesuai tarif
            zona yang berlaku.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const CORNER = 20;
const CORNER_T = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16, gap: 16, paddingBottom: 32 },

  officerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  officerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#e8eaf6",
    justifyContent: "center",
    alignItems: "center",
  },
  officerMeta: { flex: 1 },
  officerName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  officerBadge: { fontSize: 12, color: "#757575", marginTop: 2 },
  officerZona: { fontSize: 12, color: "#9e9e9e", marginTop: 2 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e8f5e9",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  verifiedText: { fontSize: 12, fontWeight: "700", color: "#2e7d32" },

  section: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },

  nominalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  nominalBtn: {
    flexBasis: "30%",
    flexGrow: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
  },
  nominalBtnSelected: { backgroundColor: "#e8eaf6", borderColor: "#1a237e" },
  nominalText: { fontSize: 14, fontWeight: "600", color: "#424242" },
  nominalTextSelected: { color: "#1a237e", fontWeight: "700" },

  customNominalWrap: { gap: 6, marginTop: 4 },
  customNominalLabel: { fontSize: 13, color: "#757575" },
  customNominalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fafafa",
  },
  customNominalInputRowActive: {
    borderColor: "#1a237e",
    backgroundColor: "#f5f6ff",
  },
  rpPrefix: {
    fontSize: 15,
    fontWeight: "700",
    color: "#424242",
    marginRight: 6,
  },
  customNominalInput: { flex: 1, fontSize: 15, color: "#1a1a1a" },
  customNominalPreview: {
    fontSize: 13,
    color: "#1a237e",
    fontWeight: "600",
    marginLeft: 2,
  },

  payMethodBtn: { borderRadius: 14, overflow: "hidden" },
  payMethodBtnDisabled: { opacity: 0.5 },
  payMethodGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  payMethodMeta: { flex: 1 },
  payMethodText: { fontSize: 15, fontWeight: "700", color: "#ffffff" },
  payMethodSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },

  cashBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#c8e6c9",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#f9fff9",
  },
  cashIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  cashBtnText: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  cashBtnSub: { fontSize: 12, color: "#757575", marginTop: 2 },

  noticeBox: {
    backgroundColor: "#e3f2fd",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  noticeText: { flex: 1, fontSize: 13, color: "#1565c0", lineHeight: 20 },

  // ── QRIS screen ──────────────────────────────────────────────────────────
  qrisScreen: { flex: 1, backgroundColor: "#f5f5f5" },
  qrisContent: { padding: 16, gap: 16, paddingBottom: 32 },
  qrisCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  qrisCardHeader: { padding: 20, alignItems: "center", gap: 6 },
  qrisCardTitle: { fontSize: 17, fontWeight: "700", color: "#ffffff" },
  qrisCardSub: { fontSize: 13, color: "rgba(255,255,255,0.85)" },
  qrisBody: { padding: 20, alignItems: "center", gap: 16 },

  qrImage: {
    width: 240,
    height: 240,
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  qrPlaceholder: {
    width: 240,
    height: 240,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6ff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#c5cae9",
    position: "relative",
  },
  qrCornerTL: {
    position: "absolute",
    top: 8,
    left: 8,
    width: CORNER,
    height: CORNER,
    borderTopWidth: CORNER_T,
    borderLeftWidth: CORNER_T,
    borderColor: "#1a237e",
    borderTopLeftRadius: 4,
  },
  qrCornerTR: {
    position: "absolute",
    top: 8,
    right: 8,
    width: CORNER,
    height: CORNER,
    borderTopWidth: CORNER_T,
    borderRightWidth: CORNER_T,
    borderColor: "#1a237e",
    borderTopRightRadius: 4,
  },
  qrCornerBL: {
    position: "absolute",
    bottom: 8,
    left: 8,
    width: CORNER,
    height: CORNER,
    borderBottomWidth: CORNER_T,
    borderLeftWidth: CORNER_T,
    borderColor: "#1a237e",
    borderBottomLeftRadius: 4,
  },
  qrCornerBR: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: CORNER,
    height: CORNER,
    borderBottomWidth: CORNER_T,
    borderRightWidth: CORNER_T,
    borderColor: "#1a237e",
    borderBottomRightRadius: 4,
  },

  qrisAmount: { fontSize: 26, fontWeight: "800", color: "#1a237e" },
  qrisOfficer: { fontSize: 13, color: "#757575" },
  qrisInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#e8eaf6",
    borderRadius: 10,
    padding: 12,
  },
  qrisInfoText: { flex: 1, fontSize: 13, color: "#3949ab", lineHeight: 20 },

  confirmPaidBtn: { borderRadius: 14, overflow: "hidden" },
  confirmPaidGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 10,
  },
  confirmPaidText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },

  cancelQrisBtn: { padding: 14, alignItems: "center" },
  cancelQrisBtnText: { fontSize: 14, color: "#9e9e9e", fontWeight: "600" },

  // Vehicle Type Badge
  vehicleTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  vehicleTypeBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },

  // ── Success screen ────────────────────────────────────────────────────────
  successContainer: { flex: 1 },
  successGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 20,
  },
  successTitle: { fontSize: 28, fontWeight: "800", color: "#ffffff" },
  successSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  successDetail: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  successLabel: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  successValue: { fontSize: 14, fontWeight: "600", color: "#ffffff" },
  successAmount: { fontSize: 18, fontWeight: "800" },
  doneBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    marginTop: 8,
  },
  doneBtnText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
});
