import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { useTheme } from '../../context/ThemeContext';
import { getStatusColor, getStatusBg, getStatusLabel } from '../../utils/ticketUtils';
import { AnimatedCard, PressableScale } from '../../components/Animated';
import { getRoleConfig } from './roleConfig';

export default function TicketsScreen({ navigation }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const { user } = useAuth();
  const { tickets, getTicketsByFSE } = useTickets();
  const cfg = getRoleConfig(user?.role, colors);
  const styles = React.useMemo(() => makeStyles(colors, spacing, radius, shadow, cfg.accent), [colors, cfg.accent]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  const base = cfg.scope === 'mine' ? getTicketsByFSE(user?.uid) : tickets;

  const filtered = base.filter(t => {
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      t.ticketNo?.toLowerCase().includes(q) ||
      t.clientName?.toLowerCase().includes(q) ||
      t.concern?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const openTicket = (id) => navigation.navigate(cfg.detailRoute, { ticketId: id });

  const renderTicket = ({ item, index }) => {
    const expanded = expandedId === item.id;
    return (
      <AnimatedCard index={index}>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.tIcon, { backgroundColor: getStatusColor(item.status) + '1A' }]}>
              <Ionicons name="document-text" size={20} color={getStatusColor(item.status)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName} numberOfLines={1}>{item.clientName}</Text>
              <Text style={styles.ticketNo}>{item.ticketNo}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: getStatusBg(item.status) }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={[styles.statusPillText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setExpandedId(expanded ? null : item.id)}
              style={[styles.chevBtn, expanded && { backgroundColor: cfg.accent }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={expanded ? '#fff' : cfg.accent} />
            </TouchableOpacity>
          </View>

          {expanded && (
            <View style={styles.details}>
              <Text style={styles.detailLabel}>Concern</Text>
              <Text style={styles.concern}>{item.concern}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="pricetag-outline" size={13} color={colors.textLight} />
                  <Text style={styles.metaText}>{item.concernType}</Text>
                </View>
                {item.scheduledDate ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color={colors.textLight} />
                    <Text style={styles.metaText}>{item.scheduledDate}</Text>
                  </View>
                ) : null}
              </View>
              {item.clientAddress ? (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={13} color={colors.textLight} />
                  <Text style={styles.metaText} numberOfLines={2}>{item.clientAddress}</Text>
                </View>
              ) : null}
              <PressableScale style={styles.openBtn} onPress={() => openTicket(item.id)}>
                <Ionicons name="open-outline" size={16} color="#fff" />
                <Text style={styles.openBtnText}>Open Ticket</Text>
              </PressableScale>
            </View>
          )}
        </View>
      </AnimatedCard>
    );
  };

  const ListHeader = (
    <View>
      {cfg.canCreate && (
        <PressableScale onPress={() => navigation.navigate('CreateTicket')}>
          <LinearGradient colors={cfg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.createBtn, shadow.glow(cfg.accent)]}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createBtnText}>Create New Ticket</Text>
          </LinearGradient>
        </PressableScale>
      )}

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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {cfg.statusFilters.map(item => {
          const active = filterStatus === item;
          return (
            <TouchableOpacity key={item} onPress={() => setFilterStatus(item)} style={[styles.chip, active && styles.chipActive]} activeOpacity={0.8}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item === 'ALL' ? 'All' : getStatusLabel(item)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</Text>
        <Text style={styles.hintText}>Tap the arrow to view details</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={cfg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>{cfg.scope === 'mine' ? 'My Jobs' : 'Tickets'}</Text>
        <Text style={styles.headerSub}>{cfg.portal}</Text>
      </LinearGradient>

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
    </View>
  );
}

const makeStyles = (colors, spacing, radius, shadow, accent) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 54, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  listContent: { padding: spacing.lg, paddingBottom: 30 },

  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, paddingVertical: 15, marginBottom: spacing.lg },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  searchWrapper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.text },
  filterRow: { paddingVertical: spacing.md, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.surface, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: accent, borderColor: accent },
  chipText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  countRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  countText: { fontSize: 14, fontWeight: '800', color: colors.text },
  hintText: { fontSize: 11, color: colors.textLight },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tIcon: { width: 42, height: 42, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  clientName: { fontSize: 15, fontWeight: '700', color: colors.text },
  ticketNo: { fontSize: 11, fontWeight: '600', color: colors.textMuted, marginTop: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.full },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  chevBtn: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  details: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  detailLabel: { fontSize: 11, fontWeight: '700', color: colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5 },
  concern: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  metaText: { fontSize: 12, color: colors.textLight, flexShrink: 1 },
  openBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: accent, borderRadius: radius.md, paddingVertical: 11, marginTop: spacing.xs },
  openBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.md },
  emptyText: { fontSize: 15, color: colors.textLight },
});
