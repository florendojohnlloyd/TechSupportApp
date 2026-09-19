import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { useTheme } from '../../context/ThemeContext';
import { getStatusColor } from '../../utils/ticketUtils';
import { AnimatedCard, PressableScale } from '../../components/Animated';
import { getRoleConfig } from './roleConfig';

export default function NotificationsScreen({ navigation }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const { user } = useAuth();
  const { tickets, getTicketsByFSE } = useTickets();
  const cfg = getRoleConfig(user?.role, colors);
  const styles = React.useMemo(() => makeStyles(colors, spacing, radius, shadow, cfg.accent), [colors, cfg.accent]);

  const base = cfg.scope === 'mine' ? getTicketsByFSE(user?.uid) : tickets;

  // Flatten each ticket's history into notification items
  const items = [];
  base.forEach(t => {
    (t.history || []).forEach((h, idx) => {
      items.push({
        id: `${t.id}_${idx}`,
        ticketId: t.id,
        ticketNo: t.ticketNo,
        clientName: t.clientName,
        status: h.status,
        note: h.note,
        by: h.by,
        at: h.at,
      });
    });
  });
  items.sort((a, b) => new Date(b.at) - new Date(a.at));

  const openTicket = (id) => navigation.navigate('Tickets', { screen: cfg.detailRoute, params: { ticketId: id } });

  const renderItem = ({ item, index }) => (
    <AnimatedCard index={Math.min(index, 8)}>
      <PressableScale style={styles.row} onPress={() => openTicket(item.ticketId)}>
        <View style={[styles.icon, { backgroundColor: getStatusColor(item.status) + '1A' }]}>
          <Ionicons name="notifications" size={18} color={getStatusColor(item.status)} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.note} numberOfLines={2}>{item.note}</Text>
          <Text style={styles.meta}>
            {item.ticketNo} · {item.clientName}
          </Text>
          <Text style={styles.time}>
            {item.by} · {item.at ? new Date(item.at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
      </PressableScale>
    </AnimatedCard>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={cfg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSub}>Updates & activity</Text>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={56} color={colors.textLight} />
            <Text style={styles.emptyText}>No notifications yet</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  icon: { width: 40, height: 40, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  note: { fontSize: 14, fontWeight: '600', color: colors.text, lineHeight: 19 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  time: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80, gap: spacing.md },
  emptyText: { fontSize: 15, color: colors.textLight },
});
