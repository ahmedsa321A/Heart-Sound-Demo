import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/analysis.dart';
import 'api_client.dart';

/// History service — mirrors React historyService.ts
final historyServiceProvider = Provider<HistoryService>((ref) {
  return HistoryService(ref.read(dioProvider));
});

class HistoryService {
  final Dio _dio;

  HistoryService(this._dio);

  Future<DashboardStats> getDashboardStats() async {
    final response = await _dio.get('/predections/dashboard-stats');
    return DashboardStats.fromJson(response.data as Map<String, dynamic>);
  }

  Future<HistoryItem> getHistoryItem(String id) async {
    final response = await _dio.get('/predections/getPrediction/$id');
    return HistoryItem.fromJson(response.data as Map<String, dynamic>);
  }
}
