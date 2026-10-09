import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import type { CaptionAnimation, CaptionStyle, CaptionWord } from '../models';

interface KineticPreviewProps {
  words: CaptionWord[];
  style: CaptionStyle;
  /** Loop length in ms. Defaults to the words' timeline, or 6s. */
  durationMs?: number;
  /** Scales the style's fontSize (e.g. 0.55 for thumbnails). */
  fontScale?: number;
}

// Renders text with a faux stroke: offset copies in the stroke color
// sit behind the main glyphs (React Native has a single textShadow only).
function StrokedText({
  text,
  textStyle,
  strokeColor,
  strokeWidth,
  transparentFill = false,
}: {
  text: string;
  textStyle: TextStyle;
  strokeColor: string;
  strokeWidth: number;
  transparentFill?: boolean;
}) {
  const d = strokeWidth;
  const offsets: Array<[number, number]> = [
    [-d, -d],
    [d, -d],
    [-d, d],
    [d, d],
    [-d, 0],
    [d, 0],
    [0, -d],
    [0, d],
  ];
  return (
    <View>
      {offsets.map(([x, y], i) => (
        <Text
          key={i}
          style={[
            textStyle,
            styles.strokeCopy,
            { color: strokeColor, transform: [{ translateX: x }, { translateY: y }] },
          ]}>
          {text}
        </Text>
      ))}
      <Text style={[textStyle, transparentFill && { color: 'transparent' }]}>{text}</Text>
    </View>
  );
}

interface WordViewProps {
  word: CaptionWord;
  active: boolean;
  style: CaptionStyle;
  fontScale: number;
}

function WordView({ word, active, style: s, fontScale }: WordViewProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [typed, setTyped] = useState(word.text.length);

  const displayText = s.uppercase ? word.text.toUpperCase() : word.text;

  // Typewriter character reveal while the word is active.
  useEffect(() => {
    if (s.animation !== 'typewriter' || !active) {
      setTyped(word.text.length);
      return;
    }
    setTyped(0);
    const id = setInterval(() => {
      setTyped((n) => {
        if (n >= word.text.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 45);
    return () => clearInterval(id);
  }, [active, s.animation, word.text]);

  // Signature animation, re-triggered whenever the word becomes active.
  useEffect(() => {
    if (!active) {
      anim.stopAnimation();
      anim.setValue(0);
      return;
    }
    let loop: Animated.CompositeAnimation | undefined;
    switch (s.animation) {
      case 'pop':
        anim.setValue(0);
        Animated.timing(anim, { toValue: 1, duration: 320, easing: Easing.out, useNativeDriver: true }).start();
        break;
      case 'bounce':
        anim.setValue(0);
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 170, easing: Easing.out, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 200, easing: Easing.in, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.55, duration: 130, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start();
        break;
      case 'glow-pulse':
        anim.setValue(0);
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 550, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0, duration: 550, useNativeDriver: false }),
          ]),
        );
        loop.start();
        break;
      case 'fade-up':
      case 'slide-in':
        anim.setValue(0);
        Animated.timing(anim, { toValue: 1, duration: 300, easing: Easing.out, useNativeDriver: true }).start();
        break;
      case 'scale-punch':
        anim.setValue(0);
        Animated.timing(anim, { toValue: 1, duration: 240, easing: Easing.out, useNativeDriver: true }).start();
        break;
      case 'word-highlight':
      case 'karaoke':
      case 'minimal':
      case 'outline':
        anim.setValue(0);
        Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
        break;
      case 'neon-flicker':
        anim.setValue(0);
        Animated.sequence(
          [1, 0.25, 1, 0.45, 1].map((v) =>
            Animated.timing(anim, { toValue: v, duration: 90, useNativeDriver: true }),
          ),
        ).start();
        break;
      case 'typewriter':
        break;
    }
    return () => loop?.stop();
  }, [active, s.animation, anim]);

  const animatedStyle = useMemo(() => {
    if (!active) return { opacity: 0.45 };
    switch (s.animation) {
      case 'pop':
        return {
          opacity: 1,
          transform: [
            {
              scale: anim.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.3, 1.28, 1] }),
            },
          ],
        };
      case 'bounce':
        return { opacity: 1, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -16] }) }] };
      case 'glow-pulse':
        return { opacity: 1 };
      case 'fade-up':
        return {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        };
      case 'slide-in':
        return {
          opacity: anim,
          transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [56, 0] }) }],
        };
      case 'scale-punch':
        return {
          opacity: 1,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1.65, 1] }) }],
        };
      case 'neon-flicker':
        return { opacity: anim };
      case 'karaoke':
      case 'word-highlight':
      case 'minimal':
      case 'outline':
      case 'typewriter':
      default:
        return { opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) };
    }
  }, [active, anim, s.animation]);

  const isHighlightPill = active && s.animation === 'word-highlight';
  const isOutlineFill = active && s.animation === 'outline';

  const color = isHighlightPill
    ? '#0B0B10'
    : isOutlineFill
      ? s.highlightColor
      : active && (s.animation === 'karaoke' || s.animation === 'fade-up')
        ? s.highlightColor
        : s.textColor;

  const baseTextStyle: TextStyle = {
    fontFamily: s.fontFamily,
    fontSize: s.fontSize * fontScale,
    fontWeight: s.fontWeight,
    color,
    textShadowColor: s.glow?.color,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: s.glow
      ? s.animation === 'glow-pulse' && active
        ? anim.interpolate({ inputRange: [0, 1], outputRange: [s.glow.radius * 0.5, s.glow.radius * 1.5] }) as unknown as number
        : s.glow.radius * 0.6
      : 0,
  };

  const text =
    s.animation === 'typewriter' && active ? displayText.slice(0, typed) : displayText;

  const content = s.stroke && !(isOutlineFill && s.animation === 'outline') ? (
    <StrokedText
      text={text}
      textStyle={baseTextStyle}
      strokeColor={s.stroke.color}
      strokeWidth={s.stroke.width}
    />
  ) : s.stroke && s.animation === 'outline' && !active ? (
    <StrokedText
      text={text}
      textStyle={baseTextStyle}
      strokeColor={s.stroke.color}
      strokeWidth={s.stroke.width}
      transparentFill
    />
  ) : (
    <Text style={baseTextStyle}>{text}</Text>
  );

  return (
    <Animated.View
      style={[
        styles.word,
        animatedStyle,
        isHighlightPill && {
          backgroundColor: s.highlightColor,
          borderRadius: 8,
          paddingHorizontal: 6 * fontScale,
          paddingVertical: 2 * fontScale,
        },
      ]}>
      {content}
    </Animated.View>
  );
}

