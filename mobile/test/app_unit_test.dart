import 'package:flutter_test/flutter_test.dart';
import 'package:heart_ai/models/user.dart';
import 'package:heart_ai/models/analysis.dart';
import 'package:heart_ai/utils/validators.dart';
import 'package:heart_ai/utils/message_translator.dart';
import 'package:heart_ai/config/app_config.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('User Model Tests', () {
    test('User.fromJson & toJson', () {
      final json = {
        'id': 'user_123',
        'email': 'test@example.com',
        'fullName': 'John Doe',
        'age': 30,
        'gender': 'Male',
        'phoneNumber': '+1234567890',
        'address': '123 Medical St',
      };

      final user = User.fromJson(json);
      expect(user.id, 'user_123');
      expect(user.email, 'test@example.com');
      expect(user.fullName, 'John Doe');
      expect(user.age, 30);
      expect(user.gender, 'Male');
      expect(user.phoneNumber, '+1234567890');
      expect(user.address, '123 Medical St');

      final outputJson = user.toJson();
      expect(outputJson['fullName'], 'John Doe');
      expect(outputJson['email'], 'test@example.com');
    });

    test('User.copyWith', () {
      final user = const User(
        id: '1',
        email: 'old@example.com',
        fullName: 'Old Name',
        age: 20,
        gender: 'Female',
      );

      final updated = user.copyWith(fullName: 'New Name', age: 21);
      expect(updated.fullName, 'New Name');
      expect(updated.email, 'old@example.com');
      expect(updated.age, 21);
    });
  });

  group('AnalysisResult Model Tests', () {
    test('AnalysisResult getters', () {
      final resultNormal = AnalysisResult(
        id: 'p1',
        diagnosis: 'Normal',
        confidence: 0.95,
        createdAt: '2026-07-22T10:00:00Z',
        details: 'Heart sound normal',
      );

      expect(resultNormal.isNormal, true);

      final resultAbnormal = AnalysisResult(
        id: 'p2',
        diagnosis: 'Abnormal',
        confidence: 0.88,
        createdAt: '2026-07-22T10:00:00Z',
        details: 'Heart sound abnormal',
      );

      expect(resultAbnormal.isNormal, false);
    });
  });

  group('Validator Utility Tests', () {
    test('validateLogin empty email & empty password', () {
      final errors = validateLogin(email: '', password: '');
      expect(errors.containsKey('email'), true);
      expect(errors.containsKey('password'), true);
    });

    test('validateLogin valid input', () {
      final errors = validateLogin(email: 'valid@example.com', password: 'Password123');
      expect(errors.isEmpty, true);
    });

    test('validateRegisterStep1 invalid email & short name', () {
      final errors = validateRegisterStep1(
        fullName: 'Ab',
        email: 'invalid-email',
        password: 'pass',
        age: '150',
        gender: 'Male',
      );
      expect(errors.containsKey('fullName'), true);
      expect(errors.containsKey('email'), true);
      expect(errors.containsKey('password'), true);
      expect(errors.containsKey('age'), true);
    });
  });

  group('Message Extractor Tests', () {
    test('extractErrorMessage string and fallback', () {
      expect(extractErrorMessage('User already exists'), 'User already exists');
      expect(extractErrorMessage(null, fallback: 'Default Error'), 'Default Error');
    });
  });

  group('AppConfig Tests', () {
    test('apiBaseUrl returns valid string', () {
      final url = AppConfig.apiBaseUrl;
      expect(url.isNotEmpty, true);
      expect(url.startsWith('http'), true);
    });
  });
}
