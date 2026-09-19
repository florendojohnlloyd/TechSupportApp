import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { useTheme } from '../../context/ThemeContext';
import { AnimatedCard, PressableScale } from '../../components/Animated';

export default function RoutesScreen({ navigation }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const { user } = useAuth();
  const { getTicketsByFSE } = useTickets();
  const styles = React.useMemo(() => makeStyles(colors, spacing, radius, shadow), [colors]);

  const jobs = getTicketsByFSE(user?.uid).filter(j => j.status !== 'CLOSED');

  const openTicket = (id) => navigation.navigate('Home', { screen: 'FSETicketDetail', params: { ticketId: id } });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Route Plan</Text>
        <Text style={styles.sub}>{jobs.length} stops • Dallas Zone B</Text>
      </View>

      {/* Map placeholder */}
      <View style={styles.mapCard}>
        <Ionicons name="map" size={40} color={colors.info} />
        <Text style={styles.mapTitle}>Optimized Field Route</Text>
        <Text style={styles.mapSub}>Est. travel time: 48 mins</Text>
      </View>

      <Text style={styles.section}>Stops in Order</Text>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {jobs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="navigate-outline" size={44} color={colors.textLight} />
            <Text style={styles.emptyText}>No active stops</Text>
          </View>
        ) : jobs.map((job, i) => (
          <AnimatedCard key={job.id} index={i}>
            <PressableScale style={styles.stopCard} onPress={() => openTicket(job.id)}>
              <View style={styles.stopNum}><Text style={styles.stopNumText}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stopClient} numberOfLines={1}>{job.clientName}</Text>
                <Text style={styles.stopAddr} numberOfLines={1}>{job.clientAddress || 'No address'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </PressableScale>
          </AnimatedCard>
        ))}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors, spacing, radius, shadow) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 54, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  mapCard: { alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: 16, margin: 20, marginBottom: 8, paddingVertical: 36, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  mapTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 6 },
  mapSub: { fontSize: 12, color: colors.textMuted },
  section: { fontSize: 13, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginHorizontal: 20, marginTop: 8, marginBottom: 6 },
  scroll: { paddingHorizontal: 20 },
  stopCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  stopNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  stopNumText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stopClient: { fontSize: 15, fontWeight: '700', color: colors.text },
  stopAddr: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  empty: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  emptyText: { fontSize: 14, color: colors.textLight },
});
