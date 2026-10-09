import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KineticPreview } from '../src/components/KineticPreview';
import { StylePicker } from '../src/components/StylePicker';
import type { CaptionStyle, Project } from '../src/models';
import { getProject, saveProject } from '../src/services/storage';
import {
  EXPORT_PRESETS,
  exportProject,
  type ExportPreset,
} from '../src/services/export';
import {
  deleteCustomStyle,
  findStyle,
  getAllStyles,
  isCustomStyle,
  listCustomStyles,
  newCustomStyleId,
  saveCustomStyle,
} from '../src/services/customStyles';
import { theme } from '../src/theme';

const SWATCHES = [
  '#FFFFFF',
  '#0B0B10',
  '#E8FF47',
  '#FFC531',
  '#FF7AC6',
  '#22D3EE',
  '#8B5CF6',
  '#4ADE80',
  '#FF5C5C',
  '#FF8A00',
];

function SwatchRow({
  label,
  value,
  onPick,
}: {
  label: string;
  value: string;
  onPick: (c: string) => void;
}) {
  return (
    <View style={styles.editBlock}>
      <Text style={styles.editLabel}>
        {label}: <Text style={styles.editValue}>{value}</Text>
      </Text>
      <View style={styles.swatchRow}>
        {SWATCHES.map((c) => (
          <Pressable
            key={c}
            onPress={() => onPick(c)}
            style={[
              styles.swatch,
              { backgroundColor: c },
              value.toLowerCase() === c.toLowerCase() && styles.swatchActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

export default function ExportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [custom, setCustom] = useState<CaptionStyle[]>([]);
  const [styleId, setStyleId] = useState('karaoke-gold');
  const [preset, setPreset] = useState<ExportPreset>('1080p');
  const [progress, setProgress] = useState<number | null>(null);
  const [output, setOutput] = useState('');
  const [editing, setEditing] = useState<CaptionStyle | null>(null);

  const reload = useCallback(async () => {
    const c = await listCustomStyles();
    setCustom(c);
    if (id) {
      const p = await getProject(id);
      setProject(p);
      if (p) {
        setStyleId(p.styleId);
        if (p.format === 'reel') setPreset('reel');
      }
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const allStyles = getAllStyles(custom);

  async function selectStyle(nextId: string) {
    setStyleId(nextId);
    if (project) {
      const next = { ...project, styleId: nextId };
      await saveProject(next);
      setProject(next);
    }
  }

  function openEditor(idToEdit: string) {
    const base = findStyle(idToEdit, custom);
    // Editing a built-in creates a new custom style; editing a custom one keeps its id.
    const draft: CaptionStyle = isCustomStyle(idToEdit, custom)
      ? { ...base }
      : { ...base, id: newCustomStyleId(), name: `${base.name} (custom)` };
    setEditing(draft);
  }

  async function saveEditedStyle() {
    if (!editing) return;
    await saveCustomStyle(editing);
    const c = await listCustomStyles();
    setCustom(c);
    await selectStyle(editing.id);
    setEditing(null);
  }

  async function deleteEditedStyle() {
    if (!editing || !isCustomStyle(editing.id, custom)) return;
    await deleteCustomStyle(editing.id);
    const c = await listCustomStyles();
    setCustom(c);
    await selectStyle('karaoke-gold');
    setEditing(null);
  }

  function bumpFontSize(delta: number) {
    setEditing((e) => (e ? { ...e, fontSize: Math.min(72, Math.max(12, e.fontSize + delta)) } : e));
  }

  function cycleBg() {
    setEditing((e) => {
      if (!e) return e;
      const order: Array<CaptionStyle['background']['type']> = ['none', 'pill', 'box'];
      const next = order[(order.indexOf(e.background.type) + 1) % order.length];
      return { ...e, background: { ...e.background, type: next } };
    });
  }

  async function runExport() {
    if (!project || project.words.length === 0) {
      setOutput('Nothing to export — transcribe captions first.');
      return;
    }
    setProgress(0);
    setOutput('');
    try {
      const result = await exportProject(project, findStyle(styleId, custom), {
        preset,
        onProgress: setProgress,
      });
      setOutput(`Done. Output: ${result.outputPath}`);
    } catch (e) {
      setOutput(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setProgress(null);
    }
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const style = findStyle(styleId, custom);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <KineticPreview words={project.words.slice(0, 24)} style={style} />

      <View style={styles.sectionRow}>
        <Text style={styles.section}>Style</Text>
        <Pressable onPress={() => openEditor(styleId)}>
          <Text style={styles.editLink}>Customize ✎</Text>
        </Pressable>
      </View>
      <StylePicker
        selectedId={styleId}
        onSelect={selectStyle}
        extraStyles={custom}
        onEditStyle={openEditor}
      />
      <Text style={styles.hint}>Long-press any style to customize it.</Text>

      <Text style={styles.section}>Export preset</Text>
      <View style={styles.presets}>
        {EXPORT_PRESETS.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setPreset(p.id)}
            style={[styles.presetBtn, preset === p.id && styles.presetActive]}>
            <Text style={[styles.presetLabel, preset === p.id && styles.presetLabelActive]}>
              {p.label}
            </Text>
            <Text style={styles.presetHint}>{p.hint}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.exportBtn} onPress={runExport}>
        <Text style={styles.exportText}>Export video</Text>
      </Pressable>

      {progress != null && (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}
      {output ? <Text style={styles.output}>{output}</Text> : null}
      <Text style={styles.footnote}>
        Burn-in runs on-device with an FFmpeg binding (see src/services/export.ts TODO).
      </Text>

      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Customize style</Text>
              {editing && (
                <KineticPreview words={[{ id: 'e1', text: 'Preview', start: 0, end: 1 }, { id: 'e2', text: 'text', start: 1, end: 2 }]} style={editing} fontScale={0.6} durationMs={2000} />
              )}
              {editing && (
                <>
                  <SwatchRow label="Text color" value={editing.textColor} onPick={(c) => setEditing({ ...editing, textColor: c })} />
                  <SwatchRow label="Highlight color" value={editing.highlightColor} onPick={(c) => setEditing({ ...editing, highlightColor: c })} />
                  <View style={styles.editBlock}>
                    <Text style={styles.editLabel}>
                      Font size: <Text style={styles.editValue}>{editing.fontSize}</Text>
                    </Text>
                    <View style={styles.stepper}>
                      <Pressable style={styles.stepBtn} onPress={() => bumpFontSize(-2)}>
                        <Text style={styles.stepText}>−</Text>
                      </Pressable>
                      <Pressable style={styles.stepBtn} onPress={() => bumpFontSize(2)}>
                        <Text style={styles.stepText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.editBlock}>
                    <Text style={styles.editLabel}>Background</Text>
                    <Pressable style={styles.cycleBtn} onPress={cycleBg}>
                      <Text style={styles.cycleText}>{editing.background.type} (tap to change)</Text>
                    </Pressable>
                  </View>
                  <Pressable style={styles.saveBtn} onPress={saveEditedStyle}>
                    <Text style={styles.saveText}>Save style</Text>
                  </Pressable>
                  {isCustomStyle(editing.id, custom) && (
                    <Pressable style={styles.deleteBtn} onPress={deleteEditedStyle}>
                      <Text style={styles.deleteText}>Delete custom style</Text>
                    </Pressable>
                  )}
                  <Pressable style={styles.cancelBtn} onPress={() => setEditing(null)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md },
  center: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  section: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: '800' },
  editLink: { color: theme.colors.primary, fontWeight: '700' },
  hint: { color: theme.colors.muted, fontSize: theme.fontSize.xs, marginTop: 4 },
  presets: { flexDirection: 'row', gap: theme.spacing.sm },
  presetBtn: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  presetActive: { borderColor: theme.colors.primary, backgroundColor: '#22220F' },
  presetLabel: { color: theme.colors.muted, fontWeight: '700', fontSize: theme.fontSize.sm },
  presetLabelActive: { color: theme.colors.primary },
  presetHint: { color: theme.colors.muted, fontSize: theme.fontSize.xs, marginTop: 2 },
  exportBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  exportText: { color: '#0B0B10', fontWeight: '800', fontSize: theme.fontSize.md },
  progressTrack: { height: 6, backgroundColor: theme.colors.border, borderRadius: 3, marginTop: theme.spacing.md },
  progressFill: { height: 6, backgroundColor: theme.colors.primary, borderRadius: 3 },
  output: { color: theme.colors.text, marginTop: theme.spacing.md, fontSize: theme.fontSize.sm },
  footnote: { color: theme.colors.muted, fontSize: theme.fontSize.xs, marginTop: theme.spacing.md },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalScroll: { justifyContent: 'flex-end', flexGrow: 1 },
  modal: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  modalTitle: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: '800', marginBottom: theme.spacing.md },
  editBlock: { marginTop: theme.spacing.md },
  editLabel: { color: theme.colors.muted, fontSize: theme.fontSize.sm, marginBottom: theme.spacing.sm },
  editValue: { color: theme.colors.text, fontWeight: '700' },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: theme.colors.border },
  swatchActive: { borderColor: theme.colors.primary },
  stepper: { flexDirection: 'row', gap: theme.spacing.sm },
  stepBtn: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: 52,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  cycleBtn: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  cycleText: { color: theme.colors.text, fontWeight: '600', textTransform: 'capitalize' },
  saveBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.md, padding: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.lg },
  saveText: { color: '#0B0B10', fontWeight: '800' },
  deleteBtn: { padding: theme.spacing.md, alignItems: 'center' },
  deleteText: { color: theme.colors.danger, fontWeight: '600' },
  cancelBtn: { padding: theme.spacing.sm, alignItems: 'center' },
  cancelText: { color: theme.colors.muted, fontWeight: '600' },
});
