import type { CaptionStyle, CaptionWord, Project } from '../models';

export type ExportPreset = '720p' | '1080p' | 'reel';

export const EXPORT_PRESETS: Array<{ id: ExportPreset; label: string; hint: string }> = [
  { id: '720p', label: '16:9 · 720p', hint: 'Fast, small file' },
  { id: '1080p', label: '16:9 · 1080p', hint: 'Full HD video' },
  { id: 'reel', label: '9:16 · Reel', hint: '1080×1920 vertical' },
];

export interface ExportResult {
  srt: string;
  ass: string;
  /** FFmpeg argument list for burning the ASS subtitles into the video. */
  command: string[];
  outputPath: string;
}

function pad(n: number, len = 2): string {
  return Math.floor(n).toString().padStart(len, '0');
}

function srtTime(sec: number): string {
  const ms = Math.round(sec * 1000);
  return `${pad(ms / 3600000)}:${pad(ms / 60000)}:${pad((ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
}

function assTime(sec: number): string {
  const cs = Math.round(sec * 100);
  return `${Math.floor(cs / 360000)}:${pad(cs / 6000)}:${pad((cs / 100) % 60)}.${pad(cs % 100)}`;
}

/** #RRGGBB -> ASS &HAABBGGRR (opaque). */
function hexToAss(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = full.slice(0, 2);
  const g = full.slice(2, 4);
  const b = full.slice(4, 6);
  return `&H00${b}${g}${r}`.toUpperCase();
}

export function buildSrt(words: CaptionWord[]): string {
  return words
    .map((w, i) => `${i + 1}\n${srtTime(w.start)} --> ${srtTime(w.end)}\n${w.text}\n`)
    .join('\n');
}

export function buildAss(
  words: CaptionWord[],
  style: CaptionStyle,
  opts?: { playResX?: number; playResY?: number },
): string {
  const playResX = opts?.playResX ?? 1080;
  const playResY = opts?.playResY ?? 1920;
  const primary = hexToAss(style.textColor === 'transparent' ? '#FFFFFF' : style.textColor);
  const secondary = hexToAss(style.highlightColor);
  const back = style.background.type === 'none' ? '&H00000000' : hexToAss('#000000');
  const events = words
    .map((w) => `Dialogue: 0,${assTime(w.start)},${assTime(w.end)},CaptionAI,,0,0,0,,${w.text}`)
    .join('\n');
  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${playResX}
PlayResY: ${playResY}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Alignment, MarginV
Style: CaptionAI,Arial,${Math.round(style.fontSize * 2)},${primary},${secondary},&H00000000,${back},-1,0,2,120

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events}
`;
}

export function buildBurnInCommand(opts: {
  inputPath: string;
  assPath: string;
  outputPath: string;
}): string[] {
  // Burns the .ass subtitles into the video, copying the audio stream.
  return ['-y', '-i', opts.inputPath, '-vf', `subtitles=${opts.assPath}`, '-c:a', 'copy', opts.outputPath];
}

/**
 * 9:16 reel burn-in: cover-crops the source to 1080x1920, then burns the
 * (portrait-authored) .ass subtitles on top.
 */
export function buildReelBurnInCommand(opts: {
  inputPath: string;
  assPath: string;
  outputPath: string;
}): string[] {
  return [
    '-y',
    '-i',
    opts.inputPath,
    '-vf',
    `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,subtitles=${opts.assPath}`,
    '-c:a',
    'copy',
    opts.outputPath,
  ];
}

export interface ExportOptions {
  preset: ExportPreset;
  onProgress?: (p: number) => void;
}

// TODO (device): write `srt`/`ass` to the app cache with expo-file-system,
// then execute `command` with an FFmpeg binding (e.g. ffmpeg-kit /
// expo-ffmpeg-kit) and forward session progress to onProgress. The code
// below builds everything the native step needs and simulates progress so
// the UI flow is testable in Expo Go.
export async function exportProject(
  project: Project,
  style: CaptionStyle,
  opts: ExportOptions,
): Promise<ExportResult> {
  const isReel = opts.preset === 'reel';
  const srt = buildSrt(project.words);
  const ass = buildAss(
    project.words,
    style,
    isReel ? { playResX: 1080, playResY: 1920 } : { playResX: 1920, playResY: 1080 },
  );
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = `/captionai/${project.name.replace(/\s+/g, '_')}-${opts.preset}-${stamp}.mp4`;
  const command = project.mediaPath
    ? isReel
      ? buildReelBurnInCommand({ inputPath: project.mediaPath, assPath: '/captionai/captions.ass', outputPath })
      : buildBurnInCommand({ inputPath: project.mediaPath, assPath: '/captionai/captions.ass', outputPath })
    : [];

  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, 120));
    opts.onProgress?.(i / steps);
  }
  return { srt, ass, command, outputPath };
}
