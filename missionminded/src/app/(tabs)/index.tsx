import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText as Text } from "@/components/app-text";
import { getCountdownParts, getNextMilestone } from "@/data/countdown";
import { useMissionaries } from "@/data/missionaries";
import { usePhotoUri } from "@/data/photo-store";
import type { MissionaryDetails } from "@/data/repository";
import { useNow } from "@/hooks/use-now";
import { colors, spacing } from "@/theme/colors";
import ameliaPhoto from "../../../assets/images/missionary-amelia.jpg";
import annabellePhoto from "../../../assets/images/missionary-annabelle.png";
import miloPhoto from "../../../assets/images/missionary-milo.png";

type InspirationCardData = {
  id: string;
  missionaryName: string;
  image: number;
};

const inspirationCards = [
  {
    id: "amelia-baker",
    missionaryName: "Sister Amelia Baker",
    image: ameliaPhoto,
  },
  {
    id: "annabelle-baker",
    missionaryName: "Sister Annabelle Baker",
    image: annabellePhoto,
  },
  {
    id: "milo-thatch",
    missionaryName: "Elder Milo Thatch",
    image: miloPhoto,
  },
] satisfies InspirationCardData[];

function normalizeMissionaryName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Annabelle's bundled photos, matched by name. Used when no photo was uploaded. */
function getBundledImage(missionary: MissionaryDetails): number | undefined {
  const names = [missionary.name, `${missionary.title} ${missionary.firstName} ${missionary.lastName}`].map(normalizeMissionaryName);
  return inspirationCards.find((card) => names.includes(normalizeMissionaryName(card.missionaryName)))?.image;
}

/** Big day count over the photo, like "21 DAYS UNTIL home". */
function Countdown({ missionary, now }: { missionary: MissionaryDetails; now: Date }) {
  const target = getNextMilestone(missionary, now);
  if (!target) return null;
  const { days } = getCountdownParts(target.date, now);

  return (
    <View accessible accessibilityLabel={`${days} ${days === 1 ? "day" : "days"} until ${target.label} for ${missionary.name}`}>
      <Text style={styles.countdownNumber}>{days}</Text>
      <View style={styles.countdownCaption}>
        <Text style={styles.countdownUnit}>{days === 1 ? "DAY" : "DAYS"} UNTIL </Text>
        <Text style={styles.countdownTarget} numberOfLines={1}>{target.label}</Text>
      </View>
    </View>
  );
}

function InspirationCard({
  name,
  image: bundledImage,
  missionary,
  now,
}: {
  name: string;
  image?: number;
  missionary?: MissionaryDetails;
  now: Date;
}) {
  const { setSelectedId } = useMissionaries();
  // An uploaded photo wins over the bundled one.
  const uploadedUri = usePhotoUri(missionary?.photoUrl);
  const image = uploadedUri ? { uri: uploadedUri } : missionary?.photoUrl ? undefined : bundledImage;

  const openTab = (pathname: "/missionary" | "/updates") => {
    if (!missionary) return;
    setSelectedId(missionary.id);
    router.navigate(pathname);
  };

  return (
    <View style={[styles.card, !missionary && styles.cardUnavailable]}>
      {/* The photo opens the timeline. It's a sibling of the buttons so they aren't nested. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${name}'s missionary page`}
        accessibilityState={{ disabled: !missionary }}
        disabled={!missionary}
        onPress={() => {
          if (missionary) {
            router.push({ pathname: "/missionary/[id]", params: { id: missionary.id } });
          }
        }}
        style={({ pressed }) => [StyleSheet.absoluteFill, pressed && styles.cardPressed]}
      >
        {image ? (
          <Image
            source={image}
            style={[StyleSheet.absoluteFill, styles.cardImage]}
            contentFit="cover"
            transition={150}
          />
        ) : (
          // No photo yet: a brand-blue card with a faint logo mark.
          <View style={styles.photoFallback}>
            <Image
              source={require("../../../assets/images/brand/logo-white.png")}
              style={styles.fallbackLogo}
              contentFit="contain"
            />
          </View>
        )}
      </Pressable>

      {missionary && (
        <View style={styles.cardOverlay} pointerEvents="box-none">
          <View style={styles.countdownColumn} pointerEvents="none">
            <Countdown missionary={missionary} now={now} />
          </View>
          <View style={styles.cardActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Mission details for ${missionary.name}`}
              hitSlop={8}
              onPress={() => openTab("/missionary")}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
            >
              <Text style={styles.actionText}>Details</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Updates for ${missionary.name}`}
              hitSlop={8}
              onPress={() => openTab("/updates")}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
            >
              <Text style={styles.actionText}>Updates</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { missionaries } = useMissionaries();
  const now = useNow();

  return (
    <View style={styles.screen}>
      <View style={styles.brandHeader}>
        <Image
          source={require("../../../assets/images/missionminded-fulltextlogo.png")}
          style={styles.brandLogo}
          contentFit="cover"
          accessibilityLabel="MissionMinded logo"
        />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.inspirationSection}>
            <View style={styles.cardGrid}>
              {missionaries.length > 0
                ? missionaries.map((missionary) => (
                  <InspirationCard
                    key={missionary.id}
                    name={missionary.name}
                    image={getBundledImage(missionary)}
                    missionary={missionary}
                    now={now}
                  />
                ))
                // Nobody followed yet: show Annabelle's inspiration photos.
                : inspirationCards.map((card) => (
                  <InspirationCard key={card.id} name={card.missionaryName} image={card.image} now={now} />
                ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const textShadow = {
  textShadowColor: "rgba(10, 50, 85, 0.45)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
} as const;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.brandSurface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  content: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    gap: spacing.xl,
  },
  brandHeader: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginBottom: spacing.xl,
  },
  brandLogo: {
    width: "95%",
    aspectRatio: 8,
  },
  inspirationSection: {
    gap: spacing.lg,
  },
  cardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  card: {
    flexGrow: 1,
    flexBasis: 280,
    minWidth: 260,
    height: 190,
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: colors.navy,
  },
  cardPressed: { opacity: 0.88 },
  cardUnavailable: { opacity: 0.7 },
  cardImage: {
    borderRadius: 20,
  },
  photoFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: spacing.xxl * 2,
    backgroundColor: colors.brandBlue,
  },
  fallbackLogo: { width: 96, height: 96, opacity: 0.18 },
  cardOverlay: {
    ...StyleSheet.absoluteFill,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.lg,
  },
  countdownColumn: { flex: 1, minWidth: 0, justifyContent: "flex-start" },
  countdownNumber: {
    color: colors.white,
    fontSize: 84,
    lineHeight: 88,
    fontWeight: "300",
    letterSpacing: -1,
    opacity: 0.95,
    ...textShadow,
  },
  countdownCaption: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" },
  countdownUnit: {
    color: colors.white,
    fontSize: 22,
    letterSpacing: 1,
    ...textShadow,
  },
  countdownTarget: {
    color: colors.white,
    fontSize: 24,
    fontStyle: "italic",
    fontWeight: "700",
    // Italic letters lean past their box; without this the single-line clip cuts off the last letter.
    paddingRight: 6,
    ...textShadow,
  },
  // Small white pills stacked on the right edge.
  cardActions: { justifyContent: "flex-end", alignItems: "flex-end", gap: 6 },
  actionButton: {
    minWidth: 72,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
  },
  actionPressed: { opacity: 0.75 },
  actionText: { color: colors.navy, fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
});
