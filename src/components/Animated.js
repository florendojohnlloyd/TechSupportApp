import React, { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * AnimatedCard — fades in and slides up on mount.
 * Use `index` to stagger a list of cards.
 */
export function AnimatedCard({ children, index = 0, delay, style, distance = 18, duration = 420 }) {
  const progress = useSharedValue(0);
  const startDelay = delay != null ? delay : index * 80;

  useEffect(() => {
    progress.value = withDelay(startDelay, withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [distance, 0]) }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

/**
 * PressableScale — scales down slightly on press for tactile feedback.
 */
export function PressableScale({ children, onPress, style, scaleTo = 0.96, disabled, ...rest }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => { scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        style={style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

/**
 * AnimatedCounter — counts up from 0 to `value` on mount.
 */
export function AnimatedCounter({ value = 0, style, duration = 900, delay = 0, suffix = '', prefix = '' }) {
  const [display, setDisplay] = React.useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(delay, withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    }));
    const start = Date.now();
    const target = Number(value) || 0;
    const tick = () => {
      const elapsed = Date.now() - start - delay;
      if (elapsed < 0) { requestAnimationFrame(tick); return; }
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * target));
      if (t < 1) requestAnimationFrame(tick);
      else setDisplay(target);
    };
    requestAnimationFrame(tick);
  }, [value]);

  return <Text style={style}>{prefix}{display}{suffix}</Text>;
}

/**
 * GradientView — thin wrapper around LinearGradient with sensible defaults.
 */
export function GradientView({ colors, start, end, style, children }) {
  return (
    <LinearGradient
      colors={colors}
      start={start || { x: 0, y: 0 }}
      end={end || { x: 1, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

/**
 * FadeIn — simple opacity fade for any child.
 */
export function FadeIn({ children, delay = 0, duration = 400, style }) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export { Animated, AnimatedLinearGradient };
