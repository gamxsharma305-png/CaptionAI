import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { KeyStatus } from '../src/services/keys';
import {
  getKeys,
  saveKeys,
  setOnboarded,
  verifyGeminiKey,
  verifyGroqKey,
} from '../src/services/keys';
import { theme } from '../src/theme';

const GROQ_KEYS_URL = 'https://console.groq.com/keys';
const GEMINI_KEYS_URL = 'https://aistudio.google.com/apikey';
const GROQ_TUTORIAL_URL = 'https://www.youtube.com/results?search_query=how+to+get+groq+api+key+free';
const GEMINI_TUTORIAL_URL =
  'https://www.youtube.com/results?search_query=how+to+get+gemini+api+key+free';

const GROQ_HELP_STEPS = [
  'Tap "Get my free Groq key" — it opens console.groq.com in your browser.',
  'Sign in with Google (about 2 minutes, just once).',
  'Tap "Create API Key", give it any name, then copy the key.',
  'Come back here and tap Paste — we fill it in for you.',
];

const GEMINI_HELP_STEPS = [
  'Tap "Get my free Gemini key" — it opens Google AI Studio.',
  'Sign in with your Google account.',
  'Tap "Create API key" and copy it.',
  'Come back here and tap Paste.',
];

function StatusDot({ status }: { status: KeyStatus }) {
  if (status === 'checking') {
    return <ActivityIndicator size="small" color={theme.colors.muted} />;
  }
  if (status === 'valid') {
    return (
      <View style={styles.dotOk}>
        <Text style={styles.dotOkText}>✓</Text>
      </View>
    );
  }
  if (status === 'invalid') {
    return (
      <View style={styles.dotBad}>
        <Text style={styles.dotBadText}>!</Text>
      </View>
    );
  }
  return <View style={styles.dotIdle} />;
}

interface KeyCardProps {
  step: string;
  title: string;
  subtitle: string;
  accent: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  status: KeyStatus;
  message: string;
  keyUrl: string;
  keyUrlLabel: string;
  helpSteps: string[];
  tutorialUrl: string;
  helpOpen: boolean;
  onToggleHelp: () => void;
  placeholder: string;
}

