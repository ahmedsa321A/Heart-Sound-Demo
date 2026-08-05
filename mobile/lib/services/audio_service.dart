import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';

/// Audio service — mirrors React audioService.ts
final audioServiceProvider = Provider<AudioService>((ref) {
  return AudioService(ref.read(dioProvider));
});

class AudioService {
  final Dio _dio;

  AudioService(this._dio);

  /// Upload a WAV audio file for AI prediction.
  /// Returns the raw backend response map for the provider to process.
  Future<Map<String, dynamic>> uploadAudio(String filePath) async {
    final formData = FormData.fromMap({
      'audio': await MultipartFile.fromFile(filePath, filename: 'recording.wav'),
    });

    final response = await _dio.post(
      '/predections/makePrediction',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );

    return response.data as Map<String, dynamic>;
  }
}
