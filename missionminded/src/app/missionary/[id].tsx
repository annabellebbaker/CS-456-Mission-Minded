import { useMemo, useRef, useState } from "react";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from "react-native";

import {
  AppText as Text,
  AppTextInput as TextInput,
} from "@/components/app-text";
import { useMissionaries } from "@/data/missionaries";
import {
  type PhaseMoment,
  type MissionPhase,
} from "@/data/repository";
import { colors, spacing } from "@/theme/colors";

function parseMomentDate(when?: string): Date | null {
  const value = when?.trim();
  if (!value) return null;

  const slashDate = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(value);
  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const writtenDate = /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/.exec(value);
  let year: number;
  let month: number;
  let day: number;

  if (slashDate) {
    month = Number(slashDate[1]);
    day = Number(slashDate[2]);
    year = Number(slashDate[3]);
    if (slashDate[3].length === 2) year += year < 70 ? 2000 : 1900;
  } else if (isoDate) {
    year = Number(isoDate[1]);
    month = Number(isoDate[2]);
    day = Number(isoDate[3]);
  } else if (writtenDate) {
    year = Number(writtenDate[3]);
    month = new Date(`${writtenDate[1]} 1, ${year}`).getMonth() + 1;
    day = Number(writtenDate[2]);
  } else {
    return null;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

function parseMomentSortDate(when?: string): Date | null {
  const exactDate = parseMomentDate(when);
  if (exactDate) return exactDate;

  const value = when?.trim();
  if (!value) return null;
  const monthYear = /^([A-Za-z]+)\s+(\d{4})$/.exec(value);
  if (monthYear) {
    const month = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    if (!Number.isNaN(month.getTime()) && month.toLocaleDateString("en-US", { month: "long" }).toLowerCase() === monthYear[1].toLowerCase()) {
      return month;
    }
  }

  const seasonYear = /^(spring|summer|fall|autumn|winter)\s+(\d{4})$/i.exec(value);
  if (seasonYear) {
    const monthBySeason: Record<string, number> = {
      spring: 2,
      summer: 5,
      fall: 8,
      autumn: 8,
      winter: 11,
    };
    return new Date(Number(seasonYear[2]), monthBySeason[seasonYear[1].toLowerCase()], 1);
  }

  return null;
}

function shouldShowReturnHome(when?: string): boolean {
  const returnDate = parseMomentSortDate(when);
  if (!returnDate) return false;
  const sixMonthsFromToday = new Date();
  sixMonthsFromToday.setHours(23, 59, 59, 999);
  const dayOfMonth = sixMonthsFromToday.getDate();
  sixMonthsFromToday.setDate(1);
  sixMonthsFromToday.setMonth(sixMonthsFromToday.getMonth() + 6);
  const lastDayOfTargetMonth = new Date(
    sixMonthsFromToday.getFullYear(),
    sixMonthsFromToday.getMonth() + 1,
    0,
  ).getDate();
  sixMonthsFromToday.setDate(Math.min(dayOfMonth, lastDayOfTargetMonth));
  return returnDate <= sixMonthsFromToday;
}

function formatDateInput(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}/${date.getFullYear()}`;
}

function getTimelineDateParts(when?: string): { primary: string; year: string } {
  const date = parseMomentDate(when);
  if (date) {
    return {
      primary: `${date.toLocaleDateString("en-US", { month: "short" })} ${date.getDate()}`,
      year: String(date.getFullYear()),
    };
  }

  const value = when?.trim();
  if (!value) return { primary: "Add date", year: "" };

  const monthYear = /^([A-Za-z]+)\.?\s+(\d{4})$/.exec(value);
  if (monthYear) {
    const month = new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    if (!Number.isNaN(month.getTime())) {
      return {
        primary: month.toLocaleDateString("en-US", { month: "short" }),
        year: monthYear[2],
      };
    }
  }

  const seasonYear = /^(spring|summer|fall|autumn|winter)\s+(\d{4})$/i.exec(value);
  if (seasonYear) {
    return {
      primary: seasonYear[1][0].toUpperCase() + seasonYear[1].slice(1).toLowerCase(),
      year: seasonYear[2],
    };
  }

  return { primary: value, year: "" };
}

function isExpectedFuture(moment: PhaseMoment, currentPhase: MissionPhase): boolean {
  if (moment.done) return false;
  const date = parseMomentSortDate(moment.when);
  if (date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() > today.getTime();
  }
  const phaseOrder: Record<MissionPhase, number> = {
    assigned: 0,
    mtc: 1,
    serving: 2,
    home: 3,
  };
  return phaseOrder[moment.phase] > phaseOrder[currentPhase];
}

function getCompanionTitle(missionaryTitle?: string | null): "Elder" | "Sister" {
  return /\bsister\b/i.test(missionaryTitle ?? "") ? "Sister" : "Elder";
}

function formatCompanionName(value: string, title: "Elder" | "Sister"): string {
  const name = value.trim().replace(/^(elder|sister)\s+/i, "").trim();
  return name ? `${title} ${name}` : "";
}

function getTimelineEventTitle(title: string): string {
  const monthPattern = "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";
  const withoutDates = title
    .replace(/\b\d{4}-\d{1,2}-\d{1,2}\b/g, "")
    .replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g, "")
    .replace(new RegExp(`\\b(?:${monthPattern})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{2,4})?\\b`, "gi"), "")
    .replace(new RegExp(`\\b(?:${monthPattern})\\.?\\s+\\d{4}\\b`, "gi"), "")
    .replace(/\s+[-–—|]\s+/g, " ")
    .replace(/\(\s*\)|\[\s*\]/g, " ")
    .replace(/\s*[-–—,:|]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return withoutDates || title;
}

function CompanionNameInput({
  title,
  value,
  onChangeText,
}: {
  title: "Elder" | "Sister";
  value: string;
  onChangeText: (value: string) => void;
}) {
  const name = value.replace(/^(elder|sister)\s+/i, "");
  return (
    <View style={styles.companionInputRow}>
      <View style={styles.companionTitlePrefix}>
        <Text style={styles.companionTitleText}>{title}</Text>
      </View>
      <TextInput
        accessibilityLabel={`${title} companion's name`}
        value={name}
        onChangeText={(nextName) => onChangeText(formatCompanionName(nextName, title))}
        placeholder="Enter name"
        placeholderTextColor="#6F7C88"
        autoCapitalize="words"
        style={[styles.momentDateInput, styles.companionNameInput]}
      />
    </View>
  );
}

