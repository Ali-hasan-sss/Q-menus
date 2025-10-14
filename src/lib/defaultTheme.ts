// Default theme configuration shared across the application
export const DEFAULT_THEME = {
  // Colors
  primaryColor: "#f6b23c",
  secondaryColor: "#27ae1e",
  backgroundColor: "#ffb36b",
  textColor: "#1F2937",
  accentColor: "#F59E0B",

  // Color Opacity
  primaryColorOpacity: 0.8,
  secondaryColorOpacity: 0.9,
  backgroundColorOpacity: 1,
  textColorOpacity: 1,
  accentColorOpacity: 1,

  // Background
  backgroundOverlayOpacity: 0.1,
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  backgroundImage:
    "https://res.cloudinary.com/dnojeu5cs/image/upload/v1760356710/mymenus-images/gzdt3vrn28q8kmuj6xyc.jpg",
  customBackgroundImage:
    "https://res.cloudinary.com/dnojeu5cs/image/upload/v1760356710/mymenus-images/gzdt3vrn28q8kmuj6xyc.jpg",

  // Layout & Typography
  layoutType: "grid",
  fontFamily: "Inter, sans-serif",
  headingSize: "text-2xl",
  bodySize: "text-base",
  priceSize: "text-lg",

  // Spacing
  cardPadding: "p-4",
  cardMargin: "gap-4",
  borderRadius: "rounded-lg",

  // Display Settings
  showPrices: true,
  showImages: true,
  showDescriptions: true,
  showCategoryImages: true,

  // Category & Item Style
  categoryStyle: "card",
  itemLayout: "grid",
  imageAspect: "aspect-square",
};

/**
 * Merge custom theme with default theme
 * Ensures all required properties are present
 */
export function mergeWithDefaultTheme(customTheme: any): any {
  if (!customTheme) return DEFAULT_THEME;

  return {
    ...DEFAULT_THEME,
    ...customTheme,
    // Ensure opacity values are valid numbers
    primaryColorOpacity:
      typeof customTheme.primaryColorOpacity === "number"
        ? customTheme.primaryColorOpacity
        : DEFAULT_THEME.primaryColorOpacity,
    secondaryColorOpacity:
      typeof customTheme.secondaryColorOpacity === "number"
        ? customTheme.secondaryColorOpacity
        : DEFAULT_THEME.secondaryColorOpacity,
    backgroundColorOpacity:
      typeof customTheme.backgroundColorOpacity === "number"
        ? customTheme.backgroundColorOpacity
        : DEFAULT_THEME.backgroundColorOpacity,
    textColorOpacity:
      typeof customTheme.textColorOpacity === "number"
        ? customTheme.textColorOpacity
        : DEFAULT_THEME.textColorOpacity,
    accentColorOpacity:
      typeof customTheme.accentColorOpacity === "number"
        ? customTheme.accentColorOpacity
        : DEFAULT_THEME.accentColorOpacity,
    backgroundOverlayOpacity:
      typeof customTheme.backgroundOverlayOpacity === "number"
        ? customTheme.backgroundOverlayOpacity
        : DEFAULT_THEME.backgroundOverlayOpacity,
  };
}
