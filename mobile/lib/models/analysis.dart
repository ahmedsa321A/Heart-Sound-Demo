/// Analysis result model mirroring React AnalysisResponse.
class AnalysisResult {
  final String id;
  final String diagnosis;
  final double confidence;
  final String createdAt;
  final String audioUrl;
  final String details;
  final String? severity;
  final List<String>? recommendations;

  const AnalysisResult({
    required this.id,
    required this.diagnosis,
    required this.confidence,
    required this.createdAt,
    this.audioUrl = '',
    this.details = '',
    this.severity,
    this.recommendations,
  });

  bool get isNormal => diagnosis == 'Normal';
  bool get isAbnormal => diagnosis == 'Abnormal';
  bool get isNoise => diagnosis == 'Noise' || diagnosis == 'Invalid';

  factory AnalysisResult.fromBackendJson(Map<String, dynamic> json) {
    final diagnosis = json['predictionResult'] as String? ?? 'Unknown';
    final isAbnormal = diagnosis == 'Abnormal';
    final isNoise = diagnosis == 'Noise' || diagnosis == 'Invalid';

    return AnalysisResult(
      id: json['_id'] as String? ?? '',
      diagnosis: diagnosis,
      confidence: (json['predictionScore'] as num?)?.toDouble() ?? 0.0,
      createdAt: json['createdAt'] as String? ?? '',
      audioUrl: '',
      details: '', // Will be set with translated text in provider
      severity: isAbnormal ? 'high' : (isNoise ? 'medium' : 'low'),
      recommendations: null, // Will be set with translated text in provider
    );
  }

  AnalysisResult copyWith({
    String? details,
    List<String>? recommendations,
  }) {
    return AnalysisResult(
      id: id,
      diagnosis: diagnosis,
      confidence: confidence,
      createdAt: createdAt,
      audioUrl: audioUrl,
      details: details ?? this.details,
      severity: severity,
      recommendations: recommendations ?? this.recommendations,
    );
  }
}

/// History item mirroring React HistoryItem.
class HistoryItem {
  final String id;
  final String date;
  final String diagnosis;
  final String status; // 'normal' | 'attention' | 'noise'
  final String? audioUrl;
  final double? confidence;

  const HistoryItem({
    required this.id,
    required this.date,
    required this.diagnosis,
    required this.status,
    this.audioUrl,
    this.confidence,
  });

  bool get isNormal => status == 'normal' || diagnosis == 'Normal';
  bool get isNoise =>
      status == 'noise' || diagnosis == 'Noise' || diagnosis == 'Invalid';

  factory HistoryItem.fromJson(Map<String, dynamic> json) {
    final diagnosis =
        json['predictionResult'] as String? ?? json['diagnosis'] as String? ?? '';
    String status;
    if (diagnosis == 'Normal') {
      status = 'normal';
    } else if (diagnosis == 'Noise' || diagnosis == 'Invalid') {
      status = 'noise';
    } else {
      status = 'attention';
    }

    return HistoryItem(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      date: json['createdAt'] as String? ?? json['date'] as String? ?? '',
      diagnosis: diagnosis,
      status: status,
      audioUrl: json['audioUrl'] as String?,
      confidence: (json['predictionScore'] as num?)?.toDouble() ??
          (json['confidence'] as num?)?.toDouble(),
    );
  }
}

/// Dashboard stats response.
class DashboardStats {
  final List<HistoryItem> recentActivity;
  final int totalRecordings;
  final int normalResults;

  const DashboardStats({
    this.recentActivity = const [],
    this.totalRecordings = 0,
    this.normalResults = 0,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    final recentList = (json['recentActivity'] as List<dynamic>?) ?? [];
    final stats = json['stats'] as Map<String, dynamic>? ?? {};

    return DashboardStats(
      recentActivity: recentList
          .map((e) => HistoryItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalRecordings: stats['totalRecordings'] as int? ?? 0,
      normalResults: stats['normalResults'] as int? ?? 0,
    );
  }
}
