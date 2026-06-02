import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { transactionApi } from '../../src/services/api';
import { useAuthStore } from '../../src/store/authStore';

interface Transaction {
  id: string;
  metode: 'qris' | 'tunai';
  nominal: number;
  status: 'pending' | 'berhasil' | 'gagal' | 'refunded';
  created_at: string;
  officer_nama: string;
  badge_number: string;
  zona_nama: string;
}

const STATUS_CONFIG = {
  berhasil: { label: 'Berhasil', color: '#2e7d32', bg: '#e8f5e9', icon: 'checkmark-circle' },
  pending: { label: 'Menunggu', color: '#e65100', bg: '#fff3e0', icon: 'time' },
  gagal: { label: 'Gagal', color: '#c62828', bg: '#ffebee', icon: 'close-circle' },
  refunded: { label: 'Dikembalikan', color: '#4527a0', bg: '#ede7f6', icon: 'refresh-circle' },
};

const METODE_CONFIG = {
  qris: { label: 'QRIS Digital', icon: 'qr-code', color: '#1a237e' },
  tunai: { label: 'Tunai', icon: 'cash', color: '#2e7d32' },
};

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (isLoggedIn) loadTransactions(1, true);
    else setLoading(false);
  }, [isLoggedIn]);

  const loadTransactions = async (pageNum: number, reset = false) => {
    try {
      const res = await transactionApi.myHistory(pageNum);
      const data = res.data.data;
      if (reset) {
        setTransactions(data);
      } else {
        setTransactions(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.log('Failed to load transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions(1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) loadTransactions(page + 1);
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="lock-closed-outline" size={64} color="#bdbdbd" />
        <Text style={styles.emptyTitle}>Login Diperlukan</Text>
        <Text style={styles.emptyText}>Masuk ke akun Anda untuk melihat riwayat pembayaran parkir.</Text>
      </View>
    );
  }

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a237e" />
        <Text style={styles.loadingText}>Memuat riwayat...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, transactions.length === 0 && styles.emptyList]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a237e" />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={<EmptyState />}
      ListFooterComponent={hasMore ? <ActivityIndicator style={styles.loadMore} color="#1a237e" /> : null}
      renderItem={({ item }) => <TransactionCard item={item} />}
    />
  );
}

function TransactionCard({ item }: { item: Transaction }) {
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.gagal;
  const metode = METODE_CONFIG[item.metode] || METODE_CONFIG.tunai;
  const date = new Date(item.created_at);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.metodeIcon, { backgroundColor: metode.color + '15' }]}>
          <Ionicons name={metode.icon as any} size={20} color={metode.color} />
        </View>
        <View style={styles.cardTitle}>
          <Text style={styles.officerName}>{item.officer_nama || 'Petugas'}</Text>
          <Text style={styles.zoneName}>{item.zona_nama || item.badge_number || '-'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon as any} size={12} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Nominal</Text>
          <Text style={styles.detailAmount}>Rp {item.nominal.toLocaleString('id')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Metode</Text>
          <Text style={styles.detailValue}>{metode.label}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tanggal</Text>
          <Text style={styles.detailValue}>
            {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' '}
            {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#bdbdbd" />
      <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
      <Text style={styles.emptyText}>Pembayaran parkir digital Anda akan muncul di sini.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  emptyList: { flex: 1, justifyContent: 'center' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: '#757575' },
  loadMore: { marginVertical: 16 },

  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  metodeIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { flex: 1 },
  officerName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  zoneName: { fontSize: 12, color: '#757575', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10, gap: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },

  cardDetails: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, gap: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: '#9e9e9e' },
  detailAmount: { fontSize: 18, fontWeight: '800', color: '#1a237e' },
  detailValue: { fontSize: 13, fontWeight: '500', color: '#424242' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#424242' },
  emptyText: { fontSize: 14, color: '#9e9e9e', textAlign: 'center', lineHeight: 22 },
});