function PhaseMomentRow({
  moment,
  currentPhase,
  missionaryTitle,
  onSave,
}: {
  moment: PhaseMoment;
  currentPhase: MissionPhase;
  missionaryTitle: string;
  onSave: (details: {
    date: string;
    districtNumber?: string;
    companionName?: string;
    areaName?: string;
  }) => Promise<void>;
}) {
  const companionTitle = getCompanionTitle(missionaryTitle);
  const [editing, setEditing] = useState(false);
  const [dateOnlyEditing, setDateOnlyEditing] = useState(false);
  const [date, setDate] = useState(() => {
    const savedDate = parseMomentDate(moment.when);
    return savedDate ? formatDateInput(savedDate) : "";
  });
  const [districtNumber, setDistrictNumber] = useState(
    moment.districtNumber ?? "",
  );
  const [companionName, setCompanionName] = useState(() =>
    formatCompanionName(moment.companionName ?? "", companionTitle),
  );
  const [areaName, setAreaName] = useState(moment.areaName ?? "");
  const initialDate = parseMomentDate(moment.when) ?? new Date();
  const [pickerDate, setPickerDate] = useState(initialDate);
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const isMtcMoment = moment.phase === "mtc" && /MTC/i.test(moment.title);
  const needsFieldDetails = moment.phase === "serving";
  const isReturnHome = moment.phase === "home" && /return/i.test(moment.title);
  const userAdded = moment.id?.startsWith("event-") === true;
  const expectedFuture = isExpectedFuture(moment, currentPhase);
  const dateParts = getTimelineDateParts(moment.when);
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const count = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    return Array.from({ length: count }, (_, index) => {
      const dayDate = new Date(year, month, index - firstWeekday + 1);
      return { date: dayDate, inMonth: dayDate.getMonth() === month };
    });
  }, [calendarMonth]);

  const saveDate = async () => {
    if (!date.trim()) {
      setSaveError("Choose a date from the calendar.");
      return;
    }
    if (!dateOnlyEditing && isMtcMoment && (!districtNumber.trim() || !companionName.trim())) {
      setSaveError("Enter the district number and companion name.");
      return;
    }
    if (!dateOnlyEditing && needsFieldDetails && (!companionName.trim() || !areaName.trim())) {
      setSaveError("Enter the companion name and area name.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await onSave({
        date,
        ...(isMtcMoment ? { districtNumber, companionName } : {}),
        ...(needsFieldDetails ? { companionName, areaName } : {}),
      });
      setEditing(false);
      setDateOnlyEditing(false);
      setShowDatePicker(false);
    } catch {
      setSaveError("Could not save this date. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const openDatePicker = () => {
    const nextDate = parseMomentDate(moment.when) ?? new Date();
    setDate(formatDateInput(nextDate));
    setPickerDate(nextDate);
    setCalendarMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    setSaveError("");
    setDateOnlyEditing(true);
    setEditing(true);
    setShowDatePicker(true);
  };

  return (
    <View style={styles.timelineRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={moment.when ? `Change date, ${dateParts.primary} ${dateParts.year}` : "Add date"}
        accessibilityState={{ expanded: editing && showDatePicker }}
        onPress={openDatePicker}
        style={({ pressed }) => [styles.timelineDateColumn, pressed && styles.pressed]}
      >
        <Text style={[styles.timelineDatePrimary, !moment.when && styles.timelineAddDate]}>
          {dateParts.primary}
        </Text>
        {!!dateParts.year && <Text style={styles.timelineDateYear}>{dateParts.year}</Text>}
      </Pressable>
      <View style={styles.timelineMarkerColumn}>
        <View style={[styles.timelineMarker, moment.done && styles.timelineMarkerDone]} />
      </View>
      <View style={styles.timelineEventColumn}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit event ${moment.title}`}
        accessibilityState={{ expanded: editing }}
        onPress={() => {
          const nextDate = parseMomentDate(moment.when) ?? new Date();
          setDate(moment.when ? formatDateInput(nextDate) : "");
          setDistrictNumber(moment.districtNumber ?? "");
          setCompanionName(formatCompanionName(moment.companionName ?? "", companionTitle));
          setAreaName(moment.areaName ?? "");
          setDateOnlyEditing(false);
          setShowDatePicker(false);
          setPickerDate(nextDate);
          setCalendarMonth(
            new Date(nextDate.getFullYear(), nextDate.getMonth(), 1),
          );
          setSaveError("");
          setEditing((current) => !current);
        }}
        style={({ pressed }) => [
          styles.momentRow,
          userAdded
            ? expectedFuture ? styles.userEventUpcoming : styles.userEventCard
            : expectedFuture ? styles.statusEventUpcoming : styles.statusEventCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.momentCopy}>
          <Text style={styles.momentTitle}>{getTimelineEventTitle(moment.title)}</Text>
          {!!moment.districtNumber && (
            <Text style={styles.momentMeta}>
              District {moment.districtNumber}
            </Text>
          )}
          {!!moment.companionName && (
            <Text style={styles.momentMeta}>
              Companion: {moment.companionName}
            </Text>
          )}
          {!!moment.areaName && (
            <Text style={styles.momentMeta}>Area: {moment.areaName}</Text>
          )}
        </View>
        <Text style={styles.momentEditLabel}>{editing ? "Close" : "Edit"}</Text>
      </Pressable>
      {editing && (
        <View style={styles.momentEditor}>
          <Text style={styles.editorLabel}>Date *</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              date
                ? `Choose date from calendar. Selected ${date}`
                : "Choose date from calendar"
            }
            accessibilityState={{ expanded: showDatePicker }}
            onPress={() => {
              setCalendarMonth(
                new Date(pickerDate.getFullYear(), pickerDate.getMonth(), 1),
              );
              setShowDatePicker((visible) => !visible);
            }}
            style={({ pressed }) => [
              styles.datePickerButton,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.datePickerText,
                !date && styles.datePickerPlaceholder,
              ]}
            >
              {date || "Choose a date"}
            </Text>
            <View style={styles.calendarIcon}>
              <View style={styles.calendarIconHeader} />
            </View>
          </Pressable>
          {showDatePicker && (
            <View style={styles.calendarPopup}>
              <View style={styles.calendarHeader}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous year"
                  onPress={() =>
                    setCalendarMonth(
                      (current) =>
                        new Date(
                          current.getFullYear() - 1,
                          current.getMonth(),
                          1,
                        ),
                    )
                  }
                  style={styles.calendarNavButton}
                >
                  <Text style={styles.calendarNavText}>«</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous month"
                  onPress={() =>
                    setCalendarMonth(
                      (current) =>
                        new Date(
                          current.getFullYear(),
                          current.getMonth() - 1,
                          1,
                        ),
                    )
                  }
                  style={styles.calendarNavButton}
                >
                  <Text style={styles.calendarNavText}>‹</Text>
                </Pressable>
                <Text style={styles.calendarMonthTitle}>
                  {calendarMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next month"
                  onPress={() =>
                    setCalendarMonth(
                      (current) =>
                        new Date(
                          current.getFullYear(),
                          current.getMonth() + 1,
                          1,
                        ),
                    )
                  }
                  style={styles.calendarNavButton}
                >
                  <Text style={styles.calendarNavText}>›</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next year"
                  onPress={() =>
                    setCalendarMonth(
                      (current) =>
                        new Date(
                          current.getFullYear() + 1,
                          current.getMonth(),
                          1,
                        ),
                    )
                  }
                  style={styles.calendarNavButton}
                >
                  <Text style={styles.calendarNavText}>»</Text>
                </Pressable>
              </View>
              <View style={styles.calendarGrid}>
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <View key={day} style={styles.calendarWeekday}>
                    <Text style={styles.calendarWeekdayText}>{day}</Text>
                  </View>
                ))}
                {calendarDays.map(({ date: dayDate, inMonth }) => {
                  const selected =
                    date ===
                    `${String(dayDate.getMonth() + 1).padStart(2, "0")}/${String(dayDate.getDate()).padStart(2, "0")}/${dayDate.getFullYear()}`;
                  return (
                    <Pressable
                      key={`${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}`}
                      accessibilityRole="button"
                      accessibilityLabel={dayDate.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                      accessibilityState={{ selected }}
                      onPress={() => {
                        setPickerDate(dayDate);
                        setDate(formatDateInput(dayDate));
                        setShowDatePicker(false);
                        setSaveError("");
                      }}
                      style={[
                        styles.calendarDay,
                        !inMonth && styles.calendarDayOutside,
                        selected && styles.calendarDaySelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          !inMonth && styles.calendarDayOutsideText,
                          selected && styles.calendarDaySelectedText,
                        ]}
                      >
                        {dayDate.getDate()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
          {isMtcMoment && (
            <>
              <Text style={styles.editorLabel}>District Number *</Text>
              <TextInput
                accessibilityLabel="District Number"
                value={districtNumber}
                onChangeText={setDistrictNumber}
                placeholder="Enter district number"
                placeholderTextColor="#6F7C88"
                style={styles.momentDateInput}
              />
              <Text style={styles.editorLabel}>Companion&apos;s Name *</Text>
              <CompanionNameInput
                title={companionTitle}
                value={companionName}
                onChangeText={setCompanionName}
              />
            </>
          )}
          {needsFieldDetails && (
            <>
              <Text style={styles.editorLabel}>Companion&apos;s Name *</Text>
              <CompanionNameInput
                title={companionTitle}
                value={companionName}
                onChangeText={setCompanionName}
              />
              <Text style={styles.editorLabel}>Area Name *</Text>
              <TextInput
                accessibilityLabel="Area Name"
                value={areaName}
                onChangeText={setAreaName}
                placeholder="Enter area name"
                placeholderTextColor="#6F7C88"
                autoCapitalize="words"
                style={styles.momentDateInput}
              />
            </>
          )}
          {isReturnHome && (
            <Text style={styles.returnHomeHint}>
              No companion or area is needed for returning home.
            </Text>
          )}
          <View style={styles.momentEditorActions}>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void saveDate()}
              style={({ pressed }) => [
                styles.momentSaveButton,
                pressed && styles.pressed,
                saving && styles.disabledButton,
              ]}
            >
              <Text style={styles.momentSaveText}>
                {saving ? "Saving…" : "Save date"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => {
                setEditing(false);
                setDateOnlyEditing(false);
                setShowDatePicker(false);
              }}
              style={({ pressed }) => [
                styles.momentCancelButton,
                pressed && styles.pressed,
                saving && styles.disabledButton,
              ]}
            >
              <Text style={styles.momentCancelText}>Cancel</Text>
            </Pressable>
          </View>
          {!!saveError && (
            <Text accessibilityRole="alert" style={styles.momentSaveError}>
              {saveError}
            </Text>
          )}
        </View>
      )}
      </View>
    </View>
  );
}

/** Mission milestones arranged along a vertical timeline. */
function PhaseMomentList({
  moments,
  currentPhase,
  missionaryTitle,
  onSaveMoment,
}: {
  moments: PhaseMoment[];
  currentPhase: MissionPhase;
  missionaryTitle: string;
  onSaveMoment: (
    moment: PhaseMoment,
    details: {
      date: string;
      districtNumber?: string;
      companionName?: string;
      areaName?: string;
    },
  ) => Promise<void>;
}) {
  const visibleMoments = useMemo(
    () => moments.filter((moment) => moment.phase !== "home" || shouldShowReturnHome(moment.when)),
    [moments],
  );
  const sortedMoments = useMemo(() => {
    const phaseOrder: Record<MissionPhase, number> = {
      assigned: 0,
      mtc: 1,
      serving: 2,
      home: 3,
    };
    return [...visibleMoments].sort((left, right) => {
      const leftDate = parseMomentSortDate(left.when)?.getTime() ?? null;
      const rightDate = parseMomentSortDate(right.when)?.getTime() ?? null;
      if (leftDate === null || rightDate === null) return phaseOrder[right.phase] - phaseOrder[left.phase];
      if (leftDate !== rightDate) return rightDate - leftDate;
      return phaseOrder[right.phase] - phaseOrder[left.phase];
    });
  }, [visibleMoments]);
  const latestYear = sortedMoments
    .map((moment) => parseMomentSortDate(moment.when)?.getFullYear())
    .find((year) => year !== undefined);

  return (
    <ScrollView
      style={styles.timelineScroll}
      contentContainerStyle={styles.timelineScrollContent}
      nestedScrollEnabled
      showsVerticalScrollIndicator
    >
      {latestYear !== undefined && (
        <Text style={styles.timelineYearHeading}>{latestYear}</Text>
      )}
      <View style={styles.timelineTrack}>
        <View pointerEvents="none" style={styles.timelineLine} />
        {sortedMoments.map((moment, index) => (
          <PhaseMomentRow
            key={moment.id || `${moment.phase}:${moment.title}:${index}`}
            moment={moment}
            currentPhase={currentPhase}
            missionaryTitle={missionaryTitle}
            onSave={(details) => onSaveMoment(moment, details)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

export default function MissionaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, updatePhaseMoment, addPhaseMoment } = useMissionaries();
  const missionary = getById(Array.isArray(id) ? id[0] : id);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventError, setNewEventError] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);

  if (!missionary) {
    return (
      <View style={styles.notFoundScreen}>
        <Text style={styles.pageTitle}>Missionary not found</Text>
        <Link href="/" style={styles.homeLink}>
          Return to Home
        </Link>
      </View>
    );
  }

  const saveNewEvent = async () => {
    if (!newEventTitle.trim()) {
      setNewEventError("Enter an event name.");
      return;
    }
    const eventDate = parseMomentDate(newEventDate);
    if (!eventDate) {
      setNewEventError("Enter a valid event date.");
      return;
    }
    setAddingEvent(true);
    setNewEventError("");
    try {
      await addPhaseMoment(missionary.id, {
        title: newEventTitle.trim(),
        phase: missionary.phase,
        when: formatDateInput(eventDate),
        done: false,
      });
      setNewEventTitle("");
      setNewEventDate("");
      setAddEventOpen(false);
    } catch {
      setNewEventError("Could not add this event. Please try again.");
    } finally {
      setAddingEvent(false);
    }
  };

  const toggleAddEvent = () => {
    const opening = !addEventOpen;
    if (opening) {
      setNewEventTitle("");
      setNewEventDate("");
      setNewEventError("");
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
    }
    setAddEventOpen(opening);
  };

  return (
    <View style={styles.page}>
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <View style={styles.missionaryHeader}>
          <Text style={styles.pageTitle}>{missionary.name}</Text>
          <Text style={styles.missionName}>{missionary.missionName}</Text>
        </View>

        <View style={styles.timelineSection}>
          {addEventOpen && (
            <View style={styles.newEventForm}>
              <Text style={styles.newEventHeading}>Add an event</Text>
              <TextInput
                accessibilityLabel="Event name"
                value={newEventTitle}
                onChangeText={setNewEventTitle}
                placeholder="Event name"
                placeholderTextColor="#6F7C88"
                style={styles.newEventInput}
              />
              <Text style={styles.editorLabel}>Event date *</Text>
              <TextInput
                accessibilityLabel="Event date required"
                value={newEventDate}
                onChangeText={setNewEventDate}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#6F7C88"
                keyboardType="numbers-and-punctuation"
                style={styles.newEventInput}
              />
              {!!newEventError && <Text accessibilityRole="alert" style={styles.momentSaveError}>{newEventError}</Text>}
              <View style={styles.momentEditorActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={addingEvent}
                  onPress={() => void saveNewEvent()}
                  style={({ pressed }) => [styles.momentSaveButton, pressed && styles.pressed, addingEvent && styles.disabledButton]}>
                  <Text style={styles.momentSaveText}>{addingEvent ? "Adding…" : "Add event"}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={addingEvent}
                  onPress={() => setAddEventOpen(false)}
                  style={({ pressed }) => [styles.momentCancelButton, pressed && styles.pressed, addingEvent && styles.disabledButton]}>
                  <Text style={styles.momentCancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          )}
          <PhaseMomentList
            moments={missionary.moments}
            currentPhase={missionary.phase}
            missionaryTitle={missionary.title || missionary.name}
            onSaveMoment={(moment, details) =>
              updatePhaseMoment(
                missionary.id,
                moment.phase,
                moment.title,
                details,
                moment.id,
              )
            }
          />
        </View>

      </View>
    </ScrollView>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={addEventOpen ? "Close add event form" : "Add event"}
      accessibilityState={{ expanded: addEventOpen }}
      onPress={toggleAddEvent}
      style={({ pressed }) => [styles.addEventButton, pressed && styles.pressed]}>
      <View pointerEvents="none" style={styles.addEventGlyph}>
        {addEventOpen ? (
          <>
            <View style={[styles.addEventGlyphBar, styles.addEventCloseBarOne]} />
            <View style={[styles.addEventGlyphBar, styles.addEventCloseBarTwo]} />
          </>
        ) : (
          <>
            <View style={[styles.addEventGlyphBar, styles.addEventPlusHorizontal]} />
            <View style={[styles.addEventGlyphBar, styles.addEventPlusVertical]} />
          </>
        )}
      </View>
    </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.white },
  screen: { flex: 1, backgroundColor: colors.white },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 104,
  },
  content: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    gap: spacing.md,
  },
  notFoundScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  backButton: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
  },
  backText: { color: colors.navy, fontSize: 15, fontWeight: "600" },
  missionaryHeader: { gap: spacing.xs, paddingVertical: spacing.xs },
  pageTitle: { color: colors.navy, fontSize: 24, fontWeight: "700" },
  missionName: { color: colors.textSecondary, fontSize: 15 },
  timelineSection: { gap: spacing.md },
  timelineScroll: { maxHeight: 520, flexGrow: 0 },
  timelineScrollContent: { paddingVertical: spacing.sm },
  timelineYearHeading: {
    marginLeft: 90,
    marginBottom: spacing.xs,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  timelineTrack: { position: "relative", gap: 32 },
  timelineLine: {
    position: "absolute",
    top: 12,
    bottom: 18,
    left: 78,
    width: 2,
    backgroundColor: "#DCE5ED",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  timelineDateColumn: {
    width: 66,
    alignItems: "flex-end",
    paddingTop: spacing.md,
    paddingRight: spacing.sm,
  },
  timelineDatePrimary: { color: colors.navy, fontSize: 14, fontWeight: "700", textAlign: "right" },
  timelineDateYear: { color: colors.textSecondary, fontSize: 11, textAlign: "right" },
  timelineAddDate: { color: colors.navy, textDecorationLine: "underline" },
  timelineMarkerColumn: { width: 24, alignItems: "center", paddingTop: spacing.lg },
  timelineMarker: {
    width: 12,
    height: 12,
    borderWidth: 3,
    borderColor: colors.white,
    borderRadius: 6,
    backgroundColor: colors.lightBlue,
  },
  timelineMarkerDone: { backgroundColor: colors.navy },
  timelineEventColumn: { flex: 1, gap: spacing.sm },
  statusEventCard: { backgroundColor: "rgba(127, 150, 196, 0.5)" },
  userEventCard: { backgroundColor: "rgba(136, 176, 224, 0.5)" },
  statusEventUpcoming: {
    borderWidth: 1.5,
    borderStyle: "dotted",
    borderColor: "#7F96C4",
    backgroundColor: "rgba(127, 150, 196, 0.18)",
  },
  userEventUpcoming: {
    borderWidth: 1.5,
    borderStyle: "dotted",
    borderColor: "#88B0E0",
    backgroundColor: "rgba(136, 176, 224, 0.18)",
  },
  newEventForm: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#D6DEE6",
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
  },
  newEventHeading: { color: colors.navy, fontSize: 16, fontWeight: "700" },
  newEventInput: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.white,
    color: colors.text,
    fontSize: 14,
  },
  addEventButton: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: colors.navy,
    elevation: 5,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  addEventGlyph: { width: 24, height: 24 },
  addEventGlyphBar: {
    position: "absolute",
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  addEventPlusHorizontal: { left: 0, top: 10.5, width: 24, height: 3 },
  addEventPlusVertical: { left: 10.5, top: 0, width: 3, height: 24 },
  addEventCloseBarOne: {
    left: 1,
    top: 10.5,
    width: 22,
    height: 3,
    transform: [{ rotate: "45deg" }],
  },
  addEventCloseBarTwo: {
    left: 1,
    top: 10.5,
    width: 22,
    height: 3,
    transform: [{ rotate: "-45deg" }],
  },
  momentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    minHeight: 68,
    padding: spacing.md,
    borderRadius: 16,
  },
  momentCopy: { flex: 1, gap: 2 },
  momentTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  momentEditLabel: { color: colors.navy, fontSize: 11, fontWeight: "700" },
  momentEditor: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#D6DEE6",
    borderRadius: 10,
  },
  editorLabel: { color: colors.navy, fontSize: 13, fontWeight: "700" },
  momentDateInput: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    color: colors.text,
    fontSize: 14,
    backgroundColor: colors.white,
  },
  companionInputRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  companionTitlePrefix: {
    minWidth: 66,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: "#F6F8FA",
  },
  companionTitleText: { color: colors.navy, fontSize: 14, fontWeight: "700" },
  companionNameInput: { flex: 1, minWidth: 0 },
  datePickerButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
    backgroundColor: colors.white,
  },
  datePickerText: { color: colors.text, fontSize: 14 },
  datePickerPlaceholder: { color: "#6F7C88" },
  calendarIcon: {
    width: 17,
    height: 17,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: 3,
  },
  calendarIconHeader: {
    height: 5,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.navy,
    backgroundColor: "#EAF2F8",
  },
  calendarPopup: {
    gap: spacing.xs,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  calendarNavButton: {
    width: 30,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#F0F4F7",
  },
  calendarNavText: {
    color: colors.navy,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "600",
  },
  calendarMonthTitle: { color: colors.navy, fontSize: 13, fontWeight: "700" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarWeekday: {
    width: "14.2857%",
    height: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarWeekdayText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  calendarDay: {
    width: "14.2857%",
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  calendarDayOutside: { opacity: 0.45 },
  calendarDaySelected: { backgroundColor: colors.navy },
  calendarDayText: { color: colors.text, fontSize: 13 },
  calendarDayOutsideText: { color: colors.textSecondary },
  calendarDaySelectedText: { color: colors.white, fontWeight: "700" },
  momentMeta: { color: colors.textSecondary, fontSize: 12 },
  returnHomeHint: { color: colors.textSecondary, fontSize: 12 },
  momentEditorActions: { flexDirection: "row", gap: spacing.sm },
  momentSaveButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: colors.navy,
  },
  momentSaveText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  momentCancelButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9,
  },
  momentCancelText: { color: colors.navy, fontSize: 14, fontWeight: "600" },
  momentSaveError: { color: "#A12626", fontSize: 13 },
  disabledButton: { opacity: 0.6 },
  mutedText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  homeLink: { color: colors.navy, fontSize: 16, fontWeight: "600" },
  pressed: { opacity: 0.78 },
});
