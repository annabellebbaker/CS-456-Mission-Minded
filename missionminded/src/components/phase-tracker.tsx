import { StyleSheet, Text, View } from 'react-native';

import { missionPhases, phaseInfo, type MissionPhase } from '@/data/repository';
import { colors } from '@/theme/colors';

/** The five mission phases as dots, with the current one highlighted. `onDark` is for navy backgrounds. */
export function PhaseTracker({ phase, onDark = false }: { phase: MissionPhase; onDark?: boolean }) {
  const activeIndex = missionPhases.indexOf(phase);

  return (
    <View accessibilityLabel={`Mission phase: ${phaseInfo[phase].label}`} style={styles.tracker} testID="phase-tracker">
      {missionPhases.map((item, index) => {
        const complete = index < activeIndex;
        const current = index === activeIndex;

        return (
          <View key={item} style={styles.stage}>
            <View
              style={[
                styles.dot,
                onDark && styles.dotOnDark,
                complete && (onDark ? styles.dotCompleteOnDark : styles.dotComplete),
                current && (onDark ? styles.dotCurrentOnDark : styles.dotCurrent),
              ]}
            />
            <Text
              style={[
                styles.label,
                onDark && styles.labelOnDark,
                (current || complete) && (onDark ? styles.labelActiveOnDark : styles.labelActive),
                current && styles.labelCurrent,
              ]}
              numberOfLines={1}>
              {phaseInfo[item].label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tracker: { flexDirection: 'row', alignItems: 'flex-start' },
  stage: { flex: 1, alignItems: 'center', gap: 6 },
  dot: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#AEB8C2',
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  dotOnDark: { borderColor: '#6F8CA8', backgroundColor: 'transparent' },
  dotComplete: { borderColor: colors.navy, backgroundColor: colors.navy },
  dotCompleteOnDark: { borderColor: colors.white, backgroundColor: colors.white },
  dotCurrent: {
    width: 18,
    height: 18,
    marginTop: -1,
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.lightBlue,
  },
  dotCurrentOnDark: {
    width: 18,
    height: 18,
    marginTop: -1,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.lightBlue,
  },
  label: { color: colors.textSecondary, fontSize: 10, textAlign: 'center' },
  labelOnDark: { color: '#9FB6CC' },
  labelActive: { color: colors.navy },
  labelActiveOnDark: { color: colors.white },
  labelCurrent: { fontWeight: '700' },
});
