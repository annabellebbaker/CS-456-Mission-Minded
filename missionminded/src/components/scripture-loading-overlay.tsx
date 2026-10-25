import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';

import { colors, spacing } from '@/theme/colors';

const loadingThoughts = [
  {
    text: 'Go ye therefore, and teach all nations.',
    reference: 'Matthew 28:19',
  },
  {
    text: 'By small and simple things are great things brought to pass.',
    reference: 'Alma 37:6',
  },
  {
    text: 'I will go before your face. I will be on your right hand and on your left.',
    reference: 'Doctrine and Covenants 84:88',
  },
];

const displayDuration = 850;

export function ScriptureLoadingOverlay() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const [visible, setVisible] = useState(false);
  const [thoughtIndex, setThoughtIndex] = useState(0);
  const thought = loadingThoughts[thoughtIndex];

  useEffect(() => {
    if (previousPathname.current === pathname) return;

    previousPathname.current = pathname;
    setThoughtIndex((index) => (index + 1) % loadingThoughts.length);
    setVisible(true);

    const timeout = setTimeout(() => setVisible(false), displayDuration);
    return () => clearTimeout(timeout);
  }, [pathname]);

  if (!visible) return null;

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading the next page"
      pointerEvents="auto"
      style={styles.overlay}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.mark}>
        <Text style={styles.markText}>M</Text>
      </View>
      <Text style={styles.quote}>“{thought.text}”</Text>
      <Text style={styles.reference}>— {thought.reference}</Text>
      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    backgroundColor: colors.white,
  },
  mark: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.navy,
  },
  markText: {
    color: colors.lightBlue,
    fontSize: 30,
    fontWeight: '800',
  },
  quote: {
    maxWidth: 340,
    color: colors.navy,
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  reference: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  progressTrack: {
    width: 160,
    height: 6,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: '#DDE7EF',
  },
  progressFill: {
    width: '45%',
    height: '100%',
    backgroundColor: colors.lightBlue,
  },
});
