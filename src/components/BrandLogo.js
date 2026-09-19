import React from 'react';
import { Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// ES PRINT wordmark that adapts to the theme:
// - dark backgrounds  -> white "PRINT" variant (brand-logo-light.png)
// - light backgrounds -> black "PRINT" variant (brand-logo.png)
// Transparent, no box.
export default function BrandLogo({ width = 118, height = 26, style, onDark }) {
  const { isDark } = useTheme();
  // `onDark` forces the light variant (for use on gradient headers regardless of theme)
  const useLight = onDark != null ? onDark : isDark;
  const source = useLight
    ? require('../../assets/brand-logo-light.png')
    : require('../../assets/brand-logo.png');
  return <Image source={source} style={[{ width, height }, style]} resizeMode="contain" />;
}