export function KineticPreview({ words, style: s, durationMs, fontScale = 1 }: KineticPreviewProps) {
  const timelineMs = useMemo(() => {
    const maxEnd = words.reduce((m, w) => Math.max(m, w.end), 0);
    return maxEnd > 0 ? maxEnd * 1000 : 6000;
  }, [words]);
  const loopMs = durationMs ?? timelineMs;

  const [now, setNow] = useState(0);
  useEffect(() => {
    const t0 = Date.now();
    const id = setInterval(() => setNow((Date.now() - t0) % loopMs), 60);
    return () => clearInterval(id);
  }, [loopMs]);

  const activeIndex = useMemo(() => {
    if (words.length === 0) return -1;
    const hasTiming = words.some((w) => w.end > w.start);
    if (hasTiming) {
      const pos = now / 1000;
      const i = words.findIndex((w) => pos >= w.start && pos < w.end);
      return i === -1 ? words.length - 1 : i;
    }
    return Math.min(Math.floor((now / loopMs) * words.length), words.length - 1);
  }, [now, words, loopMs]);

  const bg = s.background;
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.captionBox,
          bg.type !== 'none' && {
            backgroundColor: bg.color,
            borderRadius: bg.radius,
            padding: bg.padding * fontScale,
          },
        ]}>
        <View style={styles.wordsRow}>
          {words.map((w, i) => (
            <WordView key={w.id} word={w} active={i === activeIndex} style={s} fontScale={fontScale} />
          ))}
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(now / loopMs) * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  captionBox: {
    minHeight: 96,
    justifyContent: 'center',
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: {
    marginHorizontal: 4,
    marginVertical: 3,
  },
  strokeCopy: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#2A2A38',
    borderRadius: 2,
    marginTop: 10,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#E8FF47',
    borderRadius: 2,
  },
});
