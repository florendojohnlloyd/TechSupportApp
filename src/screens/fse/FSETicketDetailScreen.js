import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { getStatusColor, getStatusBg, getStatusLabel } from '../../utils/ticketUtils';
import { colors, spacing, radius, shadow } from '../../theme';

const ACCENT = colors.fse;

export default function FSETicketDetailScreen({ route, navigation }) {
  const { ticketId } = route.params;
  const { user } = useAuth();
  const { getTicket, updateTicket } = useTickets();
  const [serviceNote, setServiceNote] = useState('');
  const [pendingReason, setPendingReason] = useState('');

  const ticket = getTicket(ticketId);
  if (!ticket) return <View style={styles.center}><Text>Ticket not found.</Text></View>;

  const update = (status, note, extra = {}) => {
    updateTicket(ticketId, { status, ...extra }, { status, note, by: user.name, at: new Date().toISOString() });
  };

  const startOnsite = () => Alert.alert('Start Onsite', 'Begin onsite service for this ticket?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Start', onPress: () => update('ONSITE', `${user.name} started onsite service`) },
  ]);

  const serviceDone = () => {
    if (!serviceNote.trim()) { Alert.alert('Required', 'Please add your service findings.'); return; }
    Alert.alert('Complete Service', 'Mark this ticket as done?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mark Done', onPress: () => update('CLOSED', `Service completed. Findings: ${serviceNote}`, { closedBy: user.name, serviceFindings: serviceNote }) },
    ]);
  };

  const servicePending = () => {
    if (!pendingReason.trim()) { Alert.alert('Required', 'Please describe why it is pending.'); return; }
    update('SERVICE_PENDING', `Service pending: ${pendingReason}`, { pendingReason });
    setPendingReason('');
  };

  const isAssigned = ticket.status === 'ASSIGNED_FSE';
  const isOnsite = ticket.status === 'ONSITE';
  const isPending = ticket.status === 'SERVICE_PENDING';
  const isClosed = ticket.status === 'CLOSED';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: getStatusColor(ticket.status) }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>{getStatusLabel(ticket.status)}</Text></View>
        </View>
        <Text style={styles.headerTicketNo}>{ticket.ticketNo}</Text>
        <Text style={styles.headerClient}>{ticket.clientName}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {ticket.scheduledDate && !isClosed && (
          <View style={[styles.banner, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.primary }]}>Scheduled Visit</Text>
              <Text style={styles.bannerText}>{ticket.scheduledDate}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        {!isClosed && (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Service Actions</Text>
            {isAssigned && <ActionBtn icon="car" label="Start Onsite Service" color={colors.info} onPress={startOnsite} />}
            {(isOnsite || isPending) && (
              <>
                <Text style={styles.inputLabel}>Service Notes / Findings</Text>
                <TextInput placeholder="What did you find & fix?" placeholderTextColor={colors.textLight} value={serviceNote} onChangeText={setServiceNote} multiline style={styles.input} />
                <ActionBtn icon="checkmark-circle" label="Mark as Service Done" color={colors.success} onPress={serviceDone} />
              </>
            )}
            {isOnsite && (
              <>
                <View style={styles.divider}><Text style={styles.dividerText}>OR</Text></View>
                <Text style={styles.inputLabel}>Reason for Pending</Text>
                <TextInput placeholder="Why can't it be completed today?" placeholderTextColor={colors.textLight} value={pendingReason} onChangeText={setPendingReason} multiline style={styles.input} />
                <ActionBtn icon="hourglass" label="Mark as Service Pending" color={colors.warning} outline onPress={servicePending} />
              </>
            )}
          </View>
        )}

        <Card icon="person-outline" title="Client">
          <Row label="Name" value={ticket.clientName} />
          <Row label="Contact" value={ticket.clientContact} />
          <Row label="Address" value={ticket.clientAddress || 'N/A'} last />
        </Card>

        <Card icon="alert-circle-outline" title="Concern">
          <View style={[styles.typeTag, { backgroundColor: colors.successBg }]}>
            <Text style={[styles.typeTagText, { color: ACCENT }]}>{ticket.concernType}</Text>
          </View>
          <Text style={styles.concernText}>{ticket.concern}</Text>
          <View style={{ marginTop: spacing.md }}>
            <Row label="Model" value={ticket.productModel || 'N/A'} />
            <Row label="Serial" value={ticket.serialNo || 'N/A'} last />
          </View>
        </Card>

        {ticket.pendingReason && (
          <View style={[styles.banner, { backgroundColor: colors.warningBg }]}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.warning }]}>Pending Reason</Text>
              <Text style={styles.bannerText}>{ticket.pendingReason}</Text>
            </View>
          </View>
        )}

        {isClosed && ticket.serviceFindings && (
          <View style={[styles.banner, { backgroundColor: colors.successBg }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.success }]}>Service Findings</Text>
              <Text style={styles.bannerText}>{ticket.serviceFindings}</Text>
            </View>
          </View>
        )}

        <Card icon="time-outline" title="Activity Timeline">
          {(ticket.history || []).slice().reverse().map((h, i, arr) => (
            <View key={i} style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: getStatusColor(h.status) }]} />
                {i < arr.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineBody}>
                <Text style={styles.timelineNote}>{h.note}</Text>
                <Text style={styles.timelineMeta}>{h.by} · {h.at ? new Date(h.at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</Text>
              </View>
            </View>
          ))}
        </Card>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Card({ icon, title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}><Ionicons name={icon} size={17} color={ACCENT} /><Text style={styles.cardTitle}>{title}</Text></View>
      {children}
    </View>
  );
}
function Row({ label, value, last }) {
  return <View style={[styles.row, !last && styles.rowBorder]}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}
function ActionBtn({ icon, label, color, outline, onPress }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, outline ? { backgroundColor: color + '18' } : { backgroundColor: color }]} onPress={onPress} activeOpacity={0.85}>
      <Ionicons name={icon} size={19} color={outline ? color : '#fff'} />
      <Text style={[styles.actionBtnText, { color: outline ? color : '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: 54, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center' },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  headerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  headerTicketNo: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  headerClient: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
  scroll: { padding: spacing.lg },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  bannerTitle: { fontSize: 13, fontWeight: '700' },
  bannerText: { fontSize: 13, color: colors.text, marginTop: 2, lineHeight: 19 },
  actionsCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm },
  actionsTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  input: { backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, fontSize: 14, minHeight: 70, textAlignVertical: 'top', color: colors.text, marginBottom: spacing.md },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radius.md, paddingVertical: 14 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  divider: { alignItems: 'center', marginVertical: spacing.sm },
  dividerText: { fontSize: 11, fontWeight: '700', color: colors.textLight, letterSpacing: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 13, color: colors.textMuted },
  rowValue: { fontSize: 13, color: colors.text, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: spacing.md },
  typeTag: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.full, marginBottom: spacing.md },
  typeTagText: { fontSize: 12, fontWeight: '700' },
  concernText: { fontSize: 14, color: colors.text, lineHeight: 21 },
  timelineItem: { flexDirection: 'row', gap: spacing.md },
  timelineLeft: { alignItems: 'center', width: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  timelineBody: { flex: 1, paddingBottom: spacing.lg },
  timelineNote: { fontSize: 13, color: colors.text, lineHeight: 19 },
  timelineMeta: { fontSize: 11, color: colors.textLight, marginTop: 3 },
});
