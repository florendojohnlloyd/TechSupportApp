import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { getStatusColor, getStatusBg, getStatusLabel } from '../../utils/ticketUtils';
import { colors, spacing, radius, shadow } from '../../theme';

const ACCENT = colors.fse;

export default function FSEDashboard({ navigation }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { user, logout } = useAuth();
  const { getTicketsByFSE } = useTickets();

  const myTickets = getTicketsByFSE(user?.uid);
  const filtered = filterStatus === 'ALL' ? myTickets : myTickets.filter(t => t.status === filterStatus);

  const stats = {
    assigned: myTickets.filter(t => t.status === 'ASSIGNED_FSE').length,
    onsite: myTickets.filter(t => t.status === 'ONSITE').length,
    pending: myTickets.filter(t => t.status === 'SERVICE_PENDING').length,
    done: myTickets.filter(t => t.status === 'CLOSED').length,
  };

  const statusFilters = ['ALL', 'ASSIGNED_FSE', 'ONSITE', 'SERVICE_PENDING', 'CLOSED'];

  const renderTicket = ({ item }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('FSETicketDetail', { ticketId: item.id })}>
      <View style={styles.card}>
        <View style={[styles.statusStripe, { backgroundColor: getStatusColor(item.status) }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.ticketNo}>{item.ticketNo}</Text>
            <View style={[styles.statusPill, { backgroundColor: getStatusBg(item.status) }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={[styles.statusPillText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
            </View>
          </View>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.concern} numberOfLines={2}>{item.concern}</Text>
          {item.scheduledDate && (
            <View style={styles.scheduleChip}>
              <Ionicons name="calendar" size={13} color={ACCENT} />
              <Text style={styles.scheduleText}>{item.scheduledDate}</Text>
            </View>
          )}
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={13} color={colors.textLight} />
            <Text style={styles.address} numberOfLines={1}>{item.clientAddress || 'No address'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Field Engineer</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="clipboard-outline" label="Assigned" value={stats.assigned} />
          <StatCard icon="car-outline" label="Onsite" value={stats.onsite} />
          <StatCard icon="hourglass-outline" label="Pending" value={stats.pending} />
          <StatCard icon="checkmark-done-outline" label="Done" value={stats.done} />
        </View>
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal data={statusFilters} keyExtractor={i => i} showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          renderItem={({ item }) => {
            const active = filterStatus === item;
            return (
              <TouchableOpacity onPress={() => setFilterStatus(item)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item === 'ALL' ? 'All' : getStatusLabel(item)}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={filtered} keyExtractor={i => i.id} renderItem={renderTicket}
        contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="construct-outline" size={56} color={colors.textLight} /><Text style={styles.emptyText}>No tickets assigned</Text></View>}
      />
    </View>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={16} color="#fff" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: ACCENT, paddingTop: 54, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  logoutBtn: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 4 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  filterRow: { marginTop: spacing.lg },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surface, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  listContent: { padding: spacing.lg, paddingBottom: 40 },
  card: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden', ...shadow.sm },
  statusStripe: { width: 4 },
  cardBody: { flex: 1, padding: spacing.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  ticketNo: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  clientName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 3 },
  concern: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: spacing.sm },
  scheduleChip: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.full, marginBottom: spacing.sm },
  scheduleText: { fontSize: 12, color: ACCENT, fontWeight: '700' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { fontSize: 12, color: colors.textLight, flex: 1 },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { fontSize: 15, color: colors.textLight },
});
