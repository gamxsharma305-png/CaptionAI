import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { CaptionWord, Project } from '../src/models';
import { getProject, saveProject } from '../src/services/storage';
import { theme } from '../src/theme';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [editing, setEditing] = useState<CaptionWord | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const chipX = useRef<Record<string, number>>({});

  useEffect(() => {
    if (id) getProject(id).then(setProject);
  }, [id]);

  // Mock playback clock, 100ms ticks.
  useEffect(() => {
    if (!playing) return;
    const t0 = Date.now() - time * 1000;
    const total = project?.words.reduce((m, w) => Math.max(m, w.end), 0) ?? 0;
    const tick = setInterval(() => {
      const t = (Date.now() - t0) / 1000;
      if (t >= total && total > 0) {
        setPlaying(false);
        setTime(0);
        clearInterval(tick);
        return;
      }
      setTime(t);
    }, 100);
    return () => clearInterval(tick);
  }, [playing, project]);

  const activeId = useMemo(() => {
    if (!project) return null;
    return project.words.find((w) => time >= w.start && time < w.end)?.id ?? null;
  }, [project, time]);

  useEffect(() => {
    if (activeId && chipX.current[activeId] != null) {
      scrollRef.current?.scrollTo({ x: Math.max(0, chipX.current[activeId] - 120), animated: true });
    }
  }, [activeId]);

  async function persist(words: CaptionWord[]) {
    if (!project) return;
    const next = { ...project, words };
    await saveProject(next);
    setProject(next);
  }

  function openEditor(word: CaptionWord) {
    setEditing(word);
    setDraftText(word.text);
    setDraftStart(String(word.start));
    setDraftEnd(String(word.end));
  }

  function saveEdit() {
    if (!editing || !project) return;
    const start = parseFloat(draftStart);
    const end = parseFloat(draftEnd);
    const words = project.words.map((w) =>
      w.id === editing.id
        ? { ...w, text: draftText.trim() || w.text, start: isNaN(start) ? w.start : start, end: isNaN(end) ? w.end : end }
        : w,
    );
    persist(words);
    setEditing(null);
  }

  function deleteWord() {
    if (!editing || !project) return;
    persist(project.words.filter((w) => w.id !== editing.id));
    setEditing(null);
  }

  function addWord() {
    if (!project) return;
    const lastEnd = project.words.reduce((m, w) => Math.max(m, w.end), 0);
    persist([...project.words, { id: uid(), text: 'new', start: lastEnd, end: lastEnd + 0.6 }]);
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.transport}>
        <Pressable style={styles.playBtn} onPress={() => setPlaying((p) => !p)}>
          <Text style={styles.playText}>{playing ? 'Pause' : 'Play'}</Text>
        </Pressable>
        <Text style={styles.time}>{time.toFixed(1)}s</Text>
        <Pressable style={styles.addBtn} onPress={addWord}>
          <Text style={styles.addText}>+ Word</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        contentContainerStyle={styles.timeline}
        showsHorizontalScrollIndicator={false}>
        {project.words.map((w) => {
          const active = w.id === activeId;
          return (
            <Pressable
              key={w.id}
              onLayout={(e) => {
                chipX.current[w.id] = e.nativeEvent.layout.x;
              }}
              onPress={() => openEditor(w)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{w.text}</Text>
              <Text style={styles.chipTime}>
                {w.start.toFixed(1)}–{w.end.toFixed(1)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {project.words.length === 0 && (
        <Text style={styles.hint}>No words yet — run Auto Transcribe on the Player screen.</Text>
      )}

      <Pressable style={styles.done} onPress={() => router.back()}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>

      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit word</Text>
            <Text style={styles.label}>Text</Text>
            <TextInput style={styles.input} value={draftText} onChangeText={setDraftText} />
            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Start (s)</Text>
                <TextInput
                  style={styles.input}
                  value={draftStart}
                  onChangeText={setDraftStart}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>End (s)</Text>
                <TextInput
                  style={styles.input}
                  value={draftEnd}
                  onChangeText={setDraftEnd}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <Pressable style={styles.saveBtn} onPress={saveEdit}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={deleteWord}>
              <Text style={styles.deleteText}>Delete word</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => setEditing(null)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  playBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  playText: { color: '#0B0B10', fontWeight: '800' },
  time: { color: theme.colors.text, fontVariant: ['tabular-nums'] },
  addBtn: {
    marginLeft: 'auto',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addText: { color: theme.colors.text, fontWeight: '600' },
  timeline: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, alignItems: 'center' },
  chip: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: 72,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.text, fontWeight: '700' },
  chipTextActive: { color: '#0B0B10' },
  chipTime: { color: theme.colors.muted, fontSize: theme.fontSize.xs, marginTop: 2 },
  hint: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.lg },
  done: {
    margin: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  doneText: { color: '#0B0B10', fontWeight: '800' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  modalTitle: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: '800', marginBottom: theme.spacing.md },
  label: { color: theme.colors.muted, fontSize: theme.fontSize.sm, marginBottom: 4, marginTop: theme.spacing.sm },
  input: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  half: { flex: 1 },
  saveBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, padding: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.lg },
  saveText: { color: '#0B0B10', fontWeight: '800' },
  deleteBtn: { padding: theme.spacing.md, alignItems: 'center' },
  deleteText: { color: theme.colors.danger, fontWeight: '600' },
  cancelBtn: { padding: theme.spacing.sm, alignItems: 'center' },
  cancelText: { color: theme.colors.muted, fontWeight: '600' },
});
