import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { useTheme } from '../../context/ThemeContext';
import { AnimatedCard, PressableScale, FadeIn } from '../../components/Animated';
import BrandLogo from '../../components/BrandLogo';

const DUTY = {
  on_duty: { label: 'On Duty', color: '#10B981' },
  on_break: { label: 'On Break', color: '#F59E0B' },
  off_duty: { label: 'Off Duty', color: '#64748B' },
};
const DUTY_ORDER = ['on_duty', 'on_break', 'off_duty'];

// Map ticket status -> mock's schedule buckets
const bucketOf = (s) => {
  if (s === 'CLOSED') return 'done';
  if (s === 'ONSITE' || s === 'SERVICE_PENDING') return 'active';
  return 'upcoming';
};
const timeOf = (t) => {
  const d = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function FSEHomeScreen({ navigation }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const { user, dutyStatus, updateDutyStatus } = useAuth();
  const { getTicketsByFSE, updateTicket } = useTickets();
  const styles = React.useMemo(() => makeStyles(colors, spacing, radius, shadow), [colors]);

  const [filter, setFilter] = useState('all');

  const badgeFor = (s) => {
    const b = bucketOf(s);
    if (b === 'done') return { text: 'Done', bg: colors.successBg, color: colors.success };
    if (b === 'active') return { text: 'Active', bg: colors.infoBg, color: colors.info };
    return { text: 'Scheduled', bg: colors.surfaceAlt, color: colors.textMuted };
  };

  const jobs = getTicketsByFSE(user?.uid);
  const counts = {
    all: jobs.length,
    active: jobs.filter(j => bucketOf(j.status) === 'active').length,
    upcoming: jobs.filter(j => bucketOf(j.status) === 'upcoming').length,
    done: jobs.filter(j => bucketOf(j.status) === 'done').length,
  };
  const filtered = filter === 'all' ? jobs : jobs.filter(j => bucketOf(j.status) === filter);

  const duty = DUTY[dutyStatus] || DUTY.on_duty;
  const cycleDuty = () => {
    const idx = DUTY_ORDER.indexOf(dutyStatus);
    updateDutyStatus(DUTY_ORDER[(idx + 1) % DUTY_ORDER.length]);
  };

  const initials = (user?.name || 'U').split(' ').map(w => w[0])[0]?.toUpperCase() || 'A';
  const firstName = (user?.name || 'Technician').split(' ')[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const openTicket = (id) => navigation.navigate('FSETicketDetail', { ticketId: id });

  const acceptTicket = (job) => {
    Alert.alert('Accept Ticket', `Accept ${job.ticketNo} and start onsite service?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: () => updateTicket(job.id, { status: 'ONSITE' }, {
          status: 'ONSITE', note: `${user.name} accepted the ticket. Dispatch notified.`,
          by: user.name, at: new Date().toISOString(),
        }),
      },
    ]);
  };

  const FILTERS = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'active', label: `Active (${counts.active})` },
    { key: 'upcoming', label: `Upcoming (${counts.upcoming})` },
    { key: 'done', label: `Done (${counts.done})` },
  ];

  return (
    <View style={styles.container}>
      {/* Brand top bar */}
      <View style={styles.brandBar}>
        <BrandLogo width={130} height={30} />
        <TouchableOpacity
          style={[styles.dutyPill, { backgroundColor: duty.color + '22', borderColor: duty.color + '55' }]}
          onPress={cycleDuty}
          activeOpacity={0.85}
        >
          <View style={[styles.dutyDot, { backgroundColor: duty.color }]} />
          <Text style={[styles.dutyLabel, { color: duty.color }]}>{duty.label}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tech header */}
        <FadeIn>
          <View style={styles.techHeader}>
            <View style={styles.techInfo}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                <View style={[styles.dutyIndicator, { backgroundColor: duty.color }]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>{greet}, {firstName} 👋</Text>
                <Text style={styles.role}>Senior Field Tech • Dallas Zone B</Text>
              </View>
            </View>
            <View style={styles.serviceTag}>
              <Text style={styles.serviceTagText}>FIELD SERVICE</Text>
            </View>
          </View>
        </FadeIn>

        {/* Today's Schedule */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{counts.all} Orders</Text>
          </View>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            return (
              <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, active && styles.chipActive]} activeOpacity={0.8}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Job cards */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={44} color={colors.textLight} />
            <Text style={styles.emptyText}>No orders in this view</Text>
          </View>
        ) : filtered.map((job, i) => {
          const bucket = bucketOf(job.status);
          const badge = badgeFor(job.status);
          const canAccept = job.status === 'ASSIGNED_FSE';
          const inProgress = bucket === 'active';
          return (
            <AnimatedCard key={job.id} index={i}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openTicket(job.id)}
                style={[styles.jobCard, inProgress && styles.jobCardActive]}
              >
                <View style={styles.jobRow}>
                  {/* Left time column */}
                  <View style={styles.timeCol}>
                    <Text style={styles.timeMain}>{timeOf(job)}</Text>
                    <Text style={[styles.timeTag, inProgress && { color: colors.info }]}>
                      {bucket === 'done' ? 'Completed' : bucket === 'active' ? 'In Progress' : 'Next Up'}
                    </Text>
                  </View>

                  {/* Details */}
                  <View style={{ flex: 1 }}>
                    <View style={styles.jobHeader}>
                      <Text style={styles.jobTitle} numberOfLines={1}>{job.clientName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.text}</Text>
                      </View>
                    </View>
                    <Text style={styles.jobSub} numberOfLines={1}>{job.concern}</Text>
                    <View style={styles.jobFooter}>
                      <Text style={styles.jobNo}>{job.ticketNo}</Text>
                      {inProgress ? (
                        <Text style={styles.slaText}>SLA: 1h 45m left</Text>
                      ) : job.scheduledDate ? (
                        <Text style={styles.estText}>{job.scheduledDate}</Text>
                      ) : null}
                    </View>

                    {/* Action */}
                    {canAccept ? (
                      <PressableScale style={styles.acceptBtn} onPress={() => acceptTicket(job)}>
                        <Ionicons name="flash" size={13} color="#fff" />
                        <Text style={styles.acceptBtnText}>Accept Ticket</Text>
                      </PressableScale>
                    ) : inProgress ? (
                      <PressableScale style={styles.progressBtn} onPress={() => openTicket(job.id)}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.progressBtnText}>On-Site In Progress • View Logs</Text>
                      </PressableScale>
                    ) : (
                      <View style={styles.doneBtn}>
                        <Ionicons name="checkmark" size={13} color={colors.success} />
                        <Text style={styles.doneBtnText}>Completed</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </AnimatedCard>
          );
        })}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors, spacing, radius, shadow) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  brandBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 54, paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  dutyPill: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  dutyDot: { width: 8, height: 8, borderRadius: 4 },
  dutyLabel: { fontSize: 12, fontWeight: '700' },

  scroll: { padding: 20 },
  techHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
  techInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  dutyIndicator: { position: 'absolute', bottom: -1, right: -1, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: colors.bg },
  greeting: { fontSize: 16, fontWeight: '800', color: colors.text },
  role: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  serviceTag: { backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  serviceTagText: { color: colors.danger, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  countBadge: { backgroundColor: colors.surfaceAlt, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  countBadgeText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },

  chipRow: { gap: 8, paddingBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, marginRight: 8, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  jobCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  jobCardActive: { borderColor: 'rgba(59,130,246,0.4)' },
  jobRow: { flexDirection: 'row', gap: 14 },
  timeCol: { width: 66 },
  timeMain: { fontSize: 13, fontWeight: '800', color: colors.text },
  timeTag: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  jobHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  jobSub: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  jobNo: { fontSize: 11, color: colors.textLight, fontWeight: '600' },
  slaText: { fontSize: 11, color: colors.warning, fontWeight: '700' },
  estText: { fontSize: 11, color: colors.textLight, fontWeight: '600' },

  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EF4444', borderRadius: 10, paddingVertical: 10 },
  acceptBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  progressBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.infoBg, borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)', borderRadius: 10, paddingVertical: 10 },
  pulseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  progressBtnText: { color: colors.info, fontSize: 12, fontWeight: '700' },
  doneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.successBg, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', borderRadius: 10, paddingVertical: 10 },
  doneBtnText: { color: colors.success, fontSize: 12, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 50, gap: 10 },
  emptyText: { fontSize: 14, color: colors.textLight },
});
