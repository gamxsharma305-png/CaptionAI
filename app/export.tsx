import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KineticPreview } from '../src/components/KineticPreview';
import { StylePicker } from '../src/components/StylePicker';
import type { Project } from '../src/models';
import { getProject, saveProject } from '../src/services/storage';
import { exportProject, type ExportResolution } from '../src/services/export';
import { getStyleById } from '../src/styles/captionStyles';
import { theme } from '../src/theme';

export default function ExportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [styleId, setStyleId] = useState('karaoke-gold');
  const [resolution, setResolution] = useState<ExportResolution>('1080p');
  const [progress, setProgress] = useState<number | null>(null);
  const [output, setOutput] = useState('');

  useEffect(() => {
    if (id) {
      getProject(id).then((p) => {
        setProject(p);
        if (p) setStyleId(p.styleId);
      });
    }
  }, [id]);

  async function selectStyle(nextId: string) {
    setStyleId(nextId);
    if (project) {
      const next = { ...project, styleId: nextId };
      await saveProject(next);
      setProject(next);
    }
  }

  async function runExport() {
    if (!project || project.words.length === 0) {
      setOutput('Nothing to export — transcribe captions first.');
      return;
    }
    setProgress(0);
    setOutput('');
    try {
      const result = await exportProject(project, getStyleById(styleId), {
        resolution,
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

  const style = getStyleById(styleId);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <KineticPreview words={project.words.slice(0, 24)} style={style} />

      <Text style={styles.section}>Style</Text>
      <StylePicker selectedId={styleId} onSelect={selectStyle} />

      <Text style={styles.section}>Resolution</Text>
      <View style={styles.seg}>
        {(['720p', '1080p'] as ExportResolution[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => setResolution(r)}
            style={[styles.segBtn, resolution === r && styles.segBtnActive]}>
            <Text style={[styles.segText, resolution === r && styles.segTextActive]}>{r}</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md },
  center: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  section: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: '800',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  seg: { flexDirection: 'row', gap: theme.spacing.sm },
  segBtn: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segBtnActive: { borderColor: theme.colors.primary, backgroundColor: '#22220F' },
  segText: { color: theme.colors.muted, fontWeight: '700' },
  segTextActive: { color: theme.colors.primary },
  exportBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  exportText: { color: '#0B0B10', fontWeight: '800', fontSize: theme.fontSize.md },
  progressTrack: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginTop: theme.spacing.md,
  },
  progressFill: { height: 6, backgroundColor: theme.colors.primary, borderRadius: 3 },
  output: { color: theme.colors.text, marginTop: theme.spacing.md, fontSize: theme.fontSize.sm },
  footnote: { color: theme.colors.muted, fontSize: theme.fontSize.xs, marginTop: theme.spacing.md },
});
