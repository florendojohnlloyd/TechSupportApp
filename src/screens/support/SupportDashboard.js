import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { getStatusColor, getStatusBg, getStatusLabel } from '../../utils/ticketUtils';
import { colors, spacing, radius, shadow } from '../../theme';

export default function SupportDashboard({ navigation }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { user, logout } = useAuth();
  const { tickets } = useTickets();

  const filtered = tickets.filter(t => {
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      t.ticketNo?.toLowerCase().includes(q) ||
      t.clientName?.toLowerCase().includes(q) ||
      t.concern?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const statusFilters = ['ALL', 'PENDING_ACCOUNTING', 'IN_ASSESSMENT', 'ESCALATED', 'ASSIGNED_FSE', 'CLOSED'];

  const stats = {
    pending: tickets.filter(t => t.status === 'PENDING_ACCOUNTING').length,
    inProgress: tickets.filter(t => ['IN_ASSESSMENT', 'ESCALATED', 'ASSIGNED_FSE', 'ONSITE'].includes(t.status)).length,
    closed: tickets.filter(t => t.status === 'CLOSED').length,
  };

  const renderTicket = ({ item }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}>
      <View style={styles.card}>
        <View style={[styles.statusStripe, { backgroundColor: getStatusColor(item.status) }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.ticketNo}>{item.ticketNo}</Text>
            <View style={[styles.statusPill, { backgroundColor: getStatusBg(item.status) }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={[styles.statusPillText, { color: getStatusColor(item.status) }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.clientName}>{item.clientName}</Text>
          <Text style={styles.concern} numberOfLines={2}>{item.concern}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.metaItem}>
              <Ionicons name="radio-outline" size={13} color={colors.textLight} />
              <Text style={styles.metaText}>{item.channel}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={colors.textLight} />
              <Text style={styles.metaText}>
                {item.createdAt instanceof Date ? item.createdAt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Support Desk</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <StatCard icon="time-outline" label="Pending" value={stats.pending} tint="#FBBF24" />
          <StatCard icon="sync-outline" label="In Progress" value={stats.inProgress} tint="#60A5FA" />
          <StatCard icon="checkmark-done-outline" label="Closed" value={stats.closed} tint="#34D399" />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color={colors.textLight} />
        <TextInput
          placeholder="Search tickets, clients..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={statusFilters}
          keyExtractor={i => i}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          renderItem={({ item }) => {
            const active = filterStatus === item;
            return (
              <TouchableOpacity
                onPress={() => setFilterStatus(item)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item === 'ALL' ? 'All' : getStatusLabel(item)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderTicket}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="file-tray-outline" size={56} color={colors.textLight} />
            <Text style={styles.emptyText}>No tickets found</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateTicket')} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function StatCard({ icon, label, value, tint }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: tint + '33' }]}>
        <Ionicons name={icon} size={18} color="#fff" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 54, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  logoutBtn: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center',
  },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'flex-start',
  },
  statIcon: { width: 32, height: 32, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  statValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, marginHorizontal: spacing.lg, marginTop: spacing.lg,
    borderRadius: radius.md, paddingHorizontal: spacing.md, ...shadow.sm,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.text },
  filterRow: { marginTop: spacing.md },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radius.full,
    backgroundColor: colors.surface, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  listContent: { padding: spacing.lg, paddingBottom: 100 },
  card: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg,
    marginBottom: spacing.md, overflow: 'hidden', ...shadow.sm,
  },
  statusStripe: { width: 4 },
  cardBody: { flex: 1, padding: spacing.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  ticketNo: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  clientName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 3 },
  concern: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: spacing.md },
  cardFooter: { flexDirection: 'row', gap: spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textLight },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { fontSize: 15, color: colors.textLight },
  fab: {
    position: 'absolute', right: spacing.xl, bottom: spacing.xl,
    width: 58, height: 58, borderRadius: radius.xl,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', ...shadow.lg,
  },
});
