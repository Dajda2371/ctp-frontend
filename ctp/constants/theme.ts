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
};

export const Colors = {
  light: {
    text: BrandColors.ctpBlue,
    background: '#fff',
    tint: BrandColors.ctpOrange,
    icon: BrandColors.ctpGray,
    tabIconDefault: BrandColors.ctpGray,
    tabIconSelected: BrandColors.ctpOrange,
    primary: BrandColors.ctpOrange,
    secondary: BrandColors.ctpBlue,
    danger: BrandColors.ctpRed,
    neutral: BrandColors.ctpBeige,
  },
  dark: {
    text: '#ECEDEE',
    background: BrandColors.ctpBlue,
    tint: BrandColors.ctpOrange,
    icon: BrandColors.ctpBeige,
    tabIconDefault: BrandColors.ctpBeige,
    tabIconSelected: BrandColors.ctpOrange,
    primary: BrandColors.ctpOrange,
    secondary: BrandColors.ctpBlue,
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
