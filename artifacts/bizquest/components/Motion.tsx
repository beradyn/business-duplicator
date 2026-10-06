import React, { useCallback, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useMotionPreference } from '@/hooks/useMotionPreference';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MotionPressable({ style, onPressIn, onPressOut, disabled, ...props }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }) {
  const reducedMotion = useMotionPreference();
  const scale = useSharedValue(1);
  const motionStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      style={[style, motionStyle]}
      onPressIn={(event) => {
        if (!disabled && !reducedMotion) scale.value = withTiming(0.96, { duration: 90 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = reducedMotion ? 1 : withSpring(1, { damping: 12, stiffness: 280, mass: 0.5 });
        onPressOut?.(event);
      }}
    />
  );
}

export function PageMotion({ children }: { children: ReactNode }) {
  const reducedMotion = useMotionPreference();
  const opacity = useSharedValue(1);
  const offset = useSharedValue(0);
  const motionStyle = useAnimatedStyle(() => ({ flex: 1, opacity: opacity.value, transform: [{ translateY: offset.value }] }));
  useFocusEffect(useCallback(() => {
    if (reducedMotion) { opacity.value = 1; offset.value = 0; return; }
    opacity.value = 0;
    offset.value = 10;
    opacity.value = withTiming(1, { duration: 180 });
    offset.value = withTiming(0, { duration: 220 });
  }, [reducedMotion, opacity, offset]));
  return <Animated.View style={motionStyle}>{children}</Animated.View>;
}

export function Reveal({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reducedMotion = useMotionPreference();
  return <Animated.View entering={reducedMotion ? undefined : FadeInDown.duration(220)} exiting={reducedMotion ? undefined : FadeOut.duration(120)} style={style}>{children}</Animated.View>;
}