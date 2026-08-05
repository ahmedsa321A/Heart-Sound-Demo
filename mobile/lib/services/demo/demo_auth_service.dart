import '../../models/auth.dart';
import '../../models/user.dart';

/// Demo auth service — always returns a hardcoded demo user.
/// No network calls, no database. Used in demo mode only.
class DemoAuthService {
  static const _demoUser = User(
    id: 'demo_user_001',
    fullName: 'Demo User',
    email: 'demo@heartai.app',
    age: 30,
    gender: 'Male',
  );

  User get demoUser => _demoUser;

  Future<AuthResponse> login(LoginCredentials credentials) async {
    // Simulate a tiny delay for realism
    await Future.delayed(const Duration(milliseconds: 300));
    return const AuthResponse(
      user: _demoUser,
      msg: 'Demo login successful',
      success: true,
    );
  }

  Future<User?> getCurrentUser() async {
    return _demoUser;
  }

  Future<void> logout() async {
    // No-op in demo mode
  }

  Future<bool> updateProfile({String? fullName, int? age}) async {
    // In demo mode, profile updates are no-ops (but return success)
    await Future.delayed(const Duration(milliseconds: 200));
    return true;
  }
}
