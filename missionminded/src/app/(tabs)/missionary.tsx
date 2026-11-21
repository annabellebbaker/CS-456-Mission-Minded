import { router } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText as Text } from '@/components/app-text';
import { MissionDetails } from '@/components/mission-details';
import { MissionaryPicker } from '@/components/missionary-picker';
import { useMissionaries } from '@/data/missionaries';
import { colors, spacing } from '@/theme/colors';

const stateFlagCodes: Record<string, string> = {
  alabama: 'al', alaska: 'ak', arizona: 'az', arkansas: 'ar', california: 'ca',
  colorado: 'co', connecticut: 'ct', delaware: 'de', florida: 'fl', georgia: 'ga',
  hawaii: 'hi', idaho: 'id', illinois: 'il', indiana: 'in', iowa: 'ia', kansas: 'ks',
  kentucky: 'ky', louisiana: 'la', maine: 'me', maryland: 'md', massachusetts: 'ma',
  michigan: 'mi', minnesota: 'mn', mississippi: 'ms', missouri: 'mo', montana: 'mt',
  nebraska: 'ne', nevada: 'nv', 'new hampshire': 'nh', 'new jersey': 'nj',
  'new mexico': 'nm', 'new york': 'ny', 'north carolina': 'nc', 'north dakota': 'nd',
  ohio: 'oh', oklahoma: 'ok', oregon: 'or', pennsylvania: 'pa', 'rhode island': 'ri',
  'south carolina': 'sc', 'south dakota': 'sd', tennessee: 'tn', texas: 'tx', utah: 'ut',
  vermont: 'vt', virginia: 'va', washington: 'wa', 'west virginia': 'wv', wisconsin: 'wi',
  wyoming: 'wy',
};

const countryFlagCodes: Record<string, string> = {
  adriatic: 'hr', albania: 'al', alpine: 'at', argentina: 'ar', armenia: 'am',
  australia: 'au', austria: 'at', baltic: 'ee', barbados: 'bb', belgium: 'be',
  'belgium netherlands': 'be', benin: 'bj', bolivia: 'bo', botswana: 'bw',
  brazil: 'br', bulgaria: 'bg', cambodia: 'kh', cameroon: 'cm', 'cape town': 'za',
  cape: 'za', chile: 'cl', china: 'cn', colombia: 'co', 'costa rica': 'cr',
  'cote d ivoire': 'ci', cuba: 'cu', 'czech slovak': 'cz', 'czech republic': 'cz',
  'democratic republic': 'cd', 'dominican republic': 'do', ecuador: 'ec',
  'el salvador': 'sv', england: 'gb-eng', ethiopia: 'et', europe: 'eu', fiji: 'fj',
  finland: 'fi', france: 'fr', germany: 'de', ghana: 'gh', greece: 'gr', guatemala: 'gt',
  guyana: 'gy', haiti: 'ht', honduras: 'hn', 'hong kong': 'hk', hungary: 'hu',
  india: 'in', indonesia: 'id', ireland: 'ie', israel: 'il', italy: 'it', jamaica: 'jm',
  japan: 'jp', kenya: 'ke', korea: 'kr', liberia: 'lr', madagascar: 'mg', malawi: 'mw',
  'marshall islands': 'mh', mexico: 'mx', micronesia: 'fm', mongolia: 'mn',
  mozambique: 'mz', nepal: 'np', netherlands: 'nl', 'new zealand': 'nz', nicaragua: 'ni',
  nigeria: 'ng', norway: 'no', pakistan: 'pk', panama: 'pa', 'papua new guinea': 'pg',
  paraguay: 'py', peru: 'pe', philippines: 'ph', poland: 'pl', portugal: 'pt',
  'puerto rico': 'pr', 'republic of congo': 'cg', romania: 'ro', russia: 'ru', rwanda: 'rw',
  samoa: 'ws', scotland: 'gb-sct', senegal: 'sn', 'sierra leone': 'sl', singapore: 'sg',
  'solomon islands': 'sb', 'south africa': 'za', 'south korea': 'kr', spain: 'es',
  sweden: 'se', switzerland: 'ch', tahiti: 'pf', taiwan: 'tw', tanzania: 'tz',
  thailand: 'th', togo: 'tg', tonga: 'to', turkey: 'tr', uganda: 'ug', ukraine: 'ua',
  'united kingdom': 'gb', uruguay: 'uy', vanuatu: 'vu', venezuela: 've', vietnam: 'vn',
  zambia: 'zm', zimbabwe: 'zw', canada: 'ca',
};

function getMissionFlagUrl(missionName: string, missionId: string): string | undefined {
  const normalizedName = missionName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (missionId === 'alaska-anchorage' || normalizedName.startsWith('alaska ')) {
    return 'https://flagcdn.com/w640/us-ak.png';
  }
  const stateName = Object.keys(stateFlagCodes).sort((a, b) => b.length - a.length)
    .find((state) => normalizedName.startsWith(`${state} `));
  const countryName = Object.keys(countryFlagCodes).sort((a, b) => b.length - a.length)
    .find((country) => normalizedName.startsWith(`${country} `));
  const code = stateName ? `us-${stateFlagCodes[stateName]}` : countryName ? countryFlagCodes[countryName] : undefined;
  return code ? `https://flagcdn.com/w640/${code}.png` : undefined;
}

