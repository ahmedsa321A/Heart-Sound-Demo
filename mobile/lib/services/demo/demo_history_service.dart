import '../../models/analysis.dart';

/// Demo history service — stores recordings in memory during the session.
/// Resets on app restart. No database or backend needed.
class DemoHistoryService {
  final List<HistoryItem> _history = [];
  int _normalCount = 0;

  /// Get dashboard stats from in-memory history.
  DashboardStats getDashboardStats() {
    return DashboardStats(
      recentActivity: List.unmodifiable(_history),
      totalRecordings: _history.length,
      normalResults: _normalCount,
    );
  }

  /// Add a new analysis result to the in-memory history.
  void addResult(AnalysisResult result) {
    final item = HistoryItem(
      id: result.id,
      date: result.createdAt,
      diagnosis: result.diagnosis,
      status: result.isNormal ? 'normal' : 'attention',
      confidence: result.confidence,
    );
    _history.insert(0, item); // Most recent first
    if (result.isNormal) _normalCount++;
  }

  /// Get a specific history item by ID.
  HistoryItem? getHistoryItem(String id) {
    try {
      return _history.firstWhere((item) => item.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Clear all history.
  void clear() {
    _history.clear();
    _normalCount = 0;
  }
}
