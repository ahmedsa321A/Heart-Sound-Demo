import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import '../../config/theme.dart';

class AudioPlayerWidget extends StatefulWidget {
  final String audioPath;

  const AudioPlayerWidget({super.key, required this.audioPath});

  @override
  State<AudioPlayerWidget> createState() => _AudioPlayerWidgetState();
}

class _AudioPlayerWidgetState extends State<AudioPlayerWidget> {
  late final AudioPlayer _player;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;
  bool _isPlaying = false;

  @override
  void initState() {
    super.initState();
    _player = AudioPlayer();
    _setupListeners();
    _initPlayer();
  }

  void _setupListeners() {
    _player.durationStream.listen((d) {
      if (mounted && d != null) {
        setState(() => _duration = d);
      }
    });

    _player.positionStream.listen((p) {
      if (mounted) {
        setState(() => _position = p);
      }
    });

    _player.playerStateStream.listen((state) {
      if (mounted) {
        setState(() {
          _isPlaying = state.playing;
          if (state.processingState == ProcessingState.completed) {
            _player.seek(Duration.zero);
            _player.pause();
          }
        });
      }
    });
  }

  @override
  void didUpdateWidget(AudioPlayerWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.audioPath != widget.audioPath) {
      _initPlayer();
    }
  }

  Future<void> _initPlayer() async {
    try {
      await _player.stop();
      final path = widget.audioPath;
      if (path.isEmpty) return;

      if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('content://')) {
        await _player.setUrl(path);
      } else {
        final fileUri = path.startsWith('file://') ? Uri.parse(path) : Uri.file(path);
        await _player.setAudioSource(AudioSource.uri(fileUri));
      }
    } catch (e) {
      debugPrint('Error loading audio with primary method: $e');
      try {
        await _player.setAudioSource(AudioSource.uri(Uri.parse(widget.audioPath)));
      } catch (e2) {
        debugPrint('Fallback audio load failed: $e2');
      }
    }
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  String _formatDuration(Duration d) {
    final minutes = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.gray200),
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () async {
                  if (_isPlaying) {
                    await _player.pause();
                  } else {
                    if (_player.processingState == ProcessingState.completed) {
                      await _player.seek(Duration.zero);
                    }
                    await _player.play();
                  }
                },
                icon: Icon(
                  _isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled,
                  size: 48,
                  color: AppTheme.cyan600,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    trackHeight: 4,
                    thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                    overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
                    activeTrackColor: AppTheme.cyan600,
                    inactiveTrackColor: AppTheme.gray200,
                    thumbColor: AppTheme.cyan600,
                  ),
                  child: Slider(
                    value: _position.inMilliseconds.toDouble(),
                    max: _duration.inMilliseconds.toDouble() > 0
                        ? _duration.inMilliseconds.toDouble()
                        : 1.0,
                    onChanged: (value) {
                      _player.seek(Duration(milliseconds: value.toInt()));
                    },
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _formatDuration(_position),
                  style: const TextStyle(fontSize: 12, color: AppTheme.gray500),
                ),
                Text(
                  _formatDuration(_duration),
                  style: const TextStyle(fontSize: 12, color: AppTheme.gray500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
