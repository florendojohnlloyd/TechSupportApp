import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AnimatedCard, PressableScale, FadeIn } from '../../components/Animated';

export default function LoginScreen() {
  const { colors, spacing, radius, shadow, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => makeStyles(colors, spacing, radius, shadow), [colors]);

  const DEMO_ACCOUNTS = [
    { role: 'Support', email: 'support@demo.com', icon: 'headset', color: colors.support },
    { role: 'Branch Manager', email: 'manager@demo.com', icon: 'briefcase', color: colors.manager },
    { role: 'Field Engineer', email: 'fse@demo.com', icon: 'construct', color: colors.fse },
  ];

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
      {/* Theme toggle */}
      <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme} activeOpacity={0.8}>
        <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={colors.text} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <FadeIn delay={80}>
          <View style={styles.brand}>
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoBox}
            >
              <Ionicons name="build" size={36} color="#fff" />
            </LinearGradient>
            <Text style={styles.brandTitle}>
              Tech<Text style={{ color: colors.primary }}>Support</Text>
            </Text>
            <Text style={styles.brandSub}>Fast Help. Better Support.</Text>
          </View>
        </FadeIn>

        {/* Card */}
        <AnimatedCard index={1} style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

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

          <PressableScale onPress={handleLogin} disabled={loading}>
            <LinearGradient
              colors={colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            >
              <Text style={styles.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
            </LinearGradient>
          </PressableScale>
        </AnimatedCard>

        {/* Demo Accounts */}
        <AnimatedCard index={2} style={styles.demoSection}>
          <Text style={styles.demoLabel}>Quick login · demo accounts</Text>
          {DEMO_ACCOUNTS.map((acc, i) => (
            <AnimatedCard key={acc.email} index={3 + i}>
              <PressableScale style={styles.demoRow} onPress={() => quickFill(acc)}>
                <View style={[styles.demoIcon, { backgroundColor: acc.color }]}>
                  <Ionicons name={acc.icon} size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.demoRole}>{acc.role}</Text>
                  <Text style={styles.demoEmail}>{acc.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
              </PressableScale>
            </AnimatedCard>
          ))}
          <Text style={styles.demoHint}>Password for all: demo123</Text>
        </AnimatedCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors, spacing, radius, shadow) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  themeToggle: {
    position: 'absolute', top: 52, right: 20, zIndex: 10,
    width: 42, height: 42, borderRadius: radius.full,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', ...shadow.sm,
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xxl },
  brand: { alignItems: 'center', marginBottom: spacing.xxxl },
  logoBox: {
    width: 80, height: 80, borderRadius: radius.xl,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg, ...shadow.glow(colors.primary),
  },
  brandTitle: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  brandSub: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xxl, padding: spacing.xxl,
    borderWidth: 1, borderColor: colors.border, ...shadow.md,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  cardSubtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: spacing.xl },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceAlt, borderRadius: radius.md,
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
    borderRadius: radius.md, paddingVertical: 16, marginTop: spacing.sm,
    ...shadow.glow(colors.primary),
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
    padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border, ...shadow.sm,
  },
  demoIcon: { width: 40, height: 40, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' },
  demoRole: { fontSize: 15, fontWeight: '600', color: colors.text },
  demoEmail: { fontSize: 12, color: colors.textMuted },
  demoHint: { textAlign: 'center', fontSize: 12, color: colors.textLight, marginTop: spacing.sm },
});
