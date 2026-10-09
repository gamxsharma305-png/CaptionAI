import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KineticPreview } from '../src/components/KineticPreview';
import type { AppFontFamily } from '../src/fonts';
import type { CaptionAnimation, CaptionStyle, CaptionWord } from '../src/models';
import { newCustomStyleId, saveCustomStyle } from '../src/services/customStyles';
import { newProject, saveProject } from '../src/services/storage';
import { theme } from '../src/theme';

const REEL_FONTS: Array<{ label: string; family: AppFontFamily }> = [
  { label: 'Inter', family: 'Inter_800ExtraBold' },
  { label: 'Bebas', family: 'BebasNeue_400Regular' },
  { label: 'Anton', family: 'Anton_400Regular' },
  { label: 'Archivo', family: 'Archivo_900Black' },
  { label: 'Poppins', family: 'Poppins_800ExtraBold' },
  { label: 'Oswald', family: 'Oswald_600SemiBold' },
  { label: 'Playfair', family: 'PlayfairDisplay_700Bold' },
  { label: 'Pacifico', family: 'Pacifico_400Regular' },
  { label: 'Montserrat', family: 'Montserrat_700Bold' },
  { label: 'Mono', family: 'SpaceMono_700Bold' },
];

const REEL_ANIMATIONS: Array<{ id: CaptionAnimation; label: string }> = [
  { id: 'karaoke', label: 'Karaoke' },
  { id: 'pop', label: 'Pop' },
  { id: 'typewriter', label: 'Typewriter' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'glow-pulse', label: 'Glow' },
  { id: 'fade-up', label: 'Fade up' },
  { id: 'scale-punch', label: 'Punch' },
  { id: 'word-highlight', label: 'Highlight' },
  { id: 'slide-in', label: 'Slide in' },
  { id: 'neon-flicker', label: 'Neon' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'outline', label: 'Outline' },
];

interface ReelBg {
  id: string;
  name: string;
  kind: 'solid' | 'gradient';
  colors: [string, string];
}

const REEL_BGS: ReelBg[] = [
  { id: 'black', name: 'Black', kind: 'solid', colors: ['#000000', '#000000'] },
  { id: 'ink', name: 'Ink', kind: 'solid', colors: ['#0B0B10', '#0B0B10'] },
  { id: 'navy', name: 'Navy', kind: 'solid', colors: ['#1E1B4B', '#1E1B4B'] },
  { id: 'sunset', name: 'Sunset', kind: 'gradient', colors: ['#FF6B6B', '#8B5CF6'] },
  { id: 'ocean', name: 'Ocean', kind: 'gradient', colors: ['#0EA5E9', '#312E81'] },
  { id: 'lime', name: 'Lime', kind: 'gradient', colors: ['#365314', '#0B0B10'] },
];

const SCREEN_W = Dimensions.get('window').width;
const CANVAS_W = Math.min(SCREEN_W * 0.64, 300);

function wordsFromText(text: string): CaptionWord[] {
  const tokens = text.split(/\s+/).filter(Boolean).slice(0, 40);
  let t = 0.3;
  return tokens.map((word, i) => {
    const start = t;
    const end = t + 0.55;
    t = end + 0.08;
    return { id: `r${i}`, text: word, start, end };
  });
}

