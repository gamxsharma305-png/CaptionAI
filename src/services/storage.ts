import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MediaFile, Project } from '../models';

const KEY = '@captionai:projects';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function newProject(name: string, media?: MediaFile): Project {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    mediaPath: media?.path,
    mediaType: media?.type,
    words: [],
    styleId: 'karaoke-gold',
    language: 'en',
  };
}

export async function listProjects(): Promise<Project[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Project[];
    return parsed.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export async function getProject(id: string): Promise<Project | null> {
  const all = await listProjects();
  return all.find((p) => p.id === id) ?? null;
}

export async function saveProject(project: Project): Promise<void> {
  const all = await listProjects();
  const next = { ...project, updatedAt: new Date().toISOString() };
  const idx = all.findIndex((p) => p.id === project.id);
  if (idx >= 0) all[idx] = next;
  else all.unshift(next);
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function deleteProject(id: string): Promise<void> {
  const all = await listProjects();
  await AsyncStorage.setItem(KEY, JSON.stringify(all.filter((p) => p.id !== id)));
}
