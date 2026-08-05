import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// HeartAI application theme – mirrors the React CSS design tokens.
class AppTheme {
  AppTheme._();

  // ─── Brand Colors ────────────────────────────────────────────
  static const Color cyan600 = Color(0xFF0891B2);
  static const Color cyan700 = Color(0xFF0E7490);
  static const Color cyan500 = Color(0xFF06B6D4);
  static const Color cyan400 = Color(0xFF22D3EE);
  static const Color cyan100 = Color(0xFFCFFAFE);
  static const Color cyan50 = Color(0xFFECFEFF);

  static const Color teal600 = Color(0xFF0D9488);
  static const Color teal700 = Color(0xFF0F766E);
  static const Color teal50 = Color(0xFFF0FDFA);

  static const Color green600 = Color(0xFF16A34A);
  static const Color green100 = Color(0xFFDCFCE7);
  static const Color green50 = Color(0xFFF0FDF4);
  static const Color green700 = Color(0xFF15803D);

  static const Color amber600 = Color(0xFFD97706);
  static const Color amber100 = Color(0xFFFEF3C7);
  static const Color amber700 = Color(0xFFB45309);

  static const Color red500 = Color(0xFFEF4444);
  static const Color red50 = Color(0xFFFEF2F2);

  static const Color blue50 = Color(0xFFEFF6FF);
  static const Color blue100 = Color(0xFFDBEAFE);
  static const Color blue200 = Color(0xFFBFDBFE);
  static const Color blue700 = Color(0xFF1D4ED8);
  static const Color blue800 = Color(0xFF1E40AF);
  static const Color blue900 = Color(0xFF1E3A8A);

  static const Color gray50 = Color(0xFFF9FAFB);
  static const Color gray100 = Color(0xFFF3F4F6);
  static const Color gray200 = Color(0xFFE5E7EB);
  static const Color gray300 = Color(0xFFD1D5DB);
  static const Color gray400 = Color(0xFF9CA3AF);
  static const Color gray500 = Color(0xFF6B7280);
  static const Color gray600 = Color(0xFF4B5563);
  static const Color gray700 = Color(0xFF374151);
  static const Color gray900 = Color(0xFF111827);

  // ─── Gradient ────────────────────────────────────────────────
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [cyan600, teal600],
  );

  static const LinearGradient primaryGradientHover = LinearGradient(
    colors: [cyan700, teal700],
  );

  static const LinearGradient backgroundGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [cyan50, teal50],
  );

  // ─── Input background (matching React's --input-background) ─
  static const Color inputBackground = Color(0xFFF3F3F5);

  // ─── Theme Data ──────────────────────────────────────────────
  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.interTextTheme();

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.light(
        primary: cyan600,
        secondary: teal600,
        error: red500,
        surface: Colors.white,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: gray900,
        onError: Colors.white,
      ),
      scaffoldBackgroundColor: Colors.white,
      textTheme: baseTextTheme.copyWith(
        displayLarge: baseTextTheme.displayLarge?.copyWith(color: gray900),
        displayMedium: baseTextTheme.displayMedium?.copyWith(color: gray900),
        headlineLarge: baseTextTheme.headlineLarge?.copyWith(
          fontWeight: FontWeight.bold,
          color: gray900,
        ),
        headlineMedium: baseTextTheme.headlineMedium?.copyWith(
          fontWeight: FontWeight.bold,
          color: gray900,
        ),
        titleLarge: baseTextTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w600,
          color: gray900,
        ),
        bodyLarge: baseTextTheme.bodyLarge?.copyWith(color: gray600),
        bodyMedium: baseTextTheme.bodyMedium?.copyWith(color: gray600),
        labelLarge: baseTextTheme.labelLarge?.copyWith(
          fontWeight: FontWeight.w500,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: gray900,
        elevation: 0,
        scrolledUnderElevation: 1,
        titleTextStyle: GoogleFonts.inter(
          fontSize: 20,
          fontWeight: FontWeight.bold,
          color: gray900,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          side: BorderSide(color: gray300),
          textStyle: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: inputBackground,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: cyan600, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: red500, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: red500, width: 1.5),
        ),
        hintStyle: GoogleFonts.inter(color: gray400),
        errorStyle: GoogleFonts.inter(color: red500, fontSize: 12),
      ),
      cardTheme: CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        color: Colors.white,
      ),
      dividerTheme: DividerThemeData(color: gray200, thickness: 1),
    );
  }
}
