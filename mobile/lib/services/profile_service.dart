import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import 'api_client.dart';

/// Profile service — mirrors React profileService.ts
final profileServiceProvider = Provider<ProfileService>((ref) {
  return ProfileService(ref.read(dioProvider));
});

class ProfileService {
  final Dio _dio;

  ProfileService(this._dio);

  Future<User> getProfile() async {
    final response = await _dio.get('/users/profile');
    final data = response.data as Map<String, dynamic>;
    return User.fromJson(data['data'] as Map<String, dynamic>);
  }

  Future<User> updateProfile(Map<String, dynamic> updates) async {
    final response = await _dio.put('/users/profile', data: updates);
    final data = response.data as Map<String, dynamic>;
    return User.fromJson(data['data'] as Map<String, dynamic>);
  }
}
