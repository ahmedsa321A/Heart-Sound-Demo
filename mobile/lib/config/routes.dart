import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/app_config.dart';
import '../providers/auth_provider.dart';
import '../screens/landing/landing_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_step1_screen.dart';
import '../screens/auth/register_step2_screen.dart';
import '../screens/auth/verify_otp_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/reset_password_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/profile/profile_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final router = GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      // In demo mode: skip all auth, go straight to dashboard
      if (AppConfig.isDemoMode) {
        final isLanding = state.matchedLocation == '/';
        final isDashboard = state.matchedLocation == '/dashboard';
        final isProfile = state.matchedLocation == '/profile';

        // Allow landing, dashboard, and profile
        if (isLanding || isDashboard || isProfile) return null;

        // Redirect all other routes (auth screens) to dashboard
        return '/dashboard';
      }

      // Production mode: original auth redirect logic
      final authState = ref.read(authProvider);
      if (!authState.isInitialized) return null;

      final isLoggedIn = authState.isAuthenticated;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/register/step-2' ||
          state.matchedLocation == '/verify-otp' ||
          state.matchedLocation == '/forgot-password' ||
          state.matchedLocation == '/reset-password' ||
          state.matchedLocation == '/';

      final isProtectedRoute = state.matchedLocation == '/dashboard' ||
          state.matchedLocation == '/profile';

      // Redirect authenticated users away from auth pages to dashboard
      if (isLoggedIn && isAuthRoute && state.matchedLocation != '/') {
        return '/dashboard';
      }

      // Redirect unauthenticated users away from protected pages
      if (!isLoggedIn && isProtectedRoute) {
        return '/login';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const LandingScreen(),
      ),
      // Auth routes — kept for production mode
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterStep1Screen(),
      ),
      GoRoute(
        path: '/register/step-2',
        builder: (context, state) => const RegisterStep2Screen(),
      ),
      GoRoute(
        path: '/verify-otp',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return VerifyOTPScreen(
            email: extra['email'] as String? ?? '',
            mode: extra['mode'] as String? ?? 'register',
          );
        },
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>? ?? {};
          return ResetPasswordScreen(
            email: extra['email'] as String? ?? '',
          );
        },
      ),
      // App routes
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
  );

  if (!AppConfig.isDemoMode) {
    ref.listen<AuthState>(authProvider, (previous, next) {
      if (previous?.isAuthenticated != next.isAuthenticated ||
          previous?.isInitialized != next.isInitialized) {
        router.refresh();
      }
    });
  }

  return router;
});
