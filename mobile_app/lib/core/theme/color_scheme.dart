import 'package:flutter/material.dart';

/// Design system color palette for the DeskLine application.
/// Based on Valorant-inspired enterprise SaaS visual language.
///
/// [AppColors] holds the static light-mode tokens (used as defaults).
/// [AppColorsDark] holds the dark-mode equivalents matching the web's `.dark` class.
///
/// For theme-aware access in widgets, use [DesklineColors.of(context)].
class AppColors {
  AppColors._();

  // ─── Brand (theme-invariant) ───────────────────────────────────
  static const primaryRed = Color(0xFFFF4655);

  // ─── Light Mode Tokens ─────────────────────────────────────────

  /// Main text / nav color
  static const navy = Color(0xFF0F1923);

  /// Primary background
  static const white = Color(0xFFFFFFFF);

  /// Cards / secondary surfaces
  static const secondaryBackground = Color(0xFFF7F7F7);

  /// Borders & dividers
  static const border = Color(0xFFE5E7EB);

  /// Muted / secondary text
  static const mutedText = Color(0xFF6B7280);

  // ─── Status Colors (theme-invariant — vivid on both surfaces) ──
  static const successGreen = Color(0xFF10B981);
  static const warningYellow = Color(0xFFF59E0B);
  static const errorRed = Color(0xFFEF4444);

  // ─── Status Badge Colors (vivid, same in both modes) ───────────
  static const statusOpen = Color(0xFF3B82F6);
  static const statusInProgress = Color(0xFFF59E0B);
  static const statusEscalated = Color(0xFFEF4444);
  static const statusResolved = Color(0xFF10B981);
  static const statusClosed = Color(0xFF64748B);

  // ─── Priority Badge Colors ─────────────────────────────────────
  static const priorityLow = Color(0xFF10B981);
  static const priorityMedium = Color(0xFFF59E0B);
  static const priorityHigh = Color(0xFFEF4444);

  // ─── Role Badge Colors ─────────────────────────────────────────
  static const roleEmployee = Color(0xFF6366F1);
  static const roleAgent = Color(0xFF10B981);
  static const roleSupervisor = Color(0xFFF59E0B);
  static const roleAdmin = Color(0xFFEF4444);

  // ─── Subtype Badge Colors ──────────────────────────────────────
  static const subtypeInformation = Color(0xFF3B82F6);
  static const subtypeAction = Color(0xFF10B981);
  static const subtypeConversation = Color(0xFF6366F1);
  static const subtypeEscalation = Color(0xFFEF4444);
}

/// Dark mode tokens matching the web's CSS `.dark` variables.
class AppColorsDark {
  AppColorsDark._();

  /// Main background — pure deep black/zinc
  static const background = Color(0xFF09090B);

  /// Card/surface background — dark zinc
  static const surface = Color(0xFF18181B);

  /// Main text — near white
  static const textMain = Color(0xFFF8FAFC);

  /// Borders & dividers
  static const border = Color(0xFF27272A);

  /// Muted / secondary text
  static const muted = Color(0xFFA1A1AA);

  /// Grid texture line color (white at 3%)
  static const gridLine = Color(0x08FFFFFF);

  /// Sidebar background
  static const sidebarBg = Color(0xFF09090B);
}

/// Theme-aware color accessor.
/// Use [DesklineColors.of(context)] in widgets to get the correct colors
/// for the current brightness without hardcoding AppColors everywhere.
class DesklineColors {
  final Brightness brightness;

  const DesklineColors._(this.brightness);

  factory DesklineColors.of(BuildContext context) {
    return DesklineColors._(Theme.of(context).brightness);
  }

  bool get isDark => brightness == Brightness.dark;

  // ─── Semantic Colors ───────────────────────────────────────────

  /// Primary background
  Color get background =>
      isDark ? AppColorsDark.background : AppColors.white;

  /// Card / elevated surface
  Color get surface =>
      isDark ? AppColorsDark.surface : AppColors.secondaryBackground;

  /// Main text color
  Color get textPrimary =>
      isDark ? AppColorsDark.textMain : AppColors.navy;

  /// Muted / secondary text
  Color get textMuted =>
      isDark ? AppColorsDark.muted : AppColors.mutedText;

  /// Borders and dividers
  Color get borderColor =>
      isDark ? AppColorsDark.border : AppColors.border;

  /// Card background
  Color get cardBackground =>
      isDark ? AppColorsDark.surface : AppColors.white;

  /// Input background
  Color get inputBackground =>
      isDark ? const Color(0xFF1F1F23) : AppColors.white;

  /// Input border
  Color get inputBorder =>
      isDark ? const Color(0xFF3F3F46) : const Color(0xFFD1D5DB);

  /// Outlined button foreground & border
  Color get secondaryButtonColor =>
      isDark ? AppColorsDark.textMain : AppColors.navy;

  /// Sidebar / nav background
  Color get sidebarBackground =>
      isDark ? AppColorsDark.sidebarBg : AppColors.navy;

  // ─── Brand (always the same) ───────────────────────────────────
  Color get primaryRed => AppColors.primaryRed;
}
