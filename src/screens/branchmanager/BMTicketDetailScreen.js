import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { getStatusColor, getStatusBg, getStatusLabel } from '../../utils/ticketUtils';
import { colors, spacing, radius, shadow } from '../../theme';

const FSE_LIST = [{ id: '3', name: 'Juan dela Cruz' }];

export default function BMTicketDetailScreen({ route, navigation }) {
  const { ticketId } = route.params;
  const { user } = useAuth();
  const { getTicket, updateTicket } = useTickets();
  const [selectedFSE, setSelectedFSE] = useState('');
  const [selectedFSEName, setSelectedFSEName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [holdReason, setHoldReason] = useState('');
  const [showFSEModal, setShowFSEModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);

  const ticket = getTicket(ticketId);
  if (!ticket) return <View style={styles.center}><Text>Ticket not found.</Text></View>;

  const update = (status, note, extra = {}) => {
    updateTicket(ticketId, { status, ...extra }, { status, note, by: user.name, at: new Date().toISOString() });
  };

  const approve = () => Alert.alert('Approve Ticket', 'Forward this ticket for technical assessment?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Approve', onPress: () => update('IN_ASSESSMENT', 'Approved by Branch Manager — forwarded for Technical Assessment') },
  ]);

  const escalate = () => Alert.alert('Escalate', 'Escalate this ticket for onsite service?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Escalate', onPress: () => update('ESCALATED', 'Escalated for Onsite Service by Branch Manager') },
  ]);

  const closeRemote = () => Alert.alert('Close Ticket', 'Resolve via phone/remote support?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Close', onPress: () => update('CLOSED', 'Closed via Phone/Remote Support by Branch Manager', { closedBy: user.name }) },
  ]);

  const confirmHold = () => {
    if (!holdReason.trim()) { Alert.alert('Required', 'Please enter a reason.'); return; }
    update('ON_HOLD', `Placed on hold: ${holdReason}`, { onholdReason: holdReason });
    setShowHoldModal(false); setHoldReason('');
  };

  const confirmAssign = () => {
    if (!selectedFSE) { Alert.alert('Required', 'Please select an FSE.'); return; }
    if (!scheduledDate.trim()) { Alert.alert('Required', 'Please enter a schedule date.'); return; }
    update('ASSIGNED_FSE', `Assigned to ${selectedFSEName} · Scheduled ${scheduledDate}`, {
      assignedFSE: selectedFSE, assignedFSEName: selectedFSEName, scheduledDate: scheduledDate.trim(),
    });
    setShowFSEModal(false);
  };

  const canApprove = ticket.status === 'PENDING_ACCOUNTING';
  const canHold = ['PENDING_ACCOUNTING', 'IN_ASSESSMENT', 'ESCALATED'].includes(ticket.status);
  const canEscalate = ticket.status === 'IN_ASSESSMENT';
  const canCloseRemote = ticket.status === 'IN_ASSESSMENT';
  const canAssign = ticket.status === 'ESCALATED';

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
        {ticket.status !== 'CLOSED' && (canApprove || canEscalate || canCloseRemote || canAssign || canHold) && (
          <View style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Available Actions</Text>
            {canApprove && <ActionBtn icon="checkmark-circle" label="Approve for Assessment" color={colors.success} onPress={approve} />}
            {canEscalate && <ActionBtn icon="trending-up" label="Escalate to Onsite" color={colors.info} onPress={escalate} />}
            {canCloseRemote && <ActionBtn icon="call" label="Close — Phone/Remote" color={colors.fse} onPress={closeRemote} />}
            {canAssign && <ActionBtn icon="person-add" label="Schedule & Assign FSE" color={colors.manager} onPress={() => setShowFSEModal(true)} />}
            {canHold && <ActionBtn icon="pause-circle" label="Place on Hold" color={colors.warning} outline onPress={() => setShowHoldModal(true)} />}
          </View>
        )}

        <Card icon="person-outline" title="Client">
          <Row label="Name" value={ticket.clientName} />
          <Row label="Contact" value={ticket.clientContact} />
          <Row label="Address" value={ticket.clientAddress || 'N/A'} />
          <Row label="Channel" value={ticket.channel} last />
        </Card>

        <Card icon="alert-circle-outline" title="Concern">
          <View style={[styles.typeTag, { backgroundColor: colors.purpleBg }]}>
            <Text style={[styles.typeTagText, { color: colors.manager }]}>{ticket.concernType}</Text>
          </View>
          <Text style={styles.concernText}>{ticket.concern}</Text>
          <View style={{ marginTop: spacing.md }}>
            <Row label="Model" value={ticket.productModel || 'N/A'} />
            <Row label="Serial" value={ticket.serialNo || 'N/A'} last />
          </View>
        </Card>

        {ticket.onholdReason && (
          <View style={[styles.banner, { backgroundColor: colors.warningBg }]}>
            <Ionicons name="pause-circle" size={20} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bannerTitle, { color: colors.warning }]}>On Hold</Text>
              <Text style={styles.bannerText}>{ticket.onholdReason}</Text>
            </View>
          </View>
        )}

        {ticket.assignedFSEName && (
          <Card icon="person-add-outline" title="Assignment">
            <Row label="FSE" value={ticket.assignedFSEName} />
            <Row label="Schedule" value={ticket.scheduledDate || 'TBD'} last />
          </Card>
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

      {/* Assign Modal */}
      <Modal visible={showFSEModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Assign FSE & Schedule</Text>
            <Text style={styles.modalLabel}>Select Field Engineer</Text>
            {FSE_LIST.map(fse => {
              const active = selectedFSE === fse.id;
              return (
                <TouchableOpacity key={fse.id} style={[styles.fseRow, active && styles.fseRowActive]} onPress={() => { setSelectedFSE(fse.id); setSelectedFSEName(fse.name); }}>
                  <View style={[styles.fseAvatar, { backgroundColor: active ? colors.manager : colors.border }]}>
                    <Ionicons name="person" size={18} color={active ? '#fff' : colors.textMuted} />
                  </View>
                  <Text style={styles.fseName}>{fse.name}</Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color={colors.manager} />}
                </TouchableOpacity>
              );
            })}
            <Text style={[styles.modalLabel, { marginTop: spacing.md }]}>Schedule Date</Text>
            <TextInput placeholder="e.g. September 20, 2026" placeholderTextColor={colors.textLight} value={scheduledDate} onChangeText={setScheduledDate} style={styles.modalInput} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowFSEModal(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: colors.manager }]} onPress={confirmAssign}><Text style={styles.modalConfirmText}>Assign</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hold Modal */}
      <Modal visible={showHoldModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Place on Hold</Text>
            <Text style={styles.modalLabel}>Reason</Text>
            <TextInput placeholder="Why is this on hold?" placeholderTextColor={colors.textLight} value={holdReason} onChangeText={setHoldReason} multiline style={[styles.modalInput, { minHeight: 80, textAlignVertical: 'top' }]} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowHoldModal(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: colors.warning }]} onPress={confirmHold}><Text style={styles.modalConfirmText}>Confirm Hold</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Card({ icon, title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}><Ionicons name={icon} size={17} color={colors.manager} /><Text style={styles.cardTitle}>{title}</Text></View>
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
  actionsCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm, gap: spacing.sm },
  actionsTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: spacing.lg },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
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
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  bannerTitle: { fontSize: 13, fontWeight: '700' },
  bannerText: { fontSize: 13, color: colors.text, marginTop: 2 },
  timelineItem: { flexDirection: 'row', gap: spacing.md },
  timelineLeft: { alignItems: 'center', width: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  timelineBody: { flex: 1, paddingBottom: spacing.lg },
  timelineNote: { fontSize: 13, color: colors.text, lineHeight: 19 },
  timelineMeta: { fontSize: 11, color: colors.textLight, marginTop: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.xl, paddingBottom: spacing.xxxl },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 19, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  modalLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: spacing.sm },
  fseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  fseRowActive: { borderColor: colors.manager, backgroundColor: colors.purpleBg },
  fseAvatar: { width: 40, height: 40, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  fseName: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  modalInput: { backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, fontSize: 15, color: colors.text },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.bg, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  modalConfirm: { flex: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