export default function MissionaryTabScreen() {
  const { missionaries, getById, selectedId, deleteMissionary } = useMissionaries();
  const missionary = getById(selectedId) ?? missionaries[0];
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!missionary) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Missionary</Text>
          <Text style={styles.caption}>Add a Missionary to see their mission details.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/add-missionary')} style={styles.dashedButton}>
            <Text style={styles.dashedButtonText}>+ Add a Missionary</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  const flagUrl = getMissionFlagUrl(missionary.missionName, missionary.missionId);

  const handleDeleteMissionary = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteMissionary(missionary.id);
      router.replace('/');
    } catch {
      setDeleteError('Could not delete this missionary. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.pageTitle}>Missionary</Text>
        <MissionaryPicker />

        <View style={styles.headerCard}>
          {flagUrl && (
            <Image
              accessibilityLabel={`${missionary.missionName} flag background`}
              source={{ uri: flagUrl }}
              contentFit="cover"
              style={styles.flagImage}
            />
          )}
          <View pointerEvents="none" style={styles.headerCardScrim} />
        </View>

        <Text style={styles.eyebrow}>MISSION DETAILS</Text>
        <MissionDetails missionary={missionary} />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/missionary/[id]', params: { id: missionary.id } })}
          style={({ pressed }) => [styles.journeyButton, pressed && styles.pressed]}>
          <Text style={styles.journeyButtonText}>View {missionary.title} {missionary.lastName}&apos;s timeline</Text>
          <Text accessibilityElementsHidden style={styles.journeyButtonText}>›</Text>
        </Pressable>

        <View style={styles.missionaryActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/add-missionary', params: { id: missionary.id } })}
            style={({ pressed }) => [styles.editDetailsButton, pressed && styles.pressed]}>
            <Text style={styles.editDetailsButtonText}>Edit missionary details</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={deleting}
            onPress={() => {
              setDeleteError('');
              setConfirmDelete(true);
            }}
            style={({ pressed }) => [styles.deleteMissionaryButton, pressed && styles.pressed, deleting && styles.disabled]}>
            <Text style={styles.deleteMissionaryButtonText}>Delete missionary</Text>
          </Pressable>
          {confirmDelete && (
            <View style={styles.deleteConfirmation}>
              <Text style={styles.deleteConfirmationText}>
                Delete {missionary.name}? This removes this missionary and their saved journey details.
              </Text>
              <View style={styles.confirmationActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={deleting}
                  onPress={() => setConfirmDelete(false)}
                  style={({ pressed }) => [styles.cancelDeleteButton, pressed && styles.pressed, deleting && styles.disabled]}>
                  <Text style={styles.cancelDeleteText}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={deleting}
                  onPress={() => void handleDeleteMissionary()}
                  style={({ pressed }) => [styles.confirmDeleteButton, pressed && styles.pressed, deleting && styles.disabled]}>
                  <Text style={styles.confirmDeleteText}>{deleting ? 'Deleting...' : 'Confirm delete'}</Text>
                </Pressable>
              </View>
              {!!deleteError && <Text accessibilityRole="alert" style={styles.deleteError}>{deleteError}</Text>}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: spacing.md },
  pageTitle: { color: colors.navy, fontSize: 27, fontWeight: '700' },
  caption: { color: colors.textSecondary, fontSize: 14 },
  headerCard: { position: 'relative', overflow: 'hidden', minHeight: 142, borderRadius: 16, backgroundColor: colors.navy },
  flagImage: { ...StyleSheet.absoluteFill },
  headerCardScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(14, 31, 54, 0.45)' },
  eyebrow: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  journeyButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 12,
  },
  journeyButtonText: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  missionaryActions: { gap: spacing.sm, paddingTop: spacing.sm },
  editDetailsButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.navy,
  },
  editDetailsButtonText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  deleteMissionaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A12626',
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  deleteMissionaryButtonText: { color: '#A12626', fontSize: 15, fontWeight: '700' },
  deleteConfirmation: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2B8B8',
    borderRadius: 10,
    backgroundColor: '#FFF8F8',
  },
  deleteConfirmationText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  confirmationActions: { flexDirection: 'row', gap: spacing.sm },
  cancelDeleteButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  cancelDeleteText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  confirmDeleteButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#A12626',
  },
  confirmDeleteText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  deleteError: { color: '#A12626', fontSize: 13 },
  disabled: { opacity: 0.6 },
  dashedButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.navy,
    borderRadius: 12,
  },
  dashedButtonText: { color: colors.navy, fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.78 },
});
