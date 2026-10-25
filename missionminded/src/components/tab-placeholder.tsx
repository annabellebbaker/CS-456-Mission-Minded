import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

export function TabPlaceholder({ title }: { title: string }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.brand}>MissionMinded</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
  },
  brand: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    color: colors.textSecondary,
    fontSize: 15,
  },
});
