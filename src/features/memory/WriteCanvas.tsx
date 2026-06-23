/**
 * ✍️ WRITE CANVAS — a finger-drawing pad for hand-writing a verse from memory.
 *
 * Part of "Memorize & write the Word": in write mode the user copies the verse
 * by hand, then reveals it to self-check. Built on react-native-svg (already
 * proven in the app) + PanResponder rather than a native canvas, so it needs no
 * new native module. Strokes are plain point arrays rendered as <Polyline>s;
 * Undo pops the last stroke, Clear wipes the pad. It refuses to surrender the
 * gesture to the surrounding ScrollView so a stroke never scrolls the page.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
} from 'react-native';
import Svg, {Polyline} from 'react-native-svg';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
} from '@/styles/designTokens';

type Point = {x: number; y: number};

interface WriteCanvasProps {
  strokeColor: string;
  bgColor: string;
  borderColor: string;
  controlColor: string;
  height?: number;
  clearLabel: string;
  undoLabel: string;
}

const pointsToString = (pts: Point[]): string =>
  pts.map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' ');

export const WriteCanvas: React.FC<WriteCanvasProps> = ({
  strokeColor,
  bgColor,
  borderColor,
  controlColor,
  height = 240,
  clearLabel,
  undoLabel,
}) => {
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [current, setCurrent] = useState<Point[]>([]);
  const currentRef = useRef<Point[]>([]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Never hand the in-progress stroke back to the parent ScrollView.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: e => {
          const {locationX, locationY} = e.nativeEvent;
          currentRef.current = [{x: locationX, y: locationY}];
          setCurrent(currentRef.current);
        },
        onPanResponderMove: e => {
          const {locationX, locationY} = e.nativeEvent;
          currentRef.current = [
            ...currentRef.current,
            {x: locationX, y: locationY},
          ];
          setCurrent(currentRef.current);
        },
        onPanResponderRelease: () => {
          if (currentRef.current.length > 0) {
            const stroke = currentRef.current;
            setStrokes(prev => [...prev, stroke]);
          }
          currentRef.current = [];
          setCurrent([]);
        },
      }),
    [],
  );

  const handleUndo = () => {
    haptics.tap();
    setStrokes(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    haptics.tap();
    setStrokes([]);
    setCurrent([]);
    currentRef.current = [];
  };

  const hasInk = strokes.length > 0 || current.length > 0;

  return (
    <View>
      <View
        style={[styles.canvas, {height, backgroundColor: bgColor, borderColor}]}
        {...pan.panHandlers}>
        <Svg style={StyleSheet.absoluteFill}>
          {strokes.map((stroke, i) => (
            <Polyline
              key={`s-${i}`}
              points={pointsToString(stroke)}
              fill="none"
              stroke={strokeColor}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {current.length > 0 ? (
            <Polyline
              points={pointsToString(current)}
              fill="none"
              stroke={strokeColor}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, {borderColor: controlColor}]}
          onPress={handleUndo}
          disabled={!hasInk}
          accessibilityRole="button"
          accessibilityLabel={undoLabel}>
          <Ionicons name="arrow-undo-outline" size={16} color={controlColor} />
          <Text style={[styles.controlText, {color: controlColor}]}>
            {undoLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, {borderColor: controlColor}]}
          onPress={handleClear}
          disabled={!hasInk}
          accessibilityRole="button"
          accessibilityLabel={clearLabel}>
          <Ionicons name="trash-outline" size={16} color={controlColor} />
          <Text style={[styles.controlText, {color: controlColor}]}>
            {clearLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: {
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  controlText: {fontSize: fontSizes.sm, fontWeight: '700'},
});

export default WriteCanvas;
