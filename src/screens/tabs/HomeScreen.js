import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { useTheme } from '../../context/ThemeContext';
import { getStatusColor, getStatusLabel } from '../../utils/ticketUtils';
import { AnimatedCard, PressableScale, AnimatedCounter, FadeIn } from '../../components/Animated';
import { getRoleConfig } from './roleConfig';

export default function HomeScreen({ navigation }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const { user } = useAuth();
  const { tickets, getTicketsByFSE } = useTickets();
  const cfg = getRoleConfig(user?.role, colors);
  const styles = React.useMemo(() => makeStyles(colors, spacing, radius, shadow, cfg.accent), [colors, cfg.accent]);

  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const myTickets = cfg.scope === 'mine' ? getTicketsByFSE(user?.uid) : tickets;

  const stats = {
    open: myTickets.filter(t => t.status !== 'CLOSED').length,
    pending: myTickets.filter(t => ['PENDING_ACCOUNTING', 'SERVICE_PENDING'].includes(t.status)).length,
    resolved: myTickets.filter(t => t.status === 'CLOSED').length,
  };

  const recent = [...myTickets]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning,' : hour < 18 ? 'Good afternoon,' : 'Good evening,';
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const goTab = (a) => {
    if (a.route) navigation.navigate(a.route);
    else if (a.tab) navigation.navigate(a.tab);
  };

  const openTicket = (id) => navigation.navigate('Tickets', { screen: cfg.detailRoute, params: { ticketId: id } });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={cfg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <FadeIn>
          <View style={styles.headerTop}>
            <View style={styles.brandChip}>
              <Image source={require('../../../assets/brand-logo.png')} style={styles.brandLogo} resizeMode="contain" />
            </View>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
          </View>
          <Text style={styles.greeting}>{greet}</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.portal}>{cfg.portal}</Text>
        </FadeIn>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={colors.textLight} />
          <TextInput
            placeholder="Search for help..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            onSubmitEditing={() => navigation.navigate('Tickets')}
          />
        </View>

        {/* Need Help banner */}
        <AnimatedCard index={0}>
          <PressableScale onPress={() => navigation.navigate('Notifications')}>
            <LinearGradient colors={cfg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.helpBanner, shadow.glow(cfg.accent)]}>
              <View style={styles.helpIcon}>
                <Ionicons name="headset" size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.helpTitle}>Need Help?</Text>
                <Text style={styles.helpSub}>Our tech support team is ready to assist you.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.9)" />
            </LinearGradient>
          </PressableScale>
        </AnimatedCard>

        {/* Stat summary */}
        <View style={styles.statRow}>
          <StatMini styles={styles} label="Open" value={stats.open} color={colors.info} icon="reload-circle" />
          <StatMini styles={styles} label="Pending" value={stats.pending} color={colors.warning} icon="time" />
          <StatMini styles={styles} label="Resolved" value={stats.resolved} color={colors.success} icon="checkmark-circle" />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {cfg.quickActions.map((a, i) => (
            <AnimatedCard key={a.key} index={i} style={styles.quickWrap}>
              <PressableScale style={styles.quickCard} onPress={() => goTab(a)}>
                <View style={[styles.quickIcon, { backgroundColor: cfg.accent + '1A' }]}>
                  <Ionicons name={a.icon} size={22} color={cfg.accent} />
                </View>
                <Text style={styles.quickLabel}>{a.label}</Text>
                <Text style={styles.quickSub} numberOfLines={2}>{a.sub}</Text>
              </PressableScale>
            </AnimatedCard>
          ))}
        </View>

        {/* Recent Activity — compact, tap icon to expand */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tickets')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <View style={styles.emptyMini}>
            <Ionicons name="file-tray-outline" size={40} color={colors.textLight} />
            <Text style={styles.emptyMiniText}>No recent activity</Text>
          </View>
        ) : recent.map((t, i) => {
          const expanded = expandedId === t.id;
          return (
            <AnimatedCard key={t.id} index={i}>
              <View style={styles.actRow}>
                <View style={[styles.actIcon, { backgroundColor: getStatusColor(t.status) + '1A' }]}>
                  <Ionicons name="document-text" size={18} color={getStatusColor(t.status)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actClient} numberOfLines={1}>{t.clientName}</Text>
                  <Text style={styles.actNo}>{t.ticketNo}</Text>
                </View>
                <View style={[styles.miniPill, { backgroundColor: getStatusColor(t.status) + '1A' }]}>
                  <Text style={[styles.miniPillText, { color: getStatusColor(t.status) }]}>{getStatusLabel(t.status)}</Text>
                </View>
                {/* tap this icon to reveal details */}
                <TouchableOpacity
                  onPress={() => setExpandedId(expanded ? null : t.id)}
                  style={[styles.chevBtn, expanded && { backgroundColor: cfg.accent }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={expanded ? '#fff' : cfg.accent} />
                </TouchableOpacity>
              </View>
              {expanded && (
                <View style={styles.actDetails}>
                  <Text style={styles.actConcern}>{t.concern}</Text>
                  <PressableScale style={styles.openBtn} onPress={() => openTicket(t.id)}>
                    <Ionicons name="open-outline" size={16} color="#fff" />
                    <Text style={styles.openBtnText}>Open Ticket</Text>
                  </PressableScale>
                </View>
              )}
            </AnimatedCard>
          );
        })}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function StatMini({ styles, label, value, color, icon }) {
  return (
    <View style={styles.statMini}>
      <Ionicons name={icon} size={18} color={color} />
      <AnimatedCounter value={value} style={[styles.statMiniValue, { color }]} />
      <Text style={styles.statMiniLabel}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors, spacing, radius, shadow, accent) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 54, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  brandChip: { backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 5 },
  brandLogo: { width: 118, height: 26 },
  avatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 2 },
  portal: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scroll: { padding: spacing.lg, paddingTop: spacing.md },

  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.border, ...shadow.sm, marginTop: -spacing.xxxl - spacing.sm, marginBottom: spacing.lg,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.text },

  helpBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  helpIcon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center' },
  helpTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  helpSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  statRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statMini: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  statMiniValue: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  statMiniLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
  viewAll: { fontSize: 13, fontWeight: '700', color: accent },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.sm },
  quickWrap: { width: '47%', flexGrow: 1 },
  quickCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.sm, minHeight: 120 },
  quickIcon: { width: 44, height: 44, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  quickLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  quickSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 16 },

  actRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  actIcon: { width: 38, height: 38, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  actClient: { fontSize: 14, fontWeight: '700', color: colors.text },
  actNo: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  miniPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  miniPillText: { fontSize: 10, fontWeight: '700' },
  chevBtn: { width: 30, height: 30, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  actDetails: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginTop: -spacing.sm + 2, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  actConcern: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  openBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: accent, borderRadius: radius.md, paddingVertical: 11 },
  openBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  emptyMini: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  emptyMiniText: { fontSize: 14, color: colors.textLight },
});
