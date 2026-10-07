import 'package:tflite_flutter/tflite_flutter.dart';
import '../../models/analysis.dart';
import 'mfcc_extractor.dart';
import 'package:easy_localization/easy_localization.dart';

/// Local on-device inference service using TFLite.
/// Replaces the backend AI service for offline demo mode.
class LocalInferenceService {
  Interpreter? _interpreter;
  bool _isLoaded = false;

  bool get isLoaded => _isLoaded;

  /// Load the TFLite model from assets.
  Future<void> loadModel() async {
    if (_isLoaded) return;
    try {
      _interpreter = await Interpreter.fromAsset('assets/models/heart_model.tflite');
      _isLoaded = true;
      print('[LocalInference] Model loaded successfully');
    } catch (e) {
      print('[LocalInference] Failed to load model: $e');
      rethrow;
    }
  }

  /// Run inference on a WAV file path.
  /// Returns the same structure as the backend: {predictionResult, predictionScore}
  Future<Map<String, dynamic>> predict(String wavPath) async {
    // 1. Signal Quality & Noise Check (Gatekeeper)
    final quality = MfccExtractor.evaluateAudioQuality(wavPath);
    if (!quality.isValidHeartSound) {
      return {
        'predictionResult': 'Noise',
        'predictionScore': 0.0,
        'qualityReason': quality.reason,
      };
    }

    if (!_isLoaded || _interpreter == null) {
      await loadModel();
    }

    // 2. Preprocess audio → MFCC features for each segment
    final segmentMfccs = MfccExtractor.processAudioFile(wavPath);

    if (segmentMfccs.isEmpty) {
      throw Exception('No valid segments could be extracted from audio');
    }

    // 3. Run inference per segment
    final segmentProbs = <double>[];

    for (final mfcc in segmentMfccs) {
      // Prepare input: shape (1, 32, 40, 1)
      final input = List.generate(
        1,
        (_) => List.generate(
          MfccExtractor.maxTimeSteps,
          (t) => List.generate(
            MfccExtractor.nMfcc,
            (f) => [mfcc[t][f]],
          ),
        ),
      );

      // Output buffer: shape (1, 1) 
      final output = List.generate(1, (_) => List.filled(1, 0.0));

      _interpreter!.run(input, output);

      final prob = output[0][0];
      segmentProbs.add(prob);
    }

    if (segmentProbs.isEmpty) {
      throw Exception('Failed to generate predictions');
    }

    // 4. Aggregate using top-3 mean (same as Python API)
    segmentProbs.sort((a, b) => b.compareTo(a)); // descending
    final topK = segmentProbs.length < 3 ? segmentProbs.length : 3;
    double topSum = 0;
    for (int i = 0; i < topK; i++) {
      topSum += segmentProbs[i];
    }
    final finalScore = topSum / topK;

    // 5. Apply threshold
    final result =
        finalScore >= MfccExtractor.optimalThreshold ? 'Abnormal' : 'Normal';

    return {
      'predictionResult': result,
      'predictionScore': double.parse(finalScore.toStringAsFixed(4)),
    };
  }

  /// Full analysis pipeline — returns an AnalysisResult ready for the UI.
  Future<AnalysisResult> analyzeAudio(String filePath) async {
    final backendData = await predict(filePath);

    final diagnosis = backendData['predictionResult'] as String;
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
        'audio.monitorSymptoms'.tr(),
      ];
    } else {
      final translatedResult = 'audio.resultNormal'.tr();
      details = 'audio.analysisDetails'.tr(args: [translatedResult]);
      severity = 'low';
      recommendations = [
        'audio.routineCheckup'.tr(),
      ];
    }

    return AnalysisResult(
      id: 'demo_${DateTime.now().millisecondsSinceEpoch}',
      diagnosis: diagnosis,
      confidence: (backendData['predictionScore'] as num?)?.toDouble() ?? 0.0,
      createdAt: DateTime.now().toIso8601String(),
      audioUrl: '',
      details: details,
      severity: severity,
      recommendations: recommendations,
    );
  }

  void dispose() {
    _interpreter?.close();
    _interpreter = null;
    _isLoaded = false;
  }
}
