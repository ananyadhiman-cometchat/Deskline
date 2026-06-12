import 'package:flutter/material.dart';

import 'color_scheme.dart';
import 'typography.dart';

/// Builds the complete Material 3 Light ThemeData for the DeskLine application.
/// Implements the Valorant-inspired enterprise SaaS design system with
/// sharp edges, border-driven cards, and bold typography.
ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,

    // Color scheme
    colorScheme: const ColorScheme.light(
      primary: AppColors.primaryRed,
      onPrimary: AppColors.white,
      secondary: AppColors.navy,
      onSecondary: AppColors.white,
      surface: AppColors.white,
      onSurface: AppColors.navy,
      surfaceContainerHighest: AppColors.secondaryBackground,
      error: AppColors.errorRed,
      onError: AppColors.white,
      outline: AppColors.border,
    ),

    scaffoldBackgroundColor: AppColors.white,

    // Typography — maps design system tokens to Material text theme
    textTheme: TextTheme(
      displayLarge: AppTypography.heroHeadline,
      displayMedium: AppTypography.sectionHeadline,
      displaySmall: AppTypography.pageHeader,
      headlineLarge: AppTypography.pageHeader,
      headlineMedium: AppTypography.cardTitle,
      labelLarge: AppTypography.navigationLabel,
      labelMedium: AppTypography.sectionLabel,
      labelSmall: AppTypography.formLabel,
      bodyLarge: AppTypography.body,
      bodyMedium: AppTypography.bodySmall,
      bodySmall: AppTypography.caption,
    ),

    // Elevated Button (Primary)
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryRed,
        foregroundColor: AppColors.white,
        elevation: 0,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.zero,
        ),
        minimumSize: const Size(0, 48),
        textStyle: AppTypography.navigationLabel,
      ),
    ),

    // Outlined Button (Secondary)
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.navy,
        side: const BorderSide(color: AppColors.navy, width: 1),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.zero,
        ),
        minimumSize: const Size(0, 48),
        textStyle: AppTypography.navigationLabel,
      ),
    ),

    // Text Fields
    inputDecorationTheme: InputDecorationTheme(
      filled: false,
      border: const OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: Color(0xFFD1D5DB), width: 1),
      ),
      enabledBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: Color(0xFFD1D5DB), width: 1),
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: AppColors.primaryRed, width: 1),
      ),
      errorBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: AppColors.errorRed, width: 1),
      ),
      focusedErrorBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: AppColors.errorRed, width: 1),
      ),
      labelStyle: AppTypography.formLabel.copyWith(
        color: AppColors.mutedText,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),

    // AppBar
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.white,
      foregroundColor: AppColors.navy,
      elevation: 0,
      scrolledUnderElevation: 0,
      shape: Border(
        bottom: BorderSide(color: AppColors.border, width: 1),
      ),
    ),

    // Cards — border-driven, no elevation
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
        side: const BorderSide(color: AppColors.border, width: 1),
      ),
      color: AppColors.white,
    ),

    // Divider
    dividerTheme: const DividerThemeData(
      color: AppColors.border,
      thickness: 1,
    ),
  );
}

/// Builds the Dark ThemeData matching the web's `.dark` CSS variables.
/// Same tactical Valorant-inspired identity but on dark zinc surfaces.
ThemeData buildDarkAppTheme() {
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,

    // Color scheme
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primaryRed,
      onPrimary: AppColors.white,
      secondary: AppColorsDark.textMain,
      onSecondary: AppColorsDark.background,
      surface: AppColorsDark.surface,
      onSurface: AppColorsDark.textMain,
      surfaceContainerHighest: AppColorsDark.surface,
      error: AppColors.errorRed,
      onError: AppColors.white,
      outline: AppColorsDark.border,
    ),

    scaffoldBackgroundColor: AppColorsDark.background,

    // Typography — same tokens, colors adapt via theme
    textTheme: TextTheme(
      displayLarge: AppTypography.heroHeadline,
      displayMedium: AppTypography.sectionHeadline,
      displaySmall: AppTypography.pageHeader,
      headlineLarge: AppTypography.pageHeader,
      headlineMedium: AppTypography.cardTitle,
      labelLarge: AppTypography.navigationLabel,
      labelMedium: AppTypography.sectionLabel,
      labelSmall: AppTypography.formLabel,
      bodyLarge: AppTypography.body,
      bodyMedium: AppTypography.bodySmall,
      bodySmall: AppTypography.caption,
    ),

    // Elevated Button (Primary) — red stays the same
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryRed,
        foregroundColor: AppColors.white,
        elevation: 0,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.zero,
        ),
        minimumSize: const Size(0, 48),
        textStyle: AppTypography.navigationLabel,
      ),
    ),

    // Outlined Button (Secondary) — white border on dark
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColorsDark.textMain,
        side: const BorderSide(color: AppColorsDark.textMain, width: 1),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.zero,
        ),
        minimumSize: const Size(0, 48),
        textStyle: AppTypography.navigationLabel,
      ),
    ),

    // Text Fields — dark background inputs
    inputDecorationTheme: InputDecorationTheme(
      filled: false,
      border: const OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: Color(0xFF3F3F46), width: 1),
      ),
      enabledBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: Color(0xFF3F3F46), width: 1),
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: AppColors.primaryRed, width: 1),
      ),
      errorBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: AppColors.errorRed, width: 1),
      ),
      focusedErrorBorder: const OutlineInputBorder(
        borderRadius: BorderRadius.zero,
        borderSide: BorderSide(color: AppColors.errorRed, width: 1),
      ),
      labelStyle: AppTypography.formLabel.copyWith(
        color: AppColorsDark.muted,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),

    // AppBar — dark background, white text
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColorsDark.background,
      foregroundColor: AppColorsDark.textMain,
      elevation: 0,
      scrolledUnderElevation: 0,
      shape: Border(
        bottom: BorderSide(color: AppColorsDark.border, width: 1),
      ),
    ),

    // Cards — dark surface, dark border
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
        side: const BorderSide(color: AppColorsDark.border, width: 1),
      ),
      color: AppColorsDark.surface,
    ),

    // Divider — dark border
    dividerTheme: const DividerThemeData(
      color: AppColorsDark.border,
      thickness: 1,
    ),
  );
}
