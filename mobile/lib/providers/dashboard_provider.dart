import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/analysis.dart';
import '../services/history_service.dart';

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
  final HistoryService _historyService;

  DashboardStatsNotifier(this._historyService)
      : super(const DashboardStatsState()) {
    fetchStats();
  }

  Future<void> fetchStats() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final stats = await _historyService.getDashboardStats();
      state = state.copyWith(stats: stats, isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }
}

final dashboardStatsProvider =
    StateNotifierProvider<DashboardStatsNotifier, DashboardStatsState>((ref) {
  return DashboardStatsNotifier(ref.read(historyServiceProvider));
});
