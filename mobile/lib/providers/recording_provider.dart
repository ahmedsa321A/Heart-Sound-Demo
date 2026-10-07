import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../models/analysis.dart';
import '../services/audio_service.dart';
import '../services/demo/local_inference_service.dart';
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

/// Recording state notifier — supports both demo (local inference) and
/// production (backend upload) modes.
class RecordingNotifier extends StateNotifier<RecordingState> {
  final AudioService? _audioService;
  final LocalInferenceService? _localInference;

  RecordingNotifier(this._audioService, this._localInference)
      : super(const RecordingState());

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
      AnalysisResult result;

      if (AppConfig.isDemoMode) {
        // ─── Demo mode: local on-device inference ───
        result = await _localInference!.analyzeAudio(filePath);
      } else {
        // ─── Production mode: upload to backend (original behavior) ───
        final backendData = await _audioService!.uploadAudio(filePath);
        final diagnosis =
            backendData['predictionResult'] as String? ?? 'Unknown';
        final isNoise = diagnosis == 'Noise' || diagnosis == 'Invalid';
        final isAbnormal = diagnosis == 'Abnormal';

        String details;
        String severity;
        List<String> recommendations;

        if (isNoise) {
          details = 'audio.noiseDetails'.tr();
          severity = 'medium';
          recommendations = [
            'audio.placeFirmly'.tr(),
            'audio.quietEnvironment'.tr(),
            'audio.removeCover'.tr(),
          ];
        } else if (isAbnormal) {
          final translatedResult = 'audio.resultAbnormal'.tr();
          details = 'audio.analysisDetails'.tr(args: [translatedResult]);
          severity = 'high';
          recommendations = [
            'audio.consultCardiologist'.tr(),
            'audio.monitorSymptoms'.tr()
          ];
        } else {
          final translatedResult = 'audio.resultNormal'.tr();
          details = 'audio.analysisDetails'.tr(args: [translatedResult]);
          severity = 'low';
          recommendations = ['audio.routineCheckup'.tr()];
        }

        result = AnalysisResult(
          id: backendData['_id'] as String? ?? '',
          diagnosis: diagnosis,
          confidence:
              (backendData['predictionScore'] as num?)?.toDouble() ?? 0.0,
          createdAt: backendData['createdAt'] as String? ?? '',
          audioUrl: '',
          details: details,
          severity: severity,
          recommendations: recommendations,
        );
      }

      state = state.copyWith(
        status: RecordingStatus.complete,
        analysisResult: result,
      );
    } catch (e) {
      String errorMessage = 'audio.analysisFailed'.tr();

      if (!AppConfig.isDemoMode && e is Exception) {
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
      } else if (AppConfig.isDemoMode) {
        // In demo mode, show the actual error for debugging
        errorMessage = e.toString();
      }

      state = state.copyWith(
        status: RecordingStatus.error,
        error: errorMessage,
      );
    }
  }
}

/// Singleton local inference service for demo mode.
final localInferenceProvider = Provider<LocalInferenceService>((ref) {
  return LocalInferenceService();
});

final recordingProvider =
    StateNotifierProvider<RecordingNotifier, RecordingState>((ref) {
  if (AppConfig.isDemoMode) {
    return RecordingNotifier(null, ref.read(localInferenceProvider));
  }
  return RecordingNotifier(ref.read(audioServiceProvider), null);
});
