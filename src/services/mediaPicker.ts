import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { MediaFile } from '../models';

// NOTE (device): call ImagePicker.requestMediaLibraryPermissionsAsync()
// before opening the library on a real device; handle the denied case
// with a settings redirect. DocumentPicker needs no extra permission.

export async function pickVideo(): Promise<MediaFile | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: false,
    quality: 1,
  });
  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  const a = res.assets[0];
  return {
    path: a.uri,
    name: a.fileName ?? 'video.mp4',
    type: 'video',
    durationSeconds: a.duration != null ? a.duration / 1000 : undefined,
  };
}

export async function pickAudio(): Promise<MediaFile | null> {
  const res = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  const a = res.assets[0];
  return { path: a.uri, name: a.name, type: 'audio' };
}
