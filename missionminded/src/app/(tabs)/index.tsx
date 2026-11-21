import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { useMissionaries } from "@/data/missionaries";
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

function InspirationCard({
  card,
  missionaryId,
}: {
  card: InspirationCardData;
  missionaryId?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${card.missionaryName}'s missionary page`}
      accessibilityState={{ disabled: !missionaryId }}
      disabled={!missionaryId}
      onPress={() => {
        if (missionaryId) {
          router.push({ pathname: "/missionary/[id]", params: { id: missionaryId } });
        }
      }}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed, !missionaryId && styles.cardUnavailable]}
    >
      <Image
        source={card.image}
        style={[StyleSheet.absoluteFill, styles.cardImage]}
        contentFit="cover"
      />
    </Pressable>
  );
}

export default function HomeScreen() {
  const { missionaries } = useMissionaries();

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
              {inspirationCards.map((card) => (
                <InspirationCard
                  key={card.id}
                  card={card}
                  missionaryId={missionaries.find((missionary) =>
                    normalizeMissionaryName(missionary.name) === normalizeMissionaryName(card.missionaryName)
                    || normalizeMissionaryName(`${missionary.title} ${missionary.firstName} ${missionary.lastName}`)
                      === normalizeMissionaryName(card.missionaryName),
                  )?.id}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

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
});
