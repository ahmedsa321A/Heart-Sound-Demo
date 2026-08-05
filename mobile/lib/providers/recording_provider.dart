import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/analysis.dart';
import '../services/audio_service.dart';
import 'package:easy_localization/easy_localization.dart';

/// Recording status enum — mirrors React RecordingStatus type.
enum RecordingStatus { idle, recording, review, analyzing, complete, error }

/// Recording state — mirrors React RecordingState from recordingSlice.ts
class RecordingState {
  final RecordingStatus status;
  final String? audioPath;
  final AnalysisResult? analysisResult;
  final String? error;

  const RecordingState({
    this.status = RecordingStatus.idle,
    this.audioPath,
    this.analysisResult,
    this.error,
  });

  RecordingState copyWith({
    RecordingStatus? status,
    String? audioPath,
    AnalysisResult? analysisResult,
    String? error,
    bool clearAudio = false,
    bool clearResult = false,
    bool clearError = false,
  }) {
    return RecordingState(
      status: status ?? this.status,
      audioPath: clearAudio ? null : (audioPath ?? this.audioPath),
      analysisResult:
          clearResult ? null : (analysisResult ?? this.analysisResult),
      error: clearError ? null : (error ?? this.error),
    );
  }
}

/// Recording state notifier — mirrors React recordingSlice.ts
class RecordingNotifier extends StateNotifier<RecordingState> {
  final AudioService _audioService;

  RecordingNotifier(this._audioService) : super(const RecordingState());

  void startRecording() {
    state = state.copyWith(
      status: RecordingStatus.recording,
      clearError: true,
    );
  }

  void stopRecording(String audioPath) {
    state = state.copyWith(
      status: RecordingStatus.review,
      audioPath: audioPath,
    );
  }

  void setError(String error) {
    state = state.copyWith(
      status: RecordingStatus.error,
      error: error,
    );
  }

  void reset() {
    state = const RecordingState();
  }

  Future<void> analyzeAudio(String filePath) async {
    state = state.copyWith(
      status: RecordingStatus.analyzing,
      clearError: true,
    );
    try {
      final backendData = await _audioService.uploadAudio(filePath);
      final diagnosis = backendData['predictionResult'] as String? ?? 'Unknown';
      final isAbnormal = diagnosis == 'Abnormal';

      final resultKey =
          isAbnormal ? 'audio.resultAbnormal' : 'audio.resultNormal';
      final translatedResult = resultKey.tr();

      final result = AnalysisResult(
        id: backendData['_id'] as String? ?? '',
        diagnosis: diagnosis,
        confidence:
            (backendData['predictionScore'] as num?)?.toDouble() ?? 0.0,
        createdAt: backendData['createdAt'] as String? ?? '',
        audioUrl: '',
        details: 'audio.analysisDetails'.tr(args: [translatedResult]),
        severity: isAbnormal ? 'high' : 'low',
        recommendations: isAbnormal
            ? ['audio.consultCardiologist'.tr(), 'audio.monitorSymptoms'.tr()]
            : ['audio.routineCheckup'.tr()],
      );

      state = state.copyWith(
        status: RecordingStatus.complete,
        analysisResult: result,
      );
    } catch (e) {
      String errorMessage = 'audio.analysisFailed'.tr();

      if (e is Exception) {
        try {
          final dynamic dioError = e;
          final backendMessage =
              dioError.response?.data?['message'] as String?;
          if (backendMessage == 'No audio file provided') {
            errorMessage = 'audio.noFileProvided'.tr();
          } else if (backendMessage == 'AI Service Error') {
            errorMessage = 'audio.aiServiceError'.tr();
          } else if (backendMessage == 'User not found') {
            errorMessage = 'validation.userNotFound'.tr();
          } else if (backendMessage == 'Server Error') {
            errorMessage = 'auth.serverError'.tr();
          } else if (backendMessage != null) {
            errorMessage = backendMessage;
          }
        } catch (_) {}
      }

      state = state.copyWith(
        status: RecordingStatus.error,
        error: errorMessage,
      );
    }
  }
}

final recordingProvider =
    StateNotifierProvider<RecordingNotifier, RecordingState>((ref) {
  return RecordingNotifier(ref.read(audioServiceProvider));
});
