import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTickets } from '../../context/TicketContext';
import { colors, spacing, radius, shadow } from '../../theme';

const CHANNELS = [
  { label: 'Support Hotline', icon: 'call' },
  { label: 'SMS/PMS', icon: 'chatbox' },
  { label: 'AE/Sales', icon: 'people' },
  { label: 'Delivery', icon: 'cube' },
];
const CONCERN_TYPES = ['Hardware Issue', 'Software Issue', 'Network Problem', 'Installation', 'Maintenance', 'Others'];

export default function CreateTicketScreen({ navigation }) {
  const { user } = useAuth();
  const { addTicket } = useTickets();
  const [form, setForm] = useState({
    clientName: '', clientContact: '', clientAddress: '',
    channel: 'Support Hotline', concernType: 'Hardware Issue',
    concern: '', serialNo: '', productModel: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.clientName.trim()) e.clientName = 'Required';
    if (!form.clientContact.trim()) e.clientContact = 'Required';
    if (!form.concern.trim()) e.concern = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const genTicketNo = () => {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `TKT-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.floor(Math.random() * 9000 + 1000)}`;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setLoading(true);
    const ticket = addTicket({
      ticketNo: genTicketNo(),
      clientName: form.clientName.trim(),
      clientContact: form.clientContact.trim(),
      clientAddress: form.clientAddress.trim(),
      channel: form.channel,
      concernType: form.concernType,
      concern: form.concern.trim(),
      serialNo: form.serialNo.trim(),
      productModel: form.productModel.trim(),
      status: 'PENDING_ACCOUNTING',
      createdByName: user.name,
      assignedFSE: null, assignedFSEName: null, scheduledDate: null,
    });
    setLoading(false);
    Alert.alert('Ticket Created', `${ticket.ticketNo} has been submitted for approval.`, [
      { text: 'Done', onPress: () => navigation.goBack() },
    ]);
  };

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: null }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Ticket</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Client */}
        <Section icon="person-circle-outline" title="Client Information">
          <Field label="Client Name" value={form.clientName} onChangeText={v => set('clientName', v)} error={errors.clientName} placeholder="e.g. ABC Corporation" />
          <Field label="Contact Number" value={form.clientContact} onChangeText={v => set('clientContact', v)} error={errors.clientContact} placeholder="09XX XXX XXXX" keyboardType="phone-pad" />
          <Field label="Address" value={form.clientAddress} onChangeText={v => set('clientAddress', v)} placeholder="Complete address" multiline />
        </Section>

        {/* Channel */}
        <Section icon="git-network-outline" title="Source Channel">
          <View style={styles.channelGrid}>
            {CHANNELS.map(ch => {
              const active = form.channel === ch.label;
              return (
                <TouchableOpacity key={ch.label} style={[styles.channelBtn, active && styles.channelBtnActive]} onPress={() => set('channel', ch.label)}>
                  <Ionicons name={ch.icon} size={18} color={active ? '#fff' : colors.textMuted} />
                  <Text style={[styles.channelText, active && styles.channelTextActive]}>{ch.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* Equipment */}
        <Section icon="hardware-chip-outline" title="Equipment Details">
          <Field label="Product Model" value={form.productModel} onChangeText={v => set('productModel', v)} placeholder="e.g. HP LaserJet Pro" />
          <Field label="Serial Number" value={form.serialNo} onChangeText={v => set('serialNo', v)} placeholder="e.g. PHBBJ12345" />
        </Section>

        {/* Concern */}
        <Section icon="alert-circle-outline" title="Concern Details">
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.typeGrid}>
            {CONCERN_TYPES.map(ct => {
              const active = form.concernType === ct;
              return (
                <TouchableOpacity key={ct} style={[styles.typeChip, active && styles.typeChipActive]} onPress={() => set('concernType', ct)}>
                  <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{ct}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Field label="Description" value={form.concern} onChangeText={v => set('concern', v)} error={errors.concern} placeholder="Describe the concern in detail..." multiline tall />
        </Section>

        <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.submitText}>{loading ? 'Creating...' : 'Create Ticket'}</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Section({ icon, title, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Field({ label, error, multiline, tall, ...props }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      </View>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldMultiline, tall && { height: 100 }, error && styles.fieldInputError]}
        placeholderTextColor={colors.textLight}
        multiline={multiline}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    backgroundColor: colors.primary, paddingTop: 54, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.18)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { padding: spacing.lg },
  section: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, ...shadow.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  fieldError: { fontSize: 12, color: colors.danger, fontWeight: '600' },
  fieldInput: {
    backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.text,
  },
  fieldInputError: { borderColor: colors.danger },
  fieldMultiline: { textAlignVertical: 'top', minHeight: 60 },
  channelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  channelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, width: '47%',
    backgroundColor: colors.bg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    paddingVertical: 12, paddingHorizontal: spacing.md,
  },
  channelBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  channelText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  channelTextActive: { color: '#fff', fontWeight: '600' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  typeChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  typeChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  typeChipText: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  typeChipTextActive: { color: colors.primaryDark, fontWeight: '700' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, ...shadow.md,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
