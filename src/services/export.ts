import type { CaptionStyle, CaptionWord, Project } from '../models';

export type ExportResolution = '720p' | '1080p';

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

export function buildAss(words: CaptionWord[], style: CaptionStyle): string {
  const primary = hexToAss(style.textColor === 'transparent' ? '#FFFFFF' : style.textColor);
  const secondary = hexToAss(style.highlightColor);
  const back = style.background.type === 'none' ? '&H00000000' : hexToAss('#000000');
  const events = words
    .map((w) => `Dialogue: 0,${assTime(w.start)},${assTime(w.end)},CaptionAI,,0,0,0,,${w.text}`)
    .join('\n');
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

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

export interface ExportOptions {
  resolution: ExportResolution;
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
  const srt = buildSrt(project.words);
  const ass = buildAss(project.words, style);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = `/captionai/${project.name.replace(/\s+/g, '_')}-${opts.resolution}-${stamp}.mp4`;
  const command = project.mediaPath
    ? buildBurnInCommand({ inputPath: project.mediaPath, assPath: '/captionai/captions.ass', outputPath })
    : [];

  const steps = 20;
  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, 120));
    opts.onProgress?.(i / steps);
  }
  return { srt, ass, command, outputPath };
}
