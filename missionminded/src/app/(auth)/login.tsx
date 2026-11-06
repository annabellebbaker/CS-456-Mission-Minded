import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText as Text, AppTextInput as TextInput } from '@/components/app-text';
import { useAuth } from '@/data/auth';
import { colors, spacing } from '@/theme/colors';

export default function LoginScreen() {
  const { signIn, createAccount, setupError } = useAuth();
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleLogin = async () => {
    if (creatingAccount && !name.trim()) {
      setError('Enter your name to create an account.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSaving(true);
    try {
      if (creatingAccount) await createAccount(name, email, password);
      else await signIn(email, password);
      setError('');
    } catch (caughtError) {
      const code = (caughtError as { code?: string })?.code;
      setError(setupError || (code === 'auth/email-already-in-use'
        ? 'An account already uses that email. Log in instead.'
        : code === 'auth/invalid-email'
          ? 'Enter a valid email address.'
          : code === 'auth/weak-password'
            ? 'Choose a password with at least 6 characters.'
            : creatingAccount
              ? 'Could not create your account. Check your connection and try again.'
              : 'Email or password did not match an account.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.brand}>
            <View style={styles.brandMark} accessibilityElementsHidden>
              <Text style={styles.brandMarkText}>M</Text>
            </View>
            <Text style={styles.brandName}>MISSION{'\n'}MINDED</Text>
          </View>

          <View style={styles.card}>
            {!!setupError && (
              <Text accessibilityRole="alert" style={styles.error}>
                {setupError}
              </Text>
            )}
            {creatingAccount && (
              <View style={styles.field}>
                <Text style={styles.label}>NAME</Text>
                <TextInput
                  accessibilityLabel="Name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  textContentType="name"
                  style={styles.textInput}
                />
              </View>
            )}
            <View style={styles.field}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                accessibilityLabel="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                style={styles.textInput}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                accessibilityLabel="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => void handleLogin()}
                style={styles.textInput}
              />
            </View>

            {!!error && (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void handleLogin()}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]}>
              <Text style={styles.primaryButtonText}>{saving ? 'Please wait…' : creatingAccount ? 'Create account' : 'Log in'}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => {
                setCreatingAccount((value) => !value);
                setError('');
              }}
              style={({ pressed }) => [styles.modeButton, pressed && styles.pressed]}>
              <Text style={styles.modeButtonText}>
                {creatingAccount ? 'Already have an account? Log in' : 'Create an account'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    gap: spacing.xxl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.md,
  },
  brandMark: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.navy,
  },
  brandMarkText: {
    color: colors.lightBlue,
    fontSize: 40,
    fontWeight: '800',
  },
  brandName: {
    color: colors.navy,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
    letterSpacing: 1,
    textAlign: 'center',
  },
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  textInput: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.text,
    fontSize: 15,
    backgroundColor: colors.white,
  },
  error: {
    color: '#A12626',
    fontSize: 14,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.navy,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modeButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  modeButtonText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  pressed: {
    opacity: 0.75,
  },
});
