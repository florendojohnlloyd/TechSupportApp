import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { useTheme } from '../../context/ThemeContext';
import { getStatusColor, getStatusLabel } from '../../utils/ticketUtils';
import { AnimatedCard, PressableScale } from '../../components/Animated';

export default function TicketDetailScreen({ route, navigation }) {
  const { colors, spacing, radius, shadow } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, spacing, radius, shadow), [colors]);

  const { ticketId } = route.params;
  const { user } = useAuth();
  const { getTicket, updateTicket } = useTickets();
  const [note, setNote] = useState('');
  const ticket = getTicket(ticketId);

  if (!ticket) return <View style={styles.center}><Text style={{ color: colors.text }}>Ticket not found.</Text></View>;

  const addNote = () => {
    if (!note.trim()) return;
    updateTicket(ticketId, {}, { status: ticket.status, note: note.trim(), by: user.name, at: new Date().toISOString() });
    setNote('');
  };

  const closeTicket = () => {
    Alert.alert('Close Ticket', 'Mark this as resolved via phone/remote support?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close Ticket', style: 'destructive', onPress: () => {
          updateTicket(ticketId, { status: 'CLOSED', closedBy: user.name },
            { status: 'CLOSED', note: 'Closed by Support Hotline (phone/remote)', by: user.name, at: new Date().toISOString() });
          navigation.goBack();
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[getStatusColor(ticket.status), getStatusColor(ticket.status) + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{getStatusLabel(ticket.status)}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.popToTop()} style={styles.homeBtn}>
              <Ionicons name="home" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerTicketNo}>{ticket.ticketNo}</Text>
        <Text style={styles.headerClient}>{ticket.clientName}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <AnimatedCard index={0}>
          <Card styles={styles} colors={colors} icon="person-outline" title="Client">
            <Row styles={styles} label="Name" value={ticket.clientName} />
            <Row styles={styles} label="Contact" value={ticket.clientContact} />
            <Row styles={styles} label="Address" value={ticket.clientAddress || 'N/A'} />
            <Row styles={styles} label="Channel" value={ticket.channel} last />
          </Card>
        </AnimatedCard>

        <AnimatedCard index={1}>
          <Card styles={styles} colors={colors} icon="hardware-chip-outline" title="Equipment">
            <Row styles={styles} label="Model" value={ticket.productModel || 'N/A'} />
            <Row styles={styles} label="Serial" value={ticket.serialNo || 'N/A'} last />
          </Card>
        </AnimatedCard>

        <AnimatedCard index={2}>
          <Card styles={styles} colors={colors} icon="alert-circle-outline" title="Concern">
            <View style={[styles.typeTag, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.typeTagText, { color: colors.primary }]}>{ticket.concernType}</Text>
            </View>
            <Text style={styles.concernText}>{ticket.concern}</Text>
          </Card>
        </AnimatedCard>

        {ticket.assignedFSEName && (
          <AnimatedCard index={3}>
            <Card styles={styles} colors={colors} icon="person-add-outline" title="Assignment">
              <Row styles={styles} label="FSE" value={ticket.assignedFSEName} />
              <Row styles={styles} label="Schedule" value={ticket.scheduledDate || 'TBD'} last />
            </Card>
          </AnimatedCard>
        )}

        <AnimatedCard index={4}>
          <Card styles={styles} colors={colors} icon="time-outline" title="Activity Timeline">
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
        </AnimatedCard>

        {ticket.status !== 'CLOSED' && (
          <AnimatedCard index={5}>
            <Card styles={styles} colors={colors} icon="create-outline" title="Add Note">
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Write an update..."
                placeholderTextColor={colors.textLight}
                multiline
                style={styles.noteInput}
              />
              <TouchableOpacity style={[styles.noteBtn, !note.trim() && { opacity: 0.5 }]} onPress={addNote} disabled={!note.trim()}>
                <Text style={styles.noteBtnText}>Add Note</Text>
              </TouchableOpacity>
            </Card>
          </AnimatedCard>
        )}

        {ticket.status !== 'CLOSED' && (
          <PressableScale style={styles.closeBtn} onPress={closeTicket}>
            <Ionicons name="checkmark-done" size={20} color={colors.success} />
            <Text style={styles.closeBtnText}>Close Ticket (Phone/Remote Done)</Text>
          </PressableScale>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Card({ styles, colors, icon, title, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon} size={17} color={colors.primary} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ styles, label, value, last }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors, spacing, radius, shadow) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  header: { paddingTop: 54, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, borderBottomLeftRadius: radius.xxl, borderBottomRightRadius: radius.xxl },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  backBtn: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  homeBtn: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center' },
  headerBadge: { backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full },
  headerBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  headerTicketNo: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  headerClient: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
  scroll: { padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
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
  noteInput: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, fontSize: 14, minHeight: 70, textAlignVertical: 'top', color: colors.text, marginBottom: spacing.md },
  noteBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center' },
  noteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  closeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.successBg, borderRadius: radius.md, paddingVertical: 15 },
  closeBtnText: { color: colors.success, fontWeight: '700', fontSize: 14 },
});
