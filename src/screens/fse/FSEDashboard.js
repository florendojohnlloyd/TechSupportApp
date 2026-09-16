import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { getStatusColor, getStatusBg, getStatusLabel } from '../../utils/ticketUtils';
import { colors, spacing, radius, shadow } from '../../theme';

const ACCENT = colors.fse;

const MONTHS = [
  'All Months', 'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
];

const STATUS_FILTERS = [
  { key: 'ALL', label: 'All Status', icon: 'apps-outline' },
  { key: 'ASSIGNED_FSE', label: 'Assigned', icon: 'clipboard-outline' },
  { key: 'ONSITE', label: 'Onsite', icon: 'car-outline' },
  { key: 'SERVICE_PENDING', label: 'Pending', icon: 'hourglass-outline' },
  { key: 'CLOSED', label: 'Done', icon: 'checkmark-done-outline' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First' },
  { key: 'oldest', label: 'Oldest First' },
  { key: 'scheduled', label: 'By Schedule' },
];

export default function FSEDashboard({ navigation }) {
  const { user, logout } = useAuth();
  const { getTicketsByFSE } = useTickets();

  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState('All Months');
  const [sortBy, setSortBy] = useState('newest');

  // Temporary filter state (inside sidebar — only applied on "Apply")
  const [tempStatus, setTempStatus] = useState('ALL');
  const [tempMonth, setTempMonth] = useState('All Months');
  const [tempSort, setTempSort] = useState('newest');

  const myTickets = getTicketsByFSE(user?.uid);

  const applyFilters = (tickets) => {
    let result = [...tickets];

    // Status filter
    if (filterStatus !== 'ALL') {
      result = result.filter(t => t.status === filterStatus);
    }

    // Month filter
    if (filterMonth !== 'All Months') {
      const monthIndex = MONTHS.indexOf(filterMonth); // 1-based
      result = result.filter(t => {
        const date = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
        return date.getMonth() + 1 === monthIndex;
      });
    }

    // Sort
    result.sort((a, b) => {
      const da = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const db = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      if (sortBy === 'newest') return db - da;
      if (sortBy === 'oldest') return da - db;
      if (sortBy === 'scheduled') {
        const sa = a.scheduledDate || '';
        const sb = b.scheduledDate || '';
        return sa.localeCompare(sb);
      }
      return 0;
    });

    return result;
  };

  const filtered = applyFilters(myTickets);

  const activeFilterCount = [
    filterStatus !== 'ALL',
    filterMonth !== 'All Months',
    sortBy !== 'newest',
  ].filter(Boolean).length;

  const stats = {
    assigned: myTickets.filter(t => t.status === 'ASSIGNED_FSE').length,
    onsite: myTickets.filter(t => t.status === 'ONSITE').length,
    pending: myTickets.filter(t => t.status === 'SERVICE_PENDING').length,
    done: myTickets.filter(t => t.status === 'CLOSED').length,
  };

  const openFilter = () => {
    // Sync temp state with current applied filters
    setTempStatus(filterStatus);
    setTempMonth(filterMonth);
    setTempSort(sortBy);
    setShowFilter(true);
  };

  const applyFilter = () => {
    setFilterStatus(tempStatus);
    setFilterMonth(tempMonth);
    setSortBy(tempSort);
    setShowFilter(false);
  };

  const resetFilter = () => {
    setTempStatus('ALL');
    setTempMonth('All Months');
    setTempSort('newest');
  };

  const renderTicket = ({ item }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('FSETicketDetail', { ticketId: item.id })}>
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Field Engineer</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.reportsBtn}
              onPress={() => navigation.navigate('FSEReports')}
            >
              <Ionicons name="bar-chart-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard icon="clipboard-outline" label="Assigned" value={stats.assigned} />
          <StatCard icon="car-outline" label="Onsite" value={stats.onsite} />
          <StatCard icon="hourglass-outline" label="Pending" value={stats.pending} />
          <StatCard icon="checkmark-done-outline" label="Done" value={stats.done} />
        </View>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Text style={styles.resultCount}>
          {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
          {filterStatus !== 'ALL' || filterMonth !== 'All Months' ? ' (filtered)' : ''}
        </Text>
        <TouchableOpacity style={styles.filterBtn} onPress={openFilter} activeOpacity={0.8}>
          <Ionicons name="options-outline" size={18} color={activeFilterCount > 0 ? '#fff' : ACCENT} />
          <Text style={[styles.filterBtnText, activeFilterCount > 0 && { color: '#fff' }]}>
            Filter
          </Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active filter pills */}
      {(filterStatus !== 'ALL' || filterMonth !== 'All Months') && (
        <View style={styles.activePills}>
          {filterStatus !== 'ALL' && (
            <TouchableOpacity
              style={styles.activePill}
              onPress={() => setFilterStatus('ALL')}
            >
              <Text style={styles.activePillText}>{getStatusLabel(filterStatus)}</Text>
              <Ionicons name="close" size={13} color={ACCENT} />
            </TouchableOpacity>
          )}
          {filterMonth !== 'All Months' && (
            <TouchableOpacity
              style={styles.activePill}
              onPress={() => setFilterMonth('All Months')}
            >
              <Text style={styles.activePillText}>{filterMonth}</Text>
              <Ionicons name="close" size={13} color={ACCENT} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Ticket List */}
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderTicket}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="construct-outline" size={56} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No tickets found</Text>
            <Text style={styles.emptySubtitle}>
              {activeFilterCount > 0 ? 'Try adjusting your filters' : 'No tickets assigned yet'}
            </Text>
          </View>
        }
      />

      {/* Filter Sidebar Modal */}
      <Modal visible={showFilter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setShowFilter(false)} />
          <View style={styles.sidebar}>
            {/* Sidebar Header */}
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Filter Tickets</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)} style={styles.sidebarClose}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.sidebarScroll}>

              {/* Status */}
              <Text style={styles.sidebarLabel}>
                <Ionicons name="ellipse-outline" size={14} /> Status
              </Text>
              <View style={styles.statusGrid}>
                {STATUS_FILTERS.map(s => {
                  const active = tempStatus === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.statusOption, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}
                      onPress={() => setTempStatus(s.key)}
                    >
                      <Ionicons name={s.icon} size={18} color={active ? '#fff' : colors.textMuted} />
                      <Text style={[styles.statusOptionText, active && { color: '#fff' }]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Month */}
              <Text style={styles.sidebarLabel}>
                <Ionicons name="calendar-outline" size={14} /> Month
              </Text>
              <View style={styles.monthGrid}>
                {MONTHS.map(m => {
                  const active = tempMonth === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      style={[styles.monthChip, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}
                      onPress={() => setTempMonth(m)}
                    >
                      <Text style={[styles.monthChipText, active && { color: '#fff', fontWeight: '700' }]}>
                        {m === 'All Months' ? 'All' : m.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Sort */}
              <Text style={styles.sidebarLabel}>
                <Ionicons name="swap-vertical-outline" size={14} /> Sort By
              </Text>
              {SORT_OPTIONS.map(s => {
                const active = tempSort === s.key;
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={styles.sortRow}
                    onPress={() => setTempSort(s.key)}
                  >
                    <View style={[styles.radioCircle, active && { borderColor: ACCENT }]}>
                      {active && <View style={[styles.radioDot, { backgroundColor: ACCENT }]} />}
                    </View>
                    <Text style={[styles.sortLabel, active && { color: ACCENT, fontWeight: '700' }]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Sidebar Footer */}
            <View style={styles.sidebarFooter}>
              <TouchableOpacity style={styles.resetBtn} onPress={resetFilter}>
                <Text style={styles.resetBtnText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilter}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    backgroundColor: ACCENT,
    paddingTop: 54, paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  reportsBtn: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  logoutBtn: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  statCard: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 4 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },
  resultCount: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.successBg,
    borderWidth: 1.5, borderColor: ACCENT,
    paddingHorizontal: spacing.lg, paddingVertical: 8,
    borderRadius: radius.full,
  },
  filterBtnText: { fontSize: 14, fontWeight: '700', color: ACCENT },
  filterBadge: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: ACCENT, justifyContent: 'center', alignItems: 'center', marginLeft: 2,
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  activePills: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  activePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.successBg, borderWidth: 1, borderColor: ACCENT,
    paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.full,
  },
  activePillText: { fontSize: 12, color: ACCENT, fontWeight: '600' },
  listContent: { padding: spacing.lg, paddingBottom: 40 },
  card: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.lg, marginBottom: spacing.md,
    overflow: 'hidden', ...shadow.sm,
  },
  statusStripe: { width: 4 },
  cardBody: { flex: 1, padding: spacing.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  ticketNo: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.3 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  clientName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 3 },
  concern: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: spacing.sm },
  scheduleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md, paddingVertical: 5,
    borderRadius: radius.full, marginBottom: spacing.sm,
  },
  scheduleText: { fontSize: 12, color: ACCENT, fontWeight: '700' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  address: { fontSize: 12, color: colors.textLight, flex: 1 },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textMuted },
  emptySubtitle: { fontSize: 13, color: colors.textLight },
  // Modal / Sidebar
  modalOverlay: { flex: 1, flexDirection: 'row' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sidebar: {
    width: 300, backgroundColor: colors.surface,
    ...shadow.lg, paddingBottom: 0,
  },
  sidebarHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingTop: 54, paddingBottom: spacing.lg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: ACCENT,
  },
  sidebarTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  sidebarClose: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  sidebarScroll: { flex: 1, padding: spacing.xl },
  sidebarLabel: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: spacing.lg, marginBottom: spacing.md,
  },
  statusGrid: { gap: spacing.sm },
  statusOption: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    padding: spacing.md, backgroundColor: colors.bg,
  },
  statusOptionText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  monthChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.full, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.bg,
  },
  monthChipText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  sortRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  sortLabel: { fontSize: 14, color: colors.text },
  sidebarFooter: {
    flexDirection: 'row', gap: spacing.md,
    padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  resetBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center',
  },
  resetBtnText: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  applyBtn: {
    flex: 2, paddingVertical: 14, borderRadius: radius.md,
    backgroundColor: ACCENT, alignItems: 'center',
  },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
