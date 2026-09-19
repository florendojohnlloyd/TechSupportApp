import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { useTheme } from '../../context/ThemeContext';
import { getStatusColor, getStatusBg, getStatusLabel } from '../../utils/ticketUtils';
import { AnimatedCard, PressableScale, AnimatedCounter, FadeIn } from '../../components/Animated';
import SideDrawer, { HamburgerButton } from '../../components/SideDrawer';

export default function SupportDashboard({ navigation }) {
  const { colors, spacing, radius, shadow, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, spacing, radius, shadow), [colors]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    open: tickets.filter(t => !['CLOSED'].includes(t.status)).length,
    pending: tickets.filter(t => t.status === 'PENDING_ACCOUNTING').length,
    resolved: tickets.filter(t => t.status === 'CLOSED').length,
    assigned: tickets.filter(t => ['ASSIGNED_FSE', 'ONSITE'].includes(t.status)).length,
  };

  const statCards = [
    { key: 'open', label: 'Open Tickets', value: stats.open, icon: 'reload-circle', gradient: colors.gradientDanger },
    { key: 'pending', label: 'Pending', value: stats.pending, icon: 'time', gradient: colors.gradientWarning },
    { key: 'resolved', label: 'Resolved', value: stats.resolved, icon: 'checkmark-circle', gradient: colors.gradientSuccess },
    { key: 'assigned', label: 'Assigned', value: stats.assigned, icon: 'person', gradient: colors.gradientInfo },
  ];

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const confirmLogout = () => {
    Alert.alert(
      'Account',
      `Signed in as ${user?.name}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const renderTicket = ({ item, index }) => (
    <AnimatedCard index={index}>
      <PressableScale onPress={() => navigation.navigate('TicketDetail', { ticketId: item.id })}>
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
      </PressableScale>
    </AnimatedCard>
  );

  const ListHeader = (
    <View>
      {/* Stat cards grid */}
      <View style={styles.statsGrid}>
        {statCards.map((s, i) => (
          <AnimatedCard key={s.key} index={i} style={styles.statCardWrap}>
            <LinearGradient
              colors={s.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.statCard, shadow.glow(s.gradient[1])]}
            >
              <View style={styles.statIcon}>
                <Ionicons name={s.icon} size={20} color="#fff" />
              </View>
              <AnimatedCounter value={s.value} style={styles.statValue} delay={200 + i * 80} />
              <Text style={styles.statLabel}>{s.label}</Text>
            </LinearGradient>
          </AnimatedCard>
        ))}
      </View>

      {/* System Status */}
      <AnimatedCard index={4} style={styles.systemCard}>
        <View style={styles.systemLeft}>
          <View style={styles.systemDotWrap}>
            <View style={styles.systemDot} />
          </View>
          <View>
            <Text style={styles.systemTitle}>System Status</Text>
            <Text style={styles.systemSub}>All Systems Operational</Text>
          </View>
        </View>
        <Ionicons name="pulse" size={22} color={colors.success} />
      </AnimatedCard>

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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {statusFilters.map(item => {
          const active = filterStatus === item;
          return (
            <TouchableOpacity
              key={item}
              onPress={() => setFilterStatus(item)}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item === 'ALL' ? 'All' : getStatusLabel(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Recent Tickets</Text>
        <Text style={styles.recentCount}>{filtered.length}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Gradient Header */}
      <LinearGradient
        colors={colors.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <FadeIn>
          <View style={styles.headerTop}>
            <HamburgerButton onPress={() => setDrawerOpen(true)} style={styles.iconBtn} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.greeting}>Good day,</Text>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.subGreeting}>Here's what's happening today.</Text>
            </View>
            <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.avatar} activeOpacity={0.8}>
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </FadeIn>
      </LinearGradient>

      {/* Body */}
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        renderItem={renderTicket}
        ListHeaderComponent={ListHeader}
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
      <PressableScale onPress={() => navigation.navigate('CreateTicket')} style={styles.fabWrap}>
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fab, shadow.glow(colors.primary)]}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </PressableScale>

      <SideDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        accent={colors.support}
        headerGradient={colors.gradientHeader}
      />
    </View>
  );
}

const makeStyles = (colors, spacing, radius, shadow) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingTop: 54, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 2 },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  iconBtn: {
    width: 42, height: 42, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center',
  },
  avatar: {
    width: 42, height: 42, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md,
    paddingHorizontal: spacing.lg, marginTop: -spacing.lg,
  },
  statCardWrap: { width: '47%', flexGrow: 1 },
  statCard: {
    borderRadius: radius.xl, padding: spacing.lg, minHeight: 108, justifyContent: 'space-between',
  },
  statIcon: {
    width: 38, height: 38, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center',
  },
  statValue: { fontSize: 30, fontWeight: '900', color: '#fff', marginTop: spacing.sm },
  statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },

  systemCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: radius.lg,
    marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  systemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  systemDotWrap: {
    width: 36, height: 36, borderRadius: radius.full,
    backgroundColor: colors.successBg, justifyContent: 'center', alignItems: 'center',
  },
  systemDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success },
  systemTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  systemSub: { fontSize: 12, color: colors.success, fontWeight: '600', marginTop: 1 },

  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, marginHorizontal: spacing.lg, marginTop: spacing.lg,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.text },
  filterRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radius.full,
    backgroundColor: colors.surface, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  recentHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.md,
  },
  recentTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  recentCount: {
    fontSize: 12, fontWeight: '700', color: colors.primary,
    backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full,
    overflow: 'hidden',
  },

  listContent: { paddingBottom: 100 },
  card: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.lg,
    marginBottom: spacing.md, marginHorizontal: spacing.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border, ...shadow.sm,
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
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText: { fontSize: 15, color: colors.textLight },
  fabWrap: { position: 'absolute', right: spacing.xl, bottom: spacing.xl },
  fab: {
    width: 58, height: 58, borderRadius: radius.xl,
    justifyContent: 'center', alignItems: 'center',
  },
});