export default function ReelScreen() {
  const router = useRouter();
  const [text, setText] = useState('Your words in motion');
  const [font, setFont] = useState<AppFontFamily>('Anton_400Regular');
  const [animation, setAnimation] = useState<CaptionAnimation>('pop');
  const [bgId, setBgId] = useState('sunset');
  const [saving, setSaving] = useState(false);

  const words = useMemo(() => wordsFromText(text || 'Your words in motion'), [text]);
  const bg = REEL_BGS.find((b) => b.id === bgId) ?? REEL_BGS[0];
  const fontLabel = REEL_FONTS.find((f) => f.family === font)?.label ?? 'Custom';

  const reelStyle: CaptionStyle = useMemo(
    () => ({
      id: 'reel-preview',
      name: 'Reel style',
      tagline: '',
      fontFamily: font,
      fontSize: 44,
      fontWeight: '800',
      textColor: '#FFFFFF',
      highlightColor: theme.colors.primary,
      background: { type: 'pill', color: 'rgba(0,0,0,0.45)', radius: 14, padding: 12 },
      stroke: { color: '#000000', width: 2 },
      animation,
      uppercase: true,
    }),
    [font, animation],
  );

  async function useInProject() {
    if (saving) return;
    setSaving(true);
    try {
      const style: CaptionStyle = {
        ...reelStyle,
        id: newCustomStyleId(),
        name: `Reel · ${fontLabel} ${animation}`,
      };
      await saveCustomStyle(style);
      const title = text.trim().split(/\s+/).slice(0, 4).join(' ') || 'Untitled reel';
      const project = newProject(title, undefined, 'reel');
      project.words = words;
      project.styleId = style.id;
      await saveProject(project);
      router.push({ pathname: '/export', params: { id: project.id } });
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Reel Studio</Text>
      <Text style={styles.sub}>Design a 9:16 typography reel — pick a font, an animation and a background.</Text>

      <View style={styles.canvasWrap}>
        <LinearGradient
          colors={bg.colors}
          style={[styles.canvas, { width: CANVAS_W, height: CANVAS_W * (16 / 9) }]}>
          <View style={styles.canvasInner}>
            <KineticPreview words={words} style={reelStyle} bare fontScale={0.85} />
          </View>
        </LinearGradient>
        <Text style={styles.canvasLabel}>1080 × 1920 preview</Text>
      </View>

      <Text style={styles.section}>Text</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        multiline
        placeholder="Type your reel text…"
        placeholderTextColor={theme.colors.muted}
      />

      <Text style={styles.section}>Font</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {REEL_FONTS.map((f) => (
          <Pressable
            key={f.family}
            onPress={() => setFont(f.family)}
            style={[styles.chip, font === f.family && styles.chipActive]}>
            <Text style={[styles.chipSample, { fontFamily: f.family }]}>Ag</Text>
            <Text style={[styles.chipLabel, font === f.family && styles.chipLabelActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.section}>Animation</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {REEL_ANIMATIONS.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => setAnimation(a.id)}
            style={[styles.pill, animation === a.id && styles.pillActive]}>
            <Text style={[styles.pillText, animation === a.id && styles.pillTextActive]}>{a.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.section}>Background</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {REEL_BGS.map((b) => (
          <Pressable
            key={b.id}
            onPress={() => setBgId(b.id)}
            style={[styles.bgChip, bgId === b.id && styles.bgChipActive]}>
            <LinearGradient colors={b.colors} style={styles.bgSwatch} />
            <Text style={styles.bgLabel}>{b.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={[styles.useBtn, saving && styles.disabled]} disabled={saving} onPress={useInProject}>
        <Text style={styles.useText}>{saving ? 'Creating…' : 'Use in project →'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  heading: { color: theme.colors.text, fontSize: theme.fontSize.xl, fontWeight: '900' },
  sub: { color: theme.colors.muted, marginTop: 4, marginBottom: theme.spacing.md },
  canvasWrap: { alignItems: 'center', marginVertical: theme.spacing.sm },
  canvas: { borderRadius: 18, overflow: 'hidden', justifyContent: 'center' },
  canvasInner: { padding: theme.spacing.lg },
  canvasLabel: { color: theme.colors.muted, fontSize: theme.fontSize.xs, marginTop: 6 },
  section: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: '800', marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 76,
    textAlignVertical: 'top',
  },
  row: { flexDirection: 'row', marginHorizontal: -theme.spacing.md, paddingHorizontal: theme.spacing.md },
  chip: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
    minWidth: 76,
  },
  chipActive: { borderColor: theme.colors.primary },
  chipSample: { color: theme.colors.text, fontSize: 26 },
  chipLabel: { color: theme.colors.muted, fontSize: theme.fontSize.xs, marginTop: 4 },
  chipLabelActive: { color: theme.colors.primary, fontWeight: '700' },
  pill: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
  },
  pillActive: { borderColor: theme.colors.primary, backgroundColor: '#22220F' },
  pillText: { color: theme.colors.muted, fontWeight: '600' },
  pillTextActive: { color: theme.colors.primary },
  bgChip: {
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: 4,
  },
  bgChipActive: { borderColor: theme.colors.primary },
  bgSwatch: { width: 56, height: 56, borderRadius: 12 },
  bgLabel: { color: theme.colors.muted, fontSize: theme.fontSize.xs, marginTop: 4 },
  useBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  useText: { color: '#0B0B10', fontWeight: '800', fontSize: theme.fontSize.md },
  disabled: { opacity: 0.6 },
});
