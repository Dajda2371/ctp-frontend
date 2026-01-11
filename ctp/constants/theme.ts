/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const BrandColors = {
  ctpBlue: '#003150',
  ctpRed: '#BB0817',
  ctpOrange: '#CE8E00',
  ctpBeige: '#B7B9A9',
  ctpGray: '#7D9AAA',
  ctpBlack: '#1E1E1E',
  ctpLightNeutral: '#F5F6F4',
};

export const Colors = {
  light: {
    text: BrandColors.ctpBlack,
    background: BrandColors.ctpLightNeutral,
    card: '#FFFFFF',
    tint: BrandColors.ctpOrange,
    icon: BrandColors.ctpBlack,
    tabIconDefault: '#9BA1A6',
    tabIconSelected: BrandColors.ctpOrange,
    primary: BrandColors.ctpBlue,
    secondary: BrandColors.ctpOrange,
    danger: BrandColors.ctpRed,
    neutral: BrandColors.ctpBeige,
  },
  dark: {
    text: '#ECEDEE',
    background: '#001828',
    card: '#00253C',
    tint: BrandColors.ctpOrange,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: BrandColors.ctpOrange,
    primary: BrandColors.ctpOrange, // Orange stands out better on dark
    secondary: BrandColors.ctpBeige,
    danger: BrandColors.ctpRed,
    neutral: BrandColors.ctpGray,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
