import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing, interpolate,
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DRAWER_WIDTH = 300;

/**
 * SideDrawer — slide-in navigation drawer opened by a hamburger.
 * Props:
 *   visible (bool), onClose (fn), roleLabel (string), accent (color),
 *   headerGradient ([c1,c2])
 */
export default function SideDrawer({ visible, onClose, roleLabel = '', accent, headerGradient }) {
  const { colors, spacing, radius, shadow, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const styles = React.useMemo(() => makeStyles(colors, spacing, radius, shadow), [colors]);

  const [showSettings, setShowSettings] = useState(false);
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) });
    }
  }, [visible]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-DRAWER_WIDTH, 0]) }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const acc = accent || colors.primary;
  const grad = headerGradient || colors.gradientHeader;
  const initials = (user?.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const doLogout = () => {
    onClose?.();
    Alert.alert('Log Out', `Sign out of ${user?.name}'s account?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const roleTitle = { support: 'Support Desk', branch_manager: 'Branch Manager', fse: 'Field Engineer' }[user?.role] || roleLabel;

  if (!mounted && !visible) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* Panel */}
        <Animated.View style={[styles.panel, panelStyle]}>
          {/* Profile header */}
          <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.role}>{roleTitle}</Text>
          </LinearGradient>

          {/* Menu */}
          <View style={styles.menu}>
            <DrawerItem styles={styles} colors={colors} icon="home-outline" label="Dashboard" onPress={onClose} />
            <DrawerItem
              styles={styles} colors={colors}
              icon="settings-outline" label="Settings"
              onPress={() => setShowSettings(true)}
            />
            <View style={styles.themeRow}>
              <View style={styles.itemLeft}>
                <View style={[styles.itemIcon, { backgroundColor: colors.surfaceAlt }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={acc} />
                </View>
                <Text style={styles.itemLabel}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: acc }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={{ flex: 1 }} />

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={doLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
          <Text style={styles.version}>TechSupport v1.0.0</Text>
        </Animated.View>
      </View>

      {/* Settings sub-sheet */}
      <Modal visible={showSettings} transparent animationType="slide" onRequestClose={() => setShowSettings(false)}>
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsCard}>
            <View style={styles.settingsHandle} />
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.settingsSection}>Appearance</Text>
            <View style={styles.settingRow}>
              <View style={styles.itemLeft}>
                <View style={[styles.itemIcon, { backgroundColor: colors.surfaceAlt }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={acc} />
                </View>
                <View>
                  <Text style={styles.itemLabel}>Dark Mode</Text>
                  <Text style={styles.settingHint}>{isDark ? 'On' : 'Off'}</Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: acc }}
                thumbColor="#fff"
              />
            </View>

            <Text style={styles.settingsSection}>Account</Text>
            <SettingStatic styles={styles} colors={colors} icon="person-outline" label="Name" value={user?.name} />
            <SettingStatic styles={styles} colors={colors} icon="mail-outline" label="Email" value={user?.email || '—'} />
            <SettingStatic styles={styles} colors={colors} icon="shield-checkmark-outline" label="Role" value={roleTitle} />

            <TouchableOpacity style={[styles.logoutBtn, { marginTop: spacing.xl }]} onPress={() => { setShowSettings(false); doLogout(); }} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

function DrawerItem({ styles, colors, icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.itemLeft}>
        <View style={[styles.itemIcon, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name={icon} size={18} color={colors.textMuted} />
        </View>
        <Text style={styles.itemLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

function SettingStatic({ styles, colors, icon, label, value }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.itemLeft}>
        <View style={[styles.itemIcon, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name={icon} size={18} color={colors.textMuted} />
        </View>
        <View>
          <Text style={styles.settingHint}>{label}</Text>
          <Text style={styles.itemLabel}>{value}</Text>
        </View>
      </View>
    </View>
  );
}

/** Reusable hamburger button — place in a header. */
export function HamburgerButton({ onPress, color = '#fff', style }) {
  return (
    <TouchableOpacity onPress={onPress} style={style} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Ionicons name="menu" size={26} color={color} />
    </TouchableOpacity>
  );
}

const makeStyles = (colors, spacing, radius, shadow) => StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  panel: {
    width: DRAWER_WIDTH, backgroundColor: colors.bgElevated,
    ...shadow.lg,
  },
  profile: { paddingTop: 60, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  avatar: {
    width: 60, height: 60, borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', marginBottom: spacing.md,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  name: { color: '#fff', fontSize: 19, fontWeight: '800' },
  role: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },

  menu: { padding: spacing.md, gap: 4 },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: spacing.md, borderRadius: radius.md,
  },
  themeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: spacing.md, borderRadius: radius.md,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemIcon: { width: 36, height: 36, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  itemLabel: { fontSize: 15, fontWeight: '600', color: colors.text },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    paddingVertical: 14, borderRadius: radius.md,
    backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.danger + '55',
  },
  logoutText: { color: colors.danger, fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 11, color: colors.textLight, marginBottom: 28 },

  // Settings sheet
  settingsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  settingsCard: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    padding: spacing.xl, paddingBottom: 30, maxHeight: '85%',
  },
  settingsHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  settingsTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  settingsSection: {
    fontSize: 12, fontWeight: '700', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  settingHint: { fontSize: 11, color: colors.textLight },
});
