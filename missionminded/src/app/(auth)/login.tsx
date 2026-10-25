import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '@/data/auth';
import { colors, spacing } from '@/theme/colors';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (!signIn(email, password)) {
      setError('Incorrect email or password.');
      return;
    }
    // The root layout sends signed-in users to Home.
    setError('');
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
                onSubmitEditing={handleLogin}
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
              onPress={handleLogin}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>Log in</Text>
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
  pressed: {
    opacity: 0.75,
  },
});
