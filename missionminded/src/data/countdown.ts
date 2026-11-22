import { parseMissionDate, type MissionaryDetails, type PhaseMoment } from '@/data/repository';

export type CountdownTarget = {
  /** What the countdown is to, like "home" or "the MTC". Shown after "DAYS UNTIL". */
  label: string;
  date: Date;
};

export type CountdownParts = { days: number; hours: number; minutes: number };

const coreLabels: Record<string, string> = {
  'core-mtc': 'the MTC',
  'core-serving': 'the field',
  'core-home': 'home',
};

function labelFor(moment: PhaseMoment): string {
  if (moment.id && coreLabels[moment.id]) return coreLabels[moment.id];
  return `${moment.title.charAt(0).toLowerCase()}${moment.title.slice(1)}`;
}

/** The next dated milestone on the missionary's timeline that hasn't happened yet. */
export function getNextMilestone(missionary: MissionaryDetails, now = new Date()): CountdownTarget | null {
  const upcoming = missionary.moments
    .map((moment) => ({ moment, date: parseMissionDate(moment.when) }))
    .filter((entry): entry is { moment: PhaseMoment; date: Date } => !!entry.date && entry.date.getTime() > now.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const next = upcoming[0];
  return next ? { label: labelFor(next.moment), date: next.date } : null;
}

export function getCountdownParts(target: Date, now = new Date()): CountdownParts {
  const totalMinutes = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 60000));
  return {
    days: Math.floor(totalMinutes / (60 * 24)),
    hours: Math.floor((totalMinutes % (60 * 24)) / 60),
    minutes: totalMinutes % 60,
  };
}
