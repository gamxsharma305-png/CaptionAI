import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KineticPreview } from '../src/components/KineticPreview';
import type { MediaFile, Project } from '../src/models';
import {
  deleteProject,
  duplicateProject,
  listProjects,
  newProject,
  saveProject,
} from '../src/services/storage';
import { pickAudio, pickVideo } from '../src/services/mediaPicker';
import { CAPTION_STYLES } from '../src/styles/captionStyles';
import { theme } from '../src/theme';

const HERO_WORDS = [
  { id: 'h1', text: 'Words', start: 0, end: 0.8 },
  { id: 'h2', text: 'in', start: 0.8, end: 1.2 },
  { id: 'h3', text: 'motion.', start: 1.2, end: 2.4 },
];

function ProjectCard({
  project,
  onOpen,
  onDelete,
  onDuplicate,
}: {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const date = new Date(project.updatedAt).toLocaleDateString();
  return (
    <Pressable onPress={onOpen} style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.cardName} numberOfLines={1}>
              {project.name}
            </Text>
            {project.format === 'reel' && <Text style={styles.reelBadge}>9:16</Text>}
          </View>
          <Text style={styles.cardMeta}>
            {date} · {project.words.length} words · {project.mediaType ?? 'no media'}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable hitSlop={12} onPress={onDuplicate}>
            <Text style={styles.duplicate}>Duplicate</Text>
          </Pressable>
          <Pressable
            hitSlop={12}
            onPress={() =>
              Alert.alert('Delete project', `Delete "${project.name}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
              ])
            }>
            <Text style={styles.delete}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setProjects(await listProjects());
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  async function createFromMedia(media: MediaFile | null) {
    if (!media) return;
    setBusy(true);
    try {
      const project = newProject(media.name.replace(/\.[a-z0-9]+$/i, ''), media);
      await saveProject(project);
      setSheetOpen(false);
      router.push({ pathname: '/player', params: { id: project.id } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              hitSlop={12}
              onPress={() => router.push('/setup')}
              style={styles.gear}>
              <Text style={styles.gearText}>⚙️</Text>
            </Pressable>
          ),
        }}
      />

      {projects.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.heroTitle}>CaptionAI</Text>
          <Text style={styles.heroSub}>AI captions with kinetic typography</Text>
          <KineticPreview words={HERO_WORDS} style={CAPTION_STYLES[0]} durationMs={2400} />
          <Text style={styles.emptyHint}>Import a video to create your first project.</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onOpen={() => router.push({ pathname: '/player', params: { id: item.id } })}
              onDelete={async () => {
                await deleteProject(item.id);
                reload();
              }}
              onDuplicate={async () => {
                await duplicateProject(item.id);
                reload();
              }}
            />
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={() => setSheetOpen(true)}>
        <Text style={styles.fabText}>+ New Project</Text>
      </Pressable>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New Project</Text>
            <Pressable
              style={[styles.sheetBtn, busy && styles.disabled]}
              disabled={busy}
              onPress={async () => createFromMedia(await pickVideo())}
              >
              <Text style={styles.sheetBtnText}>Import video</Text>
            </Pressable>
            <Pressable
              style={[styles.sheetBtn, busy && styles.disabled]}
              disabled={busy}
              onPress={async () => createFromMedia(await pickAudio())}>
              <Text style={styles.sheetBtnText}>Import audio</Text>
            </Pressable>
            <Pressable
              style={[styles.sheetBtn, styles.reelBtn]}
              onPress={() => {
                setSheetOpen(false);
                router.push('/reel');
              }}>
              <Text style={styles.sheetBtnText}>✨ New 9:16 Reel</Text>
            </Pressable>
            <Pressable style={styles.sheetCancel} onPress={() => setSheetOpen(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  gear: { marginRight: 4, padding: 6 },
  gearText: { fontSize: 22 },
  list: { padding: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardInfo: { flex: 1, marginRight: theme.spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  cardName: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: '700', flexShrink: 1 },
  reelBadge: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: '800',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardMeta: { color: theme.colors.muted, fontSize: theme.fontSize.sm, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' },
  duplicate: { color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: '600' },
  delete: { color: theme.colors.danger, fontSize: theme.fontSize.sm, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', padding: theme.spacing.lg },
  heroTitle: {
    color: theme.colors.text,
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
  },
  heroSub: { color: theme.colors.muted, textAlign: 'center', marginVertical: theme.spacing.sm },
  emptyHint: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.md },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.lg,
    left: theme.spacing.md,
    right: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  fabText: { color: '#0B0B10', fontWeight: '800', fontSize: theme.fontSize.md },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  sheetTitle: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: '800', marginBottom: theme.spacing.md },
  sheetBtn: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reelBtn: { borderColor: theme.colors.primary },
  sheetBtnText: { color: theme.colors.text, fontWeight: '600', textAlign: 'center' },
  sheetCancel: { padding: theme.spacing.md, alignItems: 'center' },
  sheetCancelText: { color: theme.colors.muted, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
