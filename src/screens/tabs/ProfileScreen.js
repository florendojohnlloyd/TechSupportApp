import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AnimatedCard, PressableScale } from '../../components/Animated';
import { getRoleConfig } from './roleConfig';

export default function ProfileScreen() {
  const { colors, spacing, radius, shadow, isDark, toggleTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const cfg = getRoleConfig(user?.role, colors);
  const styles = React.useMemo(() => makeStyles(colors, spacing, radius, shadow, cfg.accent), [colors, cfg.accent]);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const openEdit = () => {
    setForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    setEditing(true);
  };

  const save = () => {
    if (!form.name.trim()) { Alert.alert('Required', 'Name cannot be empty.'); return; }
    updateProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
    setEditing(false);
    Alert.alert('Saved', 'Your profile has been updated.');
  };

  const doLogout = () => {
    Alert.alert('Log Out', `Sign out of ${user?.name}'s account?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={cfg.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <AnimatedCard index={0}>
          <View style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: cfg.accent }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.rolePill}>
              <Text style={[styles.rolePillText, { color: cfg.accent }]}>{cfg.title}</Text>
            </View>
            <PressableScale style={[styles.editBtn, { borderColor: cfg.accent }]} onPress={openEdit}>
              <Ionicons name="create-outline" size={16} color={cfg.accent} />
              <Text style={[styles.editBtnText, { color: cfg.accent }]}>Edit Profile</Text>
            </PressableScale>
          </View>
        </AnimatedCard>

        {/* Account */}
        <Text style={styles.section}>Account</Text>
        <AnimatedCard index={1}>
          <Row styles={styles} colors={colors} icon="person-outline" iconBg={cfg.accent} title="Account Settings" sub="Manage your account details" onPress={openEdit} />
          <Row styles={styles} colors={colors} icon="call-outline" iconBg={colors.info} title="Phone" sub={user?.phone || 'Not set'} onPress={openEdit} />
        </AnimatedCard>

        {/* Preferences */}
        <Text style={styles.section}>Application</Text>
        <View style={styles.rowCard}>
          <View style={styles.rowLeft}>
            <View style={[styles.rowIcon, { backgroundColor: colors.purpleBg }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.purple} />
            </View>
            <View>
              <Text style={styles.rowTitle}>Theme</Text>
              <Text style={styles.rowSub}>{isDark ? 'Dark' : 'Light'}</Text>
            </View>
          </View>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: cfg.accent }} thumbColor="#fff" />
        </View>
        <AnimatedCard index={2}>
          <Row styles={styles} colors={colors} icon="notifications-outline" iconBg={colors.warning} title="Notification Settings" sub="Customize your notifications" onPress={() => Alert.alert('Notifications', 'Notification preferences coming soon.')} />
          <Row styles={styles} colors={colors} icon="help-circle-outline" iconBg={colors.success} title="Help & Support" sub="FAQs and contact information" onPress={() => Alert.alert('Help & Support', 'Contact your IT administrator for assistance.')} />
          <Row styles={styles} colors={colors} icon="information-circle-outline" iconBg={colors.info} title="About" sub="App version 1.0.0" onPress={() => Alert.alert('About', 'TechSupport v1.0.0')} last />
        </AnimatedCard>

        {/* Logout */}
        <PressableScale style={styles.logoutBtn} onPress={doLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </PressableScale>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={editing} transparent animationType="slide" onRequestClose={() => setEditing(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setEditing(false)} />
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditing(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Field styles={styles} colors={colors} label="Full Name" icon="person-outline" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Your name" />
            <Field styles={styles} colors={colors} label="Email" icon="mail-outline" value={form.email} onChangeText={v => setForm(p => ({ ...p, email: v }))} placeholder="you@example.com" keyboardType="email-address" />
            <Field styles={styles} colors={colors} label="Phone" icon="call-outline" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} placeholder="09XX XXX XXXX" keyboardType="phone-pad" />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: cfg.accent }]} onPress={save}>
                <Ionicons name="checkmark" size={17} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 16 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ styles, colors, icon, iconBg, title, sub, onPress, last }) {
  return (
    <TouchableOpacity style={[styles.rowCard, last && { marginBottom: 0 }]} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, { backgroundColor: iconBg + '22' }]}>
          <Ionicons name={icon} size={18} color={iconBg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

function Field({ styles, colors, label, icon, value, onChangeText, placeholder, keyboardType }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        <Ionicons name={icon} size={13} color={colors.textMuted} /> {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        style={styles.fieldInput}
      />
    </View>
  );
}

const makeStyles = (colors, spacing, radius, shadow, accent) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: 54, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  scroll: { padding: spacing.lg },

  profileCard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  avatar: { width: 84, height: 84, borderRadius: radius.full, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 30 },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  email: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  rolePill: { backgroundColor: colors.surfaceAlt, paddingHorizontal: spacing.md, paddingVertical: 5, borderRadius: radius.full, marginTop: spacing.sm },
  rolePillText: { fontSize: 12, fontWeight: '700' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: 8, marginTop: spacing.lg },
  editBtnText: { fontSize: 14, fontWeight: '700' },

  section: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.xl, marginBottom: spacing.sm },
  rowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, ...shadow.sm },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  rowIcon: { width: 40, height: 40, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.dangerBg, borderRadius: radius.lg, paddingVertical: 15, marginTop: spacing.xl, borderWidth: 1, borderColor: colors.danger + '55' },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.xl, paddingBottom: 30 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  fieldInput: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, color: colors.text },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: 14, borderRadius: radius.md },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
