import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Project } from '../src/models';
import { getProject, saveProject } from '../src/services/storage';
import {
  MockTranscriptionService,
  WhisperTranscriptionService,
} from '../src/services/transcription';
import { theme } from '../src/theme';

export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (id) getProject(id).then(setProject);
  }, [id]);

  const player = useVideoPlayer(project?.mediaPath ?? '', (p) => {
    p.loop = false;
  });

  async function autoTranscribe() {
    if (!project?.mediaPath) {
      setNote('Import media first.');
      return;
    }
    setTranscribing(true);
    setNote('');
    try {
      const service = WhisperTranscriptionService.isConfigured()
        ? new WhisperTranscriptionService()
        : new MockTranscriptionService();
      if (!WhisperTranscriptionService.isConfigured()) {
        setNote('No Whisper key found — using demo transcription.');
      }
      const words = await service.transcribe(project.mediaPath, project.language);
      const next = { ...project, words };
      await saveProject(next);
      setProject(next);
      setNote(`Transcribed ${words.length} words.`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Transcription failed.');
    } finally {
      setTranscribing(false);
    }
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  const isVideo = project.mediaType === 'video' && project.mediaPath;

  return (
    <View style={styles.root}>
      {isVideo ? (
        <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture />
      ) : (
        <View style={styles.audioBox}>
          <Text style={styles.audioName}>{project.name}</Text>
          <Text style={styles.muted}>Audio project — no video preview</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.muted}>
          {project.words.length} words · {project.mediaType ?? 'no media'}
        </Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, styles.primaryBtn, transcribing && styles.disabled]}
          disabled={transcribing}
          onPress={autoTranscribe}>
          {transcribing ? (
            <ActivityIndicator color="#0B0B10" />
          ) : (
            <Text style={styles.primaryText}>Auto Transcribe</Text>
          )}
        </Pressable>
        <Pressable
          style={styles.btn}
          onPress={() => router.push({ pathname: '/editor', params: { id: project.id } })}>
          <Text style={styles.btnText}>Edit Captions</Text>
        </Pressable>
        <Pressable
          style={styles.btn}
          onPress={() => router.push({ pathname: '/export', params: { id: project.id } })}>
          <Text style={styles.btnText}>Export</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center' },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  audioBox: {
    aspectRatio: 16 / 9,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioName: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: '700' },
  muted: { color: theme.colors.muted, marginTop: 4 },
  info: { padding: theme.spacing.md },
  title: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: '800' },
  note: { color: theme.colors.gold, marginTop: theme.spacing.sm, fontSize: theme.fontSize.sm },
  actions: { padding: theme.spacing.md, gap: theme.spacing.sm },
  btn: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnText: { color: theme.colors.text, fontWeight: '700' },
  primaryBtn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  primaryText: { color: '#0B0B10', fontWeight: '800' },
  disabled: { opacity: 0.6 },
});
