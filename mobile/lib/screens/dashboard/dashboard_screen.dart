import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../config/theme.dart';
import '../../models/analysis.dart';
import '../../providers/auth_provider.dart';
import '../../providers/recording_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../widgets/layouts/dashboard_layout.dart';
import '../../widgets/common/app_button.dart';
import '../../widgets/common/alert_card.dart';
import '../../widgets/common/app_loader.dart';
import '../../widgets/common/audio_player_widget.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  final AudioRecorder _audioRecorder = AudioRecorder();
  Timer? _recordingTimer;
  int _recordingTime = 0;
  AnalysisResult? _selectedReport;

  @override
  void dispose() {
    _recordingTimer?.cancel();
    _audioRecorder.dispose();
    super.dispose();
  }

  void _startTimer() {
    _recordingTimer?.cancel();
    setState(() => _recordingTime = 0);
    _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _recordingTime++;
      });
      if (_recordingTime >= 30) {
        _stopRecording();
      }
    });
  }

  Future<void> _startRecording() async {
    try {
      final hasPermission = await _audioRecorder.hasPermission();
      if (!hasPermission) {
        final status = await Permission.microphone.request();
        if (!status.isGranted) {
          ref.read(recordingProvider.notifier).setError('audio.micPermissionDenied'.tr());
          return;
        }
      }

      final tempDir = await getTemporaryDirectory();
      final filePath = '${tempDir.path}/heart_recording_${DateTime.now().millisecondsSinceEpoch}.wav';

      ref.read(recordingProvider.notifier).startRecording();
      await _audioRecorder.start(
        const RecordConfig(encoder: AudioEncoder.wav),
        path: filePath,
      );
      _startTimer();
    } catch (e) {
      ref.read(recordingProvider.notifier).setError('audio.micAccessError'.tr());
    }
  }

  Future<void> _stopRecording() async {
    _recordingTimer?.cancel();
    if (_recordingTime < 1) {
      await _audioRecorder.stop();
      ref.read(recordingProvider.notifier).setError('audio.recordingTooShort'.tr());
      return;
    }
    try {
      final path = await _audioRecorder.stop();
      if (path != null) {
        ref.read(recordingProvider.notifier).stopRecording(path);
      } else {
        ref.read(recordingProvider.notifier).setError('audio.failedToSave'.tr());
      }
    } catch (e) {
      ref.read(recordingProvider.notifier).setError('audio.failedToStop'.tr());
    }
  }

  void _resetRecording() {
    ref.read(recordingProvider.notifier).reset();
  }

  Future<void> _analyzeAudio(String path) async {
    await ref.read(recordingProvider.notifier).analyzeAudio(path);
    // Refresh stats after successful analysis
    final result = ref.read(recordingProvider).analysisResult;
    if (result != null) {
      ref.read(dashboardStatsProvider.notifier).addDemoResult(result);
    }
    ref.read(dashboardStatsProvider.notifier).fetchStats();
  }

  AnalysisResult _generateReportFromHistory(HistoryItem item) {
    final resultKey =
        item.diagnosis == 'Abnormal' ? 'audio.resultAbnormal' : 'audio.resultNormal';
    final translatedResult = resultKey.tr();

    return AnalysisResult(
      id: item.id,
      diagnosis: item.diagnosis,
      confidence: item.confidence ?? 0.0,
      createdAt: item.date,
      audioUrl: item.audioUrl ?? '',
      details: 'audio.analysisDetails'.tr(args: [translatedResult]),
      severity: item.diagnosis == 'Abnormal' ? 'high' : 'low',
      recommendations: item.diagnosis == 'Abnormal'
          ? ['audio.consultCardiologist'.tr(), 'audio.monitorSymptoms'.tr()]
          : ['audio.routineCheckup'.tr()],
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final recordingState = ref.watch(recordingProvider);
    final statsState = ref.watch(dashboardStatsProvider);

    return DashboardLayout(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Welcome message
          Text(
            'common.welcomeBack'.tr(args: [user?.fullName ?? 'User']),
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppTheme.gray900,
            ),
          ),
          Text(
            'dashboard.monitorHealth'.tr(),
            style: const TextStyle(fontSize: 16, color: AppTheme.gray600),
          ),
          const SizedBox(height: 24),

          // Main Responsive Grid
          LayoutBuilder(
            builder: (context, constraints) {
              final isWide = constraints.maxWidth > 800;
              return Flex(
                direction: isWide ? Axis.horizontal : Axis.vertical,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Left/Top Panel: Recording
                  Expanded(
                    flex: isWide ? 2 : 0,
                    child: Column(
                      children: [
                        _buildRecordingCard(recordingState),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                  if (isWide) const SizedBox(width: 24),
                  // Right/Bottom Panel: Stats & Activity
                  Expanded(
                    flex: isWide ? 1 : 0,
                    child: Column(
                      children: [
                        _buildStatsCard(statsState),
                        const SizedBox(height: 16),
                        _buildActivityCard(statsState),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),

          // Report dialog
          if (_selectedReport != null) _buildReportDialog(_selectedReport!),
        ],
      ),
    );
  }

  Widget _buildRecordingCard(RecordingState state) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'dashboard.recordTitle'.tr(),
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.gray900,
              ),
            ),
            const SizedBox(height: 24),

            // IDLE state
            if (state.status == RecordingStatus.idle) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.blue50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.blue100),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'dashboard.instructions'.tr(),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.blue900,
                                ),
                              ),
                              const SizedBox(height: 12),
                              _buildStep(1, 'dashboard.steps.step1'.tr()),
                              _buildStep(2, 'dashboard.steps.step2'.tr()),
                              _buildStep(3, 'dashboard.steps.step3'.tr()),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.asset(
                            'assets/images/instruction.jpg',
                            width: 120,
                            height: 120,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              Center(
                child: GestureDetector(
                  onTap: _startRecording,
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      gradient: AppTheme.primaryGradient,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.cyan500.withOpacity(0.4),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(Icons.mic, color: Colors.white, size: 48),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Text(
                  'dashboard.clickToStart'.tr(),
                  style: const TextStyle(color: AppTheme.gray500, fontSize: 14),
                ),
              ),
            ],

            // RECORDING state
            if (state.status == RecordingStatus.recording) ...[
              const Row(
                children: [
                  Icon(Icons.fiber_manual_record, color: Colors.red, size: 16),
                  SizedBox(width: 8),
                  Text(
                    'Recording...',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Container(
                height: 80,
                decoration: BoxDecoration(
                  color: AppTheme.gray50,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(child: WaveformAnimation()),
              ),
              const SizedBox(height: 32),
              Center(
                child: Column(
                  children: [
                    Text(
                      '${_recordingTime}s / 30s',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.cyan600,
                      ),
                    ),
                    const SizedBox(height: 16),
                    AppButton(
                      text: 'dashboard.stopRecording'.tr(),
                      onPressed: _stopRecording,
                      fullWidth: false,
                      icon: const Icon(Icons.stop, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ],

            // REVIEW state
            if (state.status == RecordingStatus.review && state.audioPath != null) ...[
              Center(
                child: Column(
                  children: [
                    Text(
                      'dashboard.reviewRecording'.tr(),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.gray900,
                      ),
                    ),
                    const SizedBox(height: 16),
                    AudioPlayerWidget(audioPath: state.audioPath!),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AppButton(
                          text: 'dashboard.discard'.tr(),
                          onPressed: _resetRecording,
                          outlined: true,
                          fullWidth: false,
                        ),
                        const SizedBox(width: 16),
                        AppButton(
                          text: 'dashboard.submitAnalysis'.tr(),
                          onPressed: () => _analyzeAudio(state.audioPath!),
                          fullWidth: false,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],

            // ANALYZING state
            if (state.status == RecordingStatus.analyzing) ...[
              const Center(
                child: Column(
                  children: [
                    AppLoader(size: 60),
                    SizedBox(height: 24),
                    Text(
                      'Analyzing sound...',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text('This may take up to a minute...'),
                  ],
                ),
              ),
            ],

            // COMPLETE state
            if (state.status == RecordingStatus.complete && state.analysisResult != null) ...[
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: state.analysisResult!.isNormal ? AppTheme.green100 : AppTheme.amber100,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        state.analysisResult!.isNormal ? Icons.check_circle : Icons.warning_amber_rounded,
                        color: state.analysisResult!.isNormal ? AppTheme.green600 : AppTheme.amber700,
                        size: 48,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      state.analysisResult!.isNormal ? 'dashboard.normalResult'.tr() : 'dashboard.needsAttention'.tr(),
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.gray900,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        state.analysisResult!.details,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: AppTheme.gray600),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AppButton(
                          text: 'dashboard.recordAgain'.tr(),
                          onPressed: _resetRecording,
                          outlined: true,
                          fullWidth: false,
                        ),
                        const SizedBox(width: 16),
                        AppButton(
                          text: 'dashboard.viewReport'.tr(),
                          onPressed: () => setState(() => _selectedReport = state.analysisResult),
                          fullWidth: false,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],

            // ERROR state
            if (state.status == RecordingStatus.error) ...[
              AlertCard(
                message: state.error ?? 'An error occurred during recording',
                variant: AlertVariant.error,
                onClose: _resetRecording,
              ),
              const SizedBox(height: 16),
              Center(
                child: AppButton(
                  text: 'dashboard.recordAgain'.tr(),
                  onPressed: _resetRecording,
                  outlined: true,
                  fullWidth: false,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStep(int number, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: const BoxDecoration(
              color: AppTheme.blue100,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$number',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.blue700,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: AppTheme.blue800, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsCard(DashboardStatsState state) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'dashboard.quickStats'.tr(),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.gray900,
              ),
            ),
            const SizedBox(height: 16),
            _buildStatItem(
              icon: const Icon(Icons.show_chart, color: AppTheme.cyan600),
              label: 'dashboard.totalRecordings'.tr(),
              value: state.stats?.totalRecordings.toString() ?? '0',
            ),
            const SizedBox(height: 12),
            _buildStatItem(
              icon: const Icon(Icons.check_circle_outline, color: AppTheme.green600),
              label: 'dashboard.normalResults'.tr(),
              value: state.stats?.normalResults.toString() ?? '0',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem({
    required Widget icon,
    required String label,
    required String value,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppTheme.cyan50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(child: icon),
            ),
            const SizedBox(width: 12),
            Text(label, style: const TextStyle(color: AppTheme.gray600)),
          ],
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.gray900,
          ),
        ),
      ],
    );
  }

  Widget _buildActivityCard(DashboardStatsState state) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'dashboard.recentActivity'.tr(),
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.gray900,
              ),
            ),
            const SizedBox(height: 16),
            if (state.isLoading)
              const Center(child: AppLoader(size: 24))
            else if (state.stats == null || state.stats!.recentActivity.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Text(
                    'dashboard.noRecentActivity'.tr(),
                    style: const TextStyle(color: AppTheme.gray400, fontSize: 14),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: state.stats!.recentActivity.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final item = state.stats!.recentActivity[index];
                  return _buildActivityItem(item);
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityItem(HistoryItem item) {
    String formattedDate = '';
    try {
      final date = DateTime.parse(item.date).toLocal();
      formattedDate = DateFormat.yMd(context.locale.languageCode).format(date);
    } catch (_) {
      formattedDate = item.date;
    }

    final translatedResult =
        item.diagnosis == 'Normal' ? 'audio.resultNormal'.tr() : 'audio.resultAbnormal'.tr();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.gray50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  formattedDate,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppTheme.gray900,
                  ),
                ),
                Text(
                  'dashboard.heartSoundRecording'.tr(),
                  style: const TextStyle(fontSize: 12, color: AppTheme.gray500),
                ),
              ],
            ),
          ),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: item.isNormal ? AppTheme.green50 : AppTheme.amber100,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: item.isNormal ? AppTheme.green100 : AppTheme.amber100,
                  ),
                ),
                child: Text(
                  translatedResult,
                  style: TextStyle(
                    color: item.isNormal ? AppTheme.green700 : AppTheme.amber700,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: () {
                  setState(() {
                    _selectedReport = _generateReportFromHistory(item);
                  });
                },
                icon: const Icon(Icons.visibility, color: AppTheme.gray500, size: 20),
                tooltip: 'dashboard.viewReport'.tr(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReportDialog(AnalysisResult report) {
    String formattedDate = '';
    try {
      final date = DateTime.parse(report.createdAt).toLocal();
      formattedDate = DateFormat.yMd(context.locale.languageCode).add_jm().format(date);
    } catch (_) {
      formattedDate = report.createdAt;
    }

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.analytics, color: AppTheme.cyan600),
                      const SizedBox(width: 8),
                      Text(
                        'dashboard.analysisReport'.tr(),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    onPressed: () => setState(() => _selectedReport = null),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              Text(
                formattedDate,
                style: const TextStyle(color: AppTheme.gray500, fontSize: 13),
              ),
              const SizedBox(height: 20),

              // Status Badge
              Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: report.isNormal ? AppTheme.green50 : AppTheme.amber100,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: report.isNormal ? AppTheme.green100 : AppTheme.amber100,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        report.isNormal ? Icons.check_circle : Icons.warning_amber_rounded,
                        color: report.isNormal ? AppTheme.green600 : AppTheme.amber700,
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        report.isNormal ? 'dashboard.normalResult'.tr() : 'dashboard.needsAttention'.tr(),
                        style: TextStyle(
                          color: report.isNormal ? AppTheme.green700 : AppTheme.amber700,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Confidence score
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('dashboard.confidenceScore'.tr(), style: const TextStyle(color: AppTheme.gray600)),
                  Text(
                    '${(report.confidence * 100).toStringAsFixed(1)}%',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: report.isNormal ? AppTheme.green700 : AppTheme.amber700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                height: 8,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppTheme.gray100,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: FractionallySizedBox(
                    widthFactor: report.confidence,
                    child: Container(
                      decoration: BoxDecoration(
                        color: report.isNormal ? AppTheme.green600 : AppTheme.amber600,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Details
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppTheme.gray50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  report.details,
                  style: const TextStyle(color: AppTheme.gray700, height: 1.4),
                ),
              ),
              const SizedBox(height: 20),

              // Recommendations
              if (report.recommendations != null && report.recommendations!.isNotEmpty) ...[
                Text(
                  'dashboard.recommendations'.tr(),
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                ...report.recommendations!.map((rec) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            margin: const EdgeInsets.only(top: 6),
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: AppTheme.cyan600,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              rec,
                              style: const TextStyle(color: AppTheme.gray600, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    )),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class WaveformAnimation extends StatefulWidget {
  const WaveformAnimation({super.key});

  @override
  State<WaveformAnimation> createState() => _WaveformAnimationState();
}

class _WaveformAnimationState extends State<WaveformAnimation>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  final List<double> _heightMultiplier = [];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat();

    final r = Random();
    for (int i = 0; i < 30; i++) {
      _heightMultiplier.add(r.nextDouble() * 0.6 + 0.2);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(30, (index) {
            final phase = sin(_controller.value * 2 * pi + index * 0.2);
            final height = (phase.abs() * _heightMultiplier[index] * 50) + 10;
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 1.5),
              width: 3,
              height: height,
              decoration: BoxDecoration(
                color: AppTheme.cyan600,
                borderRadius: BorderRadius.circular(1.5),
              ),
            );
          }),
        );
      },
    );
  }
}
