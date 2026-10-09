// Central registry of bundled Google Fonts, loaded once in app/_layout.tsx
// via expo-font's useFonts. Referenced by caption styles by key.
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import { Archivo_700Bold, Archivo_900Black } from '@expo-google-fonts/archivo';
import {
  Poppins_600SemiBold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';

export const APP_FONTS = {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_800ExtraBold,
  BebasNeue_400Regular,
  Anton_400Regular,
  SpaceMono_400Regular,
  SpaceMono_700Bold,
  Archivo_700Bold,
  Archivo_900Black,
  Poppins_600SemiBold,
  Poppins_800ExtraBold,
};

export type AppFontFamily = keyof typeof APP_FONTS;