function KeyCard(p: KeyCardProps) {
  async function paste() {
    const text = await Clipboard.getStringAsync();
    if (text) p.onChange(text.trim());
  }

  return (
    <View style={[styles.card, { borderColor: p.accent + '55' }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.stepBadge, { backgroundColor: p.accent + '22' }]}>
          <Text style={[styles.stepText, { color: p.accent }]}>{p.step}</Text>
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.cardTitle}>{p.title}</Text>
          <Text style={styles.cardSub}>{p.subtitle}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.getKeyBtn, { borderColor: p.accent }]}
        onPress={() => Linking.openURL(p.keyUrl)}>
        <Text style={[styles.getKeyText, { color: p.accent }]}>{p.keyUrlLabel} →</Text>
      </Pressable>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={p.value}
          onChangeText={p.onChange}
          placeholder={p.placeholder}
          placeholderTextColor={theme.colors.muted}
          secureTextEntry={!p.show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable style={[styles.pasteBtn, { borderColor: p.accent }]} onPress={paste}>
          <Text style={[styles.pasteText, { color: p.accent }]}>Paste</Text>
        </Pressable>
        <Pressable style={styles.eyeBtn} onPress={p.onToggleShow} hitSlop={10}>
          <Text style={styles.eye}>{p.show ? '🙈' : '👁️'}</Text>
        </Pressable>
      </View>

      <View style={styles.statusRow}>
        <StatusDot status={p.status} />
        <Text
          style={[
            styles.statusText,
            p.status === 'valid' && styles.statusOk,
            p.status === 'invalid' && styles.statusBad,
          ]}>
          {p.status === 'idle'
            ? 'Waiting for key…'
            : p.status === 'checking'
              ? 'Verifying with provider…'
              : p.message}
        </Text>
      </View>

      <View style={styles.helpRow}>
        <Pressable onPress={p.onToggleHelp} hitSlop={8}>
          <Text style={styles.helpLink}>How to get it {p.helpOpen ? '▾' : '▸'}</Text>
        </Pressable>
        <Pressable
          style={styles.tutorialBtn}
          onPress={() => Linking.openURL(p.tutorialUrl)}>
          <Text style={styles.tutorialText}>▶ Watch tutorial</Text>
        </Pressable>
      </View>
      {p.helpOpen && (
        <View style={styles.helpBox}>
          {p.helpSteps.map((s, i) => (
            <Text key={i} style={styles.helpStep}>
              {i + 1}. {s}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

export default function SetupScreen() {
  const router = useRouter();
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showGroq, setShowGroq] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [groqHelp, setGroqHelp] = useState(false);
  const [geminiHelp, setGeminiHelp] = useState(false);
  const [groqStatus, setGroqStatus] = useState<KeyStatus>('idle');
  const [geminiStatus, setGeminiStatus] = useState<KeyStatus>('idle');
  const [groqMsg, setGroqMsg] = useState('');
  const [geminiMsg, setGeminiMsg] = useState('');
  const [finishing, setFinishing] = useState(false);

  // Pre-fill keys the user saved before (re-opened from settings).
  useEffect(() => {
    getKeys().then((k) => {
      if (k.groq) setGroqKey(k.groq);
      if (k.gemini) setGeminiKey(k.gemini);
    });
  }, []);

  // Live Groq verification (debounced) — the Continue button only
  // unlocks once this reports valid.
  useEffect(() => {
    if (!groqKey.trim()) {
      setGroqStatus('idle');
      setGroqMsg('');
      return;
    }
    setGroqStatus('checking');
    const t = setTimeout(async () => {
      const r = await verifyGroqKey(groqKey);
      setGroqStatus(r.ok ? 'valid' : 'invalid');
      setGroqMsg(r.message);
    }, 800);
    return () => clearTimeout(t);
  }, [groqKey]);

  // Live Gemini verification (optional — only when a key is entered).
  useEffect(() => {
    if (!geminiKey.trim()) {
      setGeminiStatus('idle');
      setGeminiMsg('');
      return;
    }
    setGeminiStatus('checking');
    const t = setTimeout(async () => {
      const r = await verifyGeminiKey(geminiKey);
      setGeminiStatus(r.ok ? 'valid' : 'invalid');
      setGeminiMsg(r.message);
    }, 800);
    return () => clearTimeout(t);
  }, [geminiKey]);

  const canContinue = groqStatus === 'valid' && !finishing;

  async function onContinue() {
    if (!canContinue) return;
    setFinishing(true);
    try {
      // One final fresh verification before we trust the key.
      const r = await verifyGroqKey(groqKey);
      if (!r.ok) {
        setGroqStatus('invalid');
        setGroqMsg(r.message);
        return;
      }
      await saveKeys(groqKey, geminiKey);
      await setOnboarded();
      router.replace('/');
    } finally {
      setFinishing(false);
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Set up CaptionAI</Text>
        </View>

        <Text style={styles.title}>One quick key to get started</Text>
        <Text style={styles.desc}>
          Your free Groq key is all you need — about 2 minutes, just once. Tap the button
          below, sign in with Google, copy your key and come back: we&apos;ll paste it for
          you. After this you only pick audio, a language and a style.
        </Text>

        <View style={styles.progressWrap}>
          <View style={styles.progressSeg} />
          <View style={[styles.progressSeg, styles.progressSegActive]} />
        </View>

        <Text style={styles.readyLine}>
          {groqStatus === 'valid' ? (
            <Text>
              Ready to go <Text style={styles.readyOk}>✅</Text>
              <Text style={styles.readySub}>  A free Gemini key as backup is recommended</Text>
            </Text>
          ) : (
            <Text style={styles.readySub}>Add your free Groq key below to get started</Text>
          )}
        </Text>

        <KeyCard
          step="1"
          title="YOUR FREE GROQ KEY"
          subtitle="Free · this is the only key you need to make videos."
          accent={theme.colors.mint}
          value={groqKey}
          onChange={setGroqKey}
          show={showGroq}
          onToggleShow={() => setShowGroq((s) => !s)}
          status={groqStatus}
          message={groqMsg}
          keyUrl={GROQ_KEYS_URL}
          keyUrlLabel="Get my free Groq key"
          helpSteps={GROQ_HELP_STEPS}
          tutorialUrl={GROQ_TUTORIAL_URL}
          helpOpen={groqHelp}
          onToggleHelp={() => setGroqHelp((v) => !v)}
          placeholder="Paste your Groq key"
        />

        <KeyCard
          step="✓"
          title="GEMINI KEY (OPTIONAL)"
          subtitle="Free with your Google account. Add it too, so your videos still work if Groq has a problem."
          accent={theme.colors.sky}
          value={geminiKey}
          onChange={setGeminiKey}
          show={showGemini}
          onToggleShow={() => setShowGemini((s) => !s)}
          status={geminiStatus}
          message={geminiMsg}
          keyUrl={GEMINI_KEYS_URL}
          keyUrlLabel="Get my free Gemini key"
          helpSteps={GEMINI_HELP_STEPS}
          tutorialUrl={GEMINI_TUTORIAL_URL}
          helpOpen={geminiHelp}
          onToggleHelp={() => setGeminiHelp((v) => !v)}
          placeholder="Paste your Gemini key (optional)"
        />

        <Text style={styles.privacy}>
          Data &amp; privacy note ▸{'\n'}
          <Text style={styles.privacySub}>
            Keys are stored only on your device (secure storage) and sent directly to
            Groq / Google. We never see them.
          </Text>
        </Text>

        <Pressable
          style={[styles.continueBtn, !canContinue && styles.continueDisabled]}
          disabled={!canContinue}
          onPress={onContinue}>
          {finishing ? (
            <ActivityIndicator color="#0B0B10" />
          ) : (
            <Text style={styles.continueText}>Verify &amp; continue →</Text>
          )}
        </Pressable>
        {!canContinue && !finishing && (
          <Text style={styles.continueHint}>
            {groqStatus === 'invalid'
              ? 'Fix the Groq key above — it must verify before you can continue.'
              : 'Enter and verify your Groq key to continue.'}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  backText: { color: theme.colors.text, fontSize: 20 },
  headerTitle: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: '800' },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginTop: theme.spacing.sm,
  },
  desc: { color: theme.colors.muted, fontSize: theme.fontSize.md, lineHeight: 24, marginTop: theme.spacing.sm },
  progressWrap: { flexDirection: 'row', gap: 8, marginTop: theme.spacing.lg },
  progressSeg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: theme.colors.border },
  progressSegActive: { backgroundColor: theme.colors.sky },
  readyLine: { marginTop: theme.spacing.md, fontSize: theme.fontSize.md, fontWeight: '700' },
  readyOk: { color: theme.colors.mint },
  readySub: { color: theme.colors.mint, fontWeight: '600' },
  card: {
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  stepBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  stepText: { fontSize: theme.fontSize.lg, fontWeight: '800' },
  titleWrap: { flex: 1 },
  cardTitle: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: '900' },
  cardSub: { color: theme.colors.muted, fontSize: theme.fontSize.sm, marginTop: 4, lineHeight: 20 },
  getKeyBtn: {
    borderWidth: 1.5,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  getKeyText: { fontSize: theme.fontSize.md, fontWeight: '800' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md, gap: theme.spacing.sm },
  input: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
  },
  pasteBtn: {
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  pasteText: { fontWeight: '800', fontSize: theme.fontSize.md },
  eyeBtn: { padding: 4 },
  eye: { fontSize: 24 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.md, gap: theme.spacing.sm },
  statusText: { color: theme.colors.muted, fontSize: theme.fontSize.sm, flex: 1 },
  statusOk: { color: theme.colors.mint, fontWeight: '700' },
  statusBad: { color: theme.colors.danger, fontWeight: '700' },
  dotIdle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.colors.border },
  dotOk: { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.colors.mint, alignItems: 'center', justifyContent: 'center' },
  dotOkText: { color: '#0B0B10', fontWeight: '900' },
  dotBad: { width: 26, height: 26, borderRadius: 13, backgroundColor: theme.colors.danger, alignItems: 'center', justifyContent: 'center' },
  dotBadText: { color: '#0B0B10', fontWeight: '900' },
  helpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.md },
  helpLink: { color: theme.colors.muted, fontWeight: '600' },
  tutorialBtn: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  tutorialText: { color: theme.colors.text, fontWeight: '600' },
  helpBox: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  helpStep: { color: theme.colors.muted, fontSize: theme.fontSize.sm, lineHeight: 22, marginBottom: 4 },
  privacy: { color: theme.colors.muted, fontWeight: '600', marginTop: theme.spacing.lg },
  privacySub: { fontWeight: '400', fontSize: theme.fontSize.sm },
  continueBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  continueDisabled: { backgroundColor: theme.colors.border, opacity: 0.7 },
  continueText: { color: '#0B0B10', fontSize: theme.fontSize.lg, fontWeight: '900' },
  continueHint: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.sm, fontSize: theme.fontSize.sm },
});
