import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../models/analysis.dart';
import '../services/history_service.dart';
import '../services/demo/demo_history_service.dart';

class DashboardStatsState {
  final DashboardStats? stats;
  final bool isLoading;
  final String? error;

  const DashboardStatsState({
    this.stats,
    this.isLoading = false,
    this.error,
  });

  DashboardStatsState copyWith({
    DashboardStats? stats,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return DashboardStatsState(
      stats: stats ?? this.stats,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class DashboardStatsNotifier extends StateNotifier<DashboardStatsState> {
  final HistoryService? _historyService;
  final DemoHistoryService? _demoHistoryService;

  DashboardStatsNotifier(this._historyService, this._demoHistoryService)
      : super(const DashboardStatsState()) {
    fetchStats();
  }

  /// Add a result to demo history and refresh stats.
  void addDemoResult(AnalysisResult result) {
    if (AppConfig.isDemoMode && _demoHistoryService != null) {
      _demoHistoryService!.addResult(result);
      fetchStats();
    }
  }

  Future<void> fetchStats() async {
    state = state.copyWith(isLoading: true, clearError: true);

    if (AppConfig.isDemoMode) {
      // Demo mode: get in-memory stats
      final stats = _demoHistoryService!.getDashboardStats();
      state = state.copyWith(stats: stats, isLoading: false);
      return;
    }

    // Production mode: fetch from backend
    try {
      final stats = await _historyService!.getDashboardStats();
      state = state.copyWith(stats: stats, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }
}

/// Singleton demo history service.
final demoHistoryProvider = Provider<DemoHistoryService>((ref) {
  return DemoHistoryService();
});

final dashboardStatsProvider =
    StateNotifierProvider<DashboardStatsNotifier, DashboardStatsState>((ref) {
  if (AppConfig.isDemoMode) {
    return DashboardStatsNotifier(null, ref.read(demoHistoryProvider));
  }
  return DashboardStatsNotifier(ref.read(historyServiceProvider), null);
});
