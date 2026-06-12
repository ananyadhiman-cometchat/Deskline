import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design system typography tokens for the DeskLine application.
///
/// Display/Heading styles use Bebas Neue (matching the web's tactical identity).
/// Body/Label styles use Inter for readability.
class AppTypography {
  AppTypography._();

  // ─── Font Families ───────────────────────────────────────────────

  /// Display/heading font — Bebas Neue for tactical uppercase titles
  static String get _displayFont => GoogleFonts.bebasNeue().fontFamily!;

  /// Body/label font — Inter for readability
  static String get _bodyFont => GoogleFonts.inter().fontFamily!;

  // ─── Display & Heading Styles (Bebas Neue) ───────────────────────

  /// Hero Headlines — 48px, tactical display font
  /// Used for splash/hero sections
  static TextStyle get heroHeadline => TextStyle(
        fontFamily: _displayFont,
        fontSize: 48,
        fontWeight: FontWeight.w400, // Bebas Neue only has regular weight
        letterSpacing: 1.92, // 0.04em positive for Bebas
        height: 1.0,
      );

  /// Section Headlines — 36px, used for major screen titles
  /// e.g., "EMPLOYEE DASHBOARD", "COMMAND CENTRE"
  static TextStyle get sectionHeadline => TextStyle(
        fontFamily: _displayFont,
        fontSize: 36,
        fontWeight: FontWeight.w400,
        height: 1.0,
        letterSpacing: 1.44, // 0.04em
      );

  /// Page Header — 28px, matching web's .page-header / .page-title
  /// Used for screen-level titles in the content area
  static TextStyle get pageHeader => TextStyle(
        fontFamily: _displayFont,
        fontSize: 28,
        fontWeight: FontWeight.w400,
        letterSpacing: 1.68, // 0.06em
        height: 1.0,
      );

  /// Card Title — 17px heading font for ticket card titles, card headers
  /// Matches web's .ticket-card-title and .card-title
  static TextStyle get cardTitle => TextStyle(
        fontFamily: _displayFont,
        fontSize: 17,
        fontWeight: FontWeight.w400,
        letterSpacing: 0.51, // 0.03em
        height: 1.2,
      );

  /// Section Label (Heading variant) — 14px display font
  /// Matches web's .section-label (red colored, Bebas Neue)
  static TextStyle get sectionLabelDisplay => TextStyle(
        fontFamily: _displayFont,
        fontSize: 14,
        fontWeight: FontWeight.w400,
        letterSpacing: 2.1, // 0.15em
        height: 1.0,
      );

  /// Metric Value — 32px display font for dashboard numbers
  /// Matches web's .stats-value using heading font
  static TextStyle get metricValue => TextStyle(
        fontFamily: _displayFont,
        fontSize: 32,
        fontWeight: FontWeight.w400,
        height: 1.0,
      );

  /// Auth Logo — 34px display font for "DESKLINE" branding
  static TextStyle get authLogo => TextStyle(
        fontFamily: _displayFont,
        fontSize: 34,
        fontWeight: FontWeight.w400,
        letterSpacing: 3.4, // 0.1em
        height: 1.0,
      );

  /// Auth Title — 20px display font for auth screen headings
  static TextStyle get authTitle => TextStyle(
        fontFamily: _displayFont,
        fontSize: 20,
        fontWeight: FontWeight.w400,
        letterSpacing: 2.4, // 0.12em
        height: 1.0,
      );

  /// Sidebar Logo — 22px display font for nav branding
  static TextStyle get sidebarLogo => TextStyle(
        fontFamily: _displayFont,
        fontSize: 22,
        fontWeight: FontWeight.w400,
        letterSpacing: 1.1, // 0.05em
        height: 1.0,
      );

  /// Topbar Title — 16px display font
  static TextStyle get topbarTitle => TextStyle(
        fontFamily: _displayFont,
        fontSize: 16,
        fontWeight: FontWeight.w400,
        letterSpacing: 1.92, // 0.12em
        height: 1.0,
      );

  // ─── Body & Label Styles (Inter) ─────────────────────────────────

  /// Navigation Labels — 13px, semibold, wide tracking
  /// Used for button text, nav items, uppercase UI labels
  static TextStyle get navigationLabel => TextStyle(
        fontFamily: _bodyFont,
        fontSize: 13,
        fontWeight: FontWeight.w600,
        letterSpacing: 1.56, // 0.12em
      );

  /// Section Labels — 12px, bold, extra wide tracking
  /// Used for form labels, table headers, sub-section labels
  static TextStyle get sectionLabel => TextStyle(
        fontFamily: _bodyFont,
        fontSize: 12,
        fontWeight: FontWeight.w700,
        letterSpacing: 2.4, // 0.2em
      );

  /// Form Label — 11px, bold, wide tracking
  /// Matches web's .form-label exactly
  static TextStyle get formLabel => TextStyle(
        fontFamily: _bodyFont,
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.54, // 0.14em
      );

  /// Body Text — 16px, regular weight, relaxed line height
  static TextStyle get body => TextStyle(
        fontFamily: _bodyFont,
        fontSize: 16,
        fontWeight: FontWeight.w400,
        height: 1.7,
      );

  /// Body Small — 14px, regular weight
  /// For secondary text, descriptions, card content
  static TextStyle get bodySmall => TextStyle(
        fontFamily: _bodyFont,
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.6,
      );

  /// Badge Text — 11px, bold, tracking
  /// Matches web's .badge styling
  static TextStyle get badge => TextStyle(
        fontFamily: _bodyFont,
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.1, // 0.1em
      );

  /// Stats Label — 11px, bold, wide tracking
  /// Matches web's .stats-label
  static TextStyle get statsLabel => TextStyle(
        fontFamily: _bodyFont,
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.65, // 0.15em
      );

  /// Ticket ID — monospace, 11px, bold
  /// Matches web's .ticket-card-id (monospace)
  static TextStyle get ticketId => TextStyle(
        fontFamily: GoogleFonts.robotoMono().fontFamily,
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.32, // 0.12em
      );

  /// Sidebar Section Label — 10px, bold, wide tracking
  /// Matches web's .sidebar-section-label
  static TextStyle get sidebarSectionLabel => TextStyle(
        fontFamily: _bodyFont,
        fontSize: 10,
        fontWeight: FontWeight.w700,
        letterSpacing: 2.0, // 0.2em
      );

  /// Notification Title — 13px, semibold
  static TextStyle get notificationTitle => TextStyle(
        fontFamily: _bodyFont,
        fontSize: 13,
        fontWeight: FontWeight.w600,
      );

  /// Notification Body — 12px, regular
  static TextStyle get notificationBody => TextStyle(
        fontFamily: _bodyFont,
        fontSize: 12,
        fontWeight: FontWeight.w400,
        height: 1.5,
      );

  /// Caption / Timestamp — 11px, regular
  static TextStyle get caption => TextStyle(
        fontFamily: _bodyFont,
        fontSize: 11,
        fontWeight: FontWeight.w400,
        letterSpacing: 0.55, // 0.05em
      );
}
