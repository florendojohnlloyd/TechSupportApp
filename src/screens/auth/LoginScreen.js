import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, shadow } from '../../theme';

const DEMO_ACCOUNTS = [
  { role: 'Support', email: 'support@demo.com', icon: 'headset', color: colors.support },
  { role: 'Branch Manager', email: 'manager@demo.com', icon: 'briefcase', color: colors.manager },
  { role: 'Field Engineer', email: 'fse@demo.com', icon: 'construct', color: colors.fse },
];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (!result.success) setError(result.message);
  };

  const quickFill = (acc) => {
    setEmail(acc.email);
    setPassword('demo123');
    setError('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logoBox}>
            <Ionicons name="build" size={36} color="#fff" />
          </View>
          <Text style={styles.brandTitle}>TechSupport</Text>
          <Text style={styles.brandSub}>Workflow Management System</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to continue</Text>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              placeholder="Email address"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>

        {/* Demo Accounts */}
        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>Quick login · demo accounts</Text>
          {DEMO_ACCOUNTS.map((acc) => (
            <TouchableOpacity key={acc.email} style={styles.demoRow} onPress={() => quickFill(acc)} activeOpacity={0.7}>
              <View style={[styles.demoIcon, { backgroundColor: acc.color }]}>
                <Ionicons name={acc.icon} size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.demoRole}>{acc.role}</Text>
                <Text style={styles.demoEmail}>{acc.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
          ))}
          <Text style={styles.demoHint}>Password for all: demo123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xxl },
  brand: { alignItems: 'center', marginBottom: spacing.xxxl },
  logoBox: {
    width: 72, height: 72, borderRadius: radius.xl,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg, ...shadow.lg,
  },
  brandTitle: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  brandSub: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xxl, padding: spacing.xxl, ...shadow.md,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: spacing.xl },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, marginBottom: spacing.md,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.text },
  eyeBtn: { padding: spacing.xs },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.dangerBg, borderRadius: radius.sm,
    padding: spacing.sm, marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, marginTop: spacing.sm,
    ...shadow.sm,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  demoSection: { marginTop: spacing.xxl },
  demoLabel: {
    fontSize: 12, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.md, textAlign: 'center',
  },
  demoRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.md, marginBottom: spacing.sm, ...shadow.sm,
  },
  demoIcon: { width: 40, height: 40, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  demoRole: { fontSize: 15, fontWeight: '600', color: colors.text },
  demoEmail: { fontSize: 12, color: colors.textMuted },
  demoHint: { textAlign: 'center', fontSize: 12, color: colors.textLight, marginTop: spacing.sm },
});
