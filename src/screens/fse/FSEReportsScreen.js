import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { getStatusColor, getStatusLabel } from '../../utils/ticketUtils';
import { colors, spacing, radius, shadow } from '../../theme';

const ACCENT = colors.fse;

const REPORT_TYPES = [
  { key: 'service_summary', label: 'Service Summary', icon: 'clipboard-outline', desc: 'Summary of all service activities' },
  { key: 'pending_report', label: 'Pending Services', icon: 'hourglass-outline', desc: 'List of all pending service tickets' },
  { key: 'completion_report', label: 'Completion Report', icon: 'checkmark-circle-outline', desc: 'Completed services with findings' },
  { key: 'onsite_report', label: 'Onsite Report', icon: 'car-outline', desc: 'Onsite visit history and details' },
];

const MONTHS = [
  'All Time', 'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
];

export default function FSEReportsScreen({ navigation }) {
  const { user } = useAuth();
  const { getTicketsByFSE } = useTickets();
  const myTickets = getTicketsByFSE(user?.uid);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('All Time');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequests, setSubmittedRequests] = useState([]);

  // --- Stats ---
  const stats = {
    total: myTickets.length,
    assigned: myTickets.filter(t => t.status === 'ASSIGNED_FSE').length,
    onsite: myTickets.filter(t => t.status === 'ONSITE').length,
    pending: myTickets.filter(t => t.status === 'SERVICE_PENDING').length,
    done: myTickets.filter(t => t.status === 'CLOSED').length,
  };

  const completionRate = stats.total > 0
    ? Math.round((stats.done / stats.total) * 100)
    : 0;

  // --- Monthly breakdown ---
  const monthlyData = MONTHS.slice(1).map((month, idx) => {
    const monthIndex = idx + 1;
    const monthTickets = myTickets.filter(t => {
      const d = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
      return d.getMonth() + 1 === monthIndex;
    });
    return {
      month: month.substring(0, 3),
      total: monthTickets.length,
      done: monthTickets.filter(t => t.status === 'CLOSED').length,
      pending: monthTickets.filter(t => t.status === 'SERVICE_PENDING').length,
    };
  }).filter(m => m.total > 0);

  // --- Recent closed tickets ---
  const recentClosed = myTickets
    .filter(t => t.status === 'CLOSED')
    .slice(0, 5);

  const openRequestModal = (reportType) => {
    setSelectedReportType(reportType);
    setSelectedMonth('All Time');
    setRemarks('');
    setShowRequestModal(true);
  };

  const submitRequest = () => {
    if (!selectedReportType) return;
    setSubmitting(true);
    setTimeout(() => {
      const newRequest = {
        id: `req_${Date.now()}`,
        type: selectedReportType.label,
        month: selectedMonth,
        remarks: remarks.trim(),
        requestedBy: user?.name,
        requestedAt: new Date().toLocaleString('en-PH', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        }),
        status: 'SUBMITTED',
      };
      setSubmittedRequests(prev => [newRequest, ...prev]);
      setSubmitting(false);
      setShowRequestModal(false);
      Alert.alert(
        '✅ Request Submitted',
        `Your ${selectedReportType.label} has been submitted for processing. You will be notified once it is ready.`,
        [{ text: 'OK' }]
      );
    }, 1000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Reports</Text>
          <View style={{ width: 42 }} />
        </View>
        <Text style={styles.headerSub}>{user?.name} · Field Engineer</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Overall Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>📊 Performance Overview</Text>
          <View style={styles.statsRow}>
            <BigStat label="Total" value={stats.total} color={colors.primary} />
            <BigStat label="Done" value={stats.done} color={colors.success} />
            <BigStat label="Pending" value={stats.pending} color={colors.warning} />
            <BigStat label="Active" value={stats.assigned + stats.onsite} color={colors.info} />
          </View>

          {/* Completion Bar */}
          <View style={styles.completionSection}>
            <View style={styles.completionLabelRow}>
              <Text style={styles.completionLabel}>Completion Rate</Text>
              <Text style={[styles.completionPct, { color: completionRate >= 70 ? colors.success : colors.warning }]}>
                {completionRate}%
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[
                styles.progressFill,
                {
                  width: `${completionRate}%`,
                  backgroundColor: completionRate >= 70 ? colors.success : colors.warning
                }
              ]} />
            </View>
          </View>
        </View>

        {/* Monthly Breakdown */}
        {monthlyData.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📅 Monthly Breakdown</Text>
            {monthlyData.map((m, i) => (
              <View key={i} style={styles.monthRow}>
                <Text style={styles.monthLabel}>{m.month}</Text>
                <View style={styles.monthBarContainer}>
                  <View style={[styles.monthBar, { width: `${Math.min((m.done / Math.max(m.total, 1)) * 100, 100)}%`, backgroundColor: colors.success }]} />
                </View>
                <View style={styles.monthStats}>
                  <Text style={[styles.monthStat, { color: colors.success }]}>{m.done} done</Text>
                  {m.pending > 0 && <Text style={[styles.monthStat, { color: colors.warning }]}>{m.pending} pending</Text>}
                </View>
              </View>
            ))}
            {monthlyData.length === 0 && (
              <Text style={styles.noData}>No data available yet</Text>
            )}
          </View>
        )}

        {/* Recent Completed */}
        {recentClosed.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>✅ Recent Completed</Text>
            {recentClosed.map((t, i) => (
              <View key={i} style={[styles.recentRow, i < recentClosed.length - 1 && styles.recentRowBorder]}>
                <View style={styles.recentLeft}>
                  <Text style={styles.recentTicketNo}>{t.ticketNo}</Text>
                  <Text style={styles.recentClient}>{t.clientName}</Text>
                </View>
                <View style={styles.recentRight}>
                  <View style={[styles.donePill, { backgroundColor: colors.successBg }]}>
                    <Text style={[styles.donePillText, { color: colors.success }]}>Done</Text>
                  </View>
                  {t.closedBy && (
                    <Text style={styles.recentMeta}>by {t.closedBy}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Request Report */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>📄 Request a Report</Text>
          <Text style={styles.requestSubtitle}>
            Select a report type to request. Reports will be processed and sent to your supervisor.
          </Text>
          {REPORT_TYPES.map(rt => (
            <TouchableOpacity
              key={rt.key}
              style={styles.reportTypeRow}
              onPress={() => openRequestModal(rt)}
              activeOpacity={0.75}
            >
              <View style={[styles.reportTypeIcon, { backgroundColor: ACCENT + '18' }]}>
                <Ionicons name={rt.icon} size={22} color={ACCENT} />
              </View>
              <View style={styles.reportTypeInfo}>
                <Text style={styles.reportTypeLabel}>{rt.label}</Text>
                <Text style={styles.reportTypeDesc}>{rt.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Submitted Requests */}
        {submittedRequests.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📬 Submitted Requests</Text>
            {submittedRequests.map((req, i) => (
              <View key={req.id} style={[styles.submittedRow, i < submittedRequests.length - 1 && styles.recentRowBorder]}>
                <View style={styles.submittedLeft}>
                  <Text style={styles.submittedType}>{req.type}</Text>
                  <Text style={styles.submittedMeta}>
                    {req.month !== 'All Time' ? `${req.month} · ` : ''}{req.requestedAt}
                  </Text>
                  {req.remarks ? <Text style={styles.submittedRemarks}>"{req.remarks}"</Text> : null}
                </View>
                <View style={[styles.submittedBadge, { backgroundColor: colors.infoBg }]}>
                  <Text style={[styles.submittedBadgeText, { color: colors.info }]}>Submitted</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Request Modal */}
      <Modal visible={showRequestModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Request Report</Text>

            {selectedReportType && (
              <View style={styles.selectedTypeBox}>
                <View style={[styles.reportTypeIcon, { backgroundColor: ACCENT + '18' }]}>
                  <Ionicons name={selectedReportType.icon} size={22} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedTypeLabel}>{selectedReportType.label}</Text>
                  <Text style={styles.selectedTypeDesc}>{selectedReportType.desc}</Text>
                </View>
              </View>
            )}

            {/* Month */}
            <Text style={styles.modalLabel}>Period / Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
              {MONTHS.map(m => {
                const active = selectedMonth === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.monthPill, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}
                    onPress={() => setSelectedMonth(m)}
                  >
                    <Text style={[styles.monthPillText, active && { color: '#fff', fontWeight: '700' }]}>
                      {m === 'All Time' ? 'All Time' : m.substring(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Remarks */}
            <Text style={styles.modalLabel}>Additional Remarks (optional)</Text>
            <TextInput
              placeholder="Any specific notes or instructions..."
              placeholderTextColor={colors.textLight}
              value={remarks}
              onChangeText={setRemarks}
              multiline
              style={styles.remarksInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowRequestModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                onPress={submitRequest}
                disabled={submitting}
              >
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function BigStat({ label, value, color }) {
  return (
    <View style={styles.bigStat}>
      <Text style={[styles.bigStatValue, { color }]}>{value}</Text>
      <Text style={styles.bigStatLabel}>{label}</Text>
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
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.xs,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  scroll: { padding: spacing.lg },
  statsCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.md,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  bigStat: {
    flex: 1, alignItems: 'center', backgroundColor: colors.bg,
    borderRadius: radius.md, padding: spacing.md,
  },
  bigStatValue: { fontSize: 26, fontWeight: '800' },
  bigStatLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  completionSection: {},
  completionLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  completionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  completionPct: { fontSize: 15, fontWeight: '800' },
  progressBg: {
    height: 10, backgroundColor: colors.border,
    borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm,
  },
  monthRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, marginBottom: spacing.md,
  },
  monthLabel: { width: 32, fontSize: 12, fontWeight: '700', color: colors.textMuted },
  monthBarContainer: {
    flex: 1, height: 8, backgroundColor: colors.border,
    borderRadius: radius.full, overflow: 'hidden',
  },
  monthBar: { height: '100%', borderRadius: radius.full },
  monthStats: { flexDirection: 'row', gap: spacing.sm, width: 110, justifyContent: 'flex-end' },
  monthStat: { fontSize: 11, fontWeight: '600' },
  noData: { fontSize: 13, color: colors.textLight, textAlign: 'center', paddingVertical: spacing.md },
  recentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  recentRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  recentLeft: { flex: 1 },
  recentTicketNo: { fontSize: 12, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.3 },
  recentClient: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 2 },
  recentRight: { alignItems: 'flex-end', gap: 4 },
  donePill: {
    paddingHorizontal: spacing.md, paddingVertical: 4,
    borderRadius: radius.full,
  },
  donePillText: { fontSize: 11, fontWeight: '700' },
  recentMeta: { fontSize: 11, color: colors.textLight },
  requestSubtitle: {
    fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 19,
  },
  reportTypeRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  reportTypeIcon: {
    width: 46, height: 46, borderRadius: radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  reportTypeInfo: { flex: 1 },
  reportTypeLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  reportTypeDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  submittedRow: { paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  submittedLeft: { flex: 1 },
  submittedType: { fontSize: 14, fontWeight: '700', color: colors.text },
  submittedMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  submittedRemarks: { fontSize: 12, color: colors.textLight, fontStyle: 'italic', marginTop: 2 },
  submittedBadge: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  submittedBadgeText: { fontSize: 11, fontWeight: '700' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    padding: spacing.xl, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  selectedTypeBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.bg, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1.5, borderColor: ACCENT,
  },
  selectedTypeLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  selectedTypeDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  modalLabel: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: spacing.sm, marginTop: spacing.md,
  },
  monthScroll: { marginBottom: spacing.md },
  monthPill: {
    paddingHorizontal: spacing.lg, paddingVertical: 8,
    borderRadius: radius.full, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.bg,
    marginRight: spacing.sm,
  },
  monthPillText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  remarksInput: {
    backgroundColor: colors.bg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, fontSize: 14, color: colors.text,
    minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: radius.md,
    backgroundColor: colors.bg, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  submitBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: 14, borderRadius: radius.md,
    backgroundColor: ACCENT,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
