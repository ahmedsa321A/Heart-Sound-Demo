import 'dart:io';
import 'dart:math';
import 'dart:typed_data';

/// Result of signal quality assessment.
class AudioQualityResult {
  final bool isValidHeartSound;
  final String reason; // 'valid', 'silence', 'high_frequency_noise', 'clapping_or_tapping', 'irregular_rhythm'
  final double lowFreqEnergyRatio;
  final double crestFactor;
  final double rms;
  final double rhythmScore;

  const AudioQualityResult({
    required this.isValidHeartSound,
    required this.reason,
    required this.lowFreqEnergyRatio,
    required this.crestFactor,
    required this.rms,
    required this.rhythmScore,
  });

  @override
  String toString() =>
      'AudioQualityResult(valid: $isValidHeartSound, reason: $reason, lowRatio: ${lowFreqEnergyRatio.toStringAsFixed(2)}, crest: ${crestFactor.toStringAsFixed(1)}, rhythm: ${rhythmScore.toStringAsFixed(2)})';
}

/// Pure Dart MFCC feature extractor — replicates the Python mfcc_api.py pipeline.
///
/// All parameters match training config exactly:
///   SR=1000, N_MFCC=40, N_MELS=40, N_FFT=512, WIN_LENGTH=256,
///   HOP_LENGTH=64, MAX_TIME_STEPS=32, SEGMENT_SEC=2.0, OVERLAP=0.5,
///   BANDPASS=[20,480]Hz order=4, THRESHOLD=0.58
class MfccExtractor {
  // ─── Config (MUST match training) ──────────────────────────────
  static const int sr = 1000;
  static const double segmentSec = 2.0;
  static const double segmentOverlap = 0.5;
  static const int bandpassLow = 20;
  static const int bandpassHigh = 480;
  static const int bandpassOrder = 4;
  static const int nMfcc = 40;
  static const int nMels = 40;
  static const int nFft = 512;
  static const int winLength = 256;
  static const int hopLength = 64;
  static const int maxTimeSteps = 32;
  static const double optimalThreshold = 0.58;
  static const int maxDurationSec = 30;

  // ─── Quality Assessment Thresholds ─────────────────────────────
  static const double minRmsThreshold = 0.0015; // Minimum energy
  static const double minLowFreqEnergyRatio = 0.40; // >40% energy in 20-500Hz
  static const double maxHighFreqEnergyRatio = 0.45; // <45% energy in 1000-8000Hz
  static const double maxCrestFactor = 14.0; // Clapping/tapping has extreme crest factor
  static const double minRhythmScore = 0.08; // Peak autocorrelation in 40-180 BPM

  // ─── WAV reading ───────────────────────────────────────────────
  /// Reads a WAV file and returns (samples, sampleRate).
  static (Float64List, int) readWav(String path) {
    final file = File(path);
    final bytes = file.readAsBytesSync();
    final data = ByteData.sublistView(Uint8List.fromList(bytes));

    // Parse RIFF header
    int offset = 0;

    // Skip to 'fmt ' chunk
    offset = 12; // Skip RIFF header (12 bytes)
    int fileSampleRate = 44100;
    int numChannels = 1;
    int bitsPerSample = 16;
    int dataOffset = 0;
    int dataSize = 0;

    while (offset < data.lengthInBytes - 8) {
      final chunkId = String.fromCharCodes([
        data.getUint8(offset),
        data.getUint8(offset + 1),
        data.getUint8(offset + 2),
        data.getUint8(offset + 3),
      ]);
      final chunkSize = data.getUint32(offset + 4, Endian.little);

      if (chunkId == 'fmt ') {
        numChannels = data.getUint16(offset + 10, Endian.little);
        fileSampleRate = data.getUint32(offset + 12, Endian.little);
        bitsPerSample = data.getUint16(offset + 22, Endian.little);
      } else if (chunkId == 'data') {
        dataOffset = offset + 8;
        dataSize = chunkSize;
        break;
      }
      offset += 8 + chunkSize;
      if (chunkSize % 2 != 0) offset++; // Padding byte
    }

    if (dataOffset == 0) {
      throw Exception('No data chunk found in WAV file');
    }

    // Read PCM samples
    final bytesPerSample = bitsPerSample ~/ 8;
    final totalSamples = dataSize ~/ (bytesPerSample * numChannels);
    final samples = Float64List(totalSamples * numChannels);

    for (int i = 0; i < totalSamples * numChannels; i++) {
      final pos = dataOffset + i * bytesPerSample;
      if (pos + bytesPerSample > data.lengthInBytes) break;
      if (bitsPerSample == 16) {
        samples[i] = data.getInt16(pos, Endian.little) / 32768.0;
      } else if (bitsPerSample == 24) {
        int val = data.getUint8(pos) |
            (data.getUint8(pos + 1) << 8) |
            (data.getInt8(pos + 2) << 16);
        samples[i] = val / 8388608.0;
      } else if (bitsPerSample == 32) {
        samples[i] = data.getInt32(pos, Endian.little) / 2147483648.0;
      }
    }

    // Convert to mono
    Float64List mono;
    if (numChannels > 1) {
      mono = Float64List(totalSamples);
      for (int i = 0; i < totalSamples; i++) {
        double sum = 0;
        for (int ch = 0; ch < numChannels; ch++) {
          sum += samples[i * numChannels + ch];
        }
        mono[i] = sum / numChannels;
      }
    } else {
      mono = Float64List.fromList(samples.sublist(0, totalSamples));
    }

    return (mono, fileSampleRate);
  }

  // ─── Signal preprocessing ─────────────────────────────────────
  static Float64List removeDcOffset(Float64List signal) {
    double mean = 0;
    for (final s in signal) mean += s;
    mean /= signal.length;
    final result = Float64List(signal.length);
    for (int i = 0; i < signal.length; i++) {
      result[i] = signal[i] - mean;
    }
    return result;
  }

  static Float64List resample(Float64List signal, int origSr, int targetSr) {
    if (origSr == targetSr) return signal;
    final ratio = targetSr / origSr;
    final newLen = (signal.length * ratio).round();
    final result = Float64List(newLen);
    for (int i = 0; i < newLen; i++) {
      final srcIdx = i / ratio;
      final idx0 = srcIdx.floor();
      final idx1 = min(idx0 + 1, signal.length - 1);
      final frac = srcIdx - idx0;
      result[i] = signal[idx0] * (1 - frac) + signal[idx1] * frac;
    }
    return result;
  }

  static Float64List normalizeAmplitude(Float64List signal, {double eps = 1e-8}) {
    double maxAbs = 0;
    for (final s in signal) {
      if (s.abs() > maxAbs) maxAbs = s.abs();
    }
    if (maxAbs < eps) return signal;
    final result = Float64List(signal.length);
    for (int i = 0; i < signal.length; i++) {
      result[i] = signal[i] / maxAbs;
    }
    return result;
  }

  // ─── Butterworth bandpass filter ──────────────────────────────
  /// Compute Butterworth bandpass filter coefficients and apply filtfilt.
  static Float64List butterworthBandpass(Float64List signal,
      {double low = 20, double high = 480, int fs = 1000, int order = 4}) {
    final nyq = 0.5 * fs;
    final lowN = low / nyq; // 0.04
    final highN = min(high / nyq, 0.999); // 0.96

    // Pre-warp
    final warpedLow = 2.0 * tan(pi * lowN / 2);
    final warpedHigh = 2.0 * tan(pi * highN / 2);

    // Butterworth lowpass prototype poles
    final protoPoles = <_Complex>[];
    for (int k = 0; k < order; k++) {
      final theta = pi * (2 * k + order + 1) / (2 * order);
      protoPoles.add(_Complex(cos(theta), sin(theta)));
    }

    // Lowpass to bandpass transform
    final bw = warpedHigh - warpedLow;
    final w0Sq = warpedLow * warpedHigh;

    final bpPoles = <_Complex>[];
    for (final p in protoPoles) {
      final alpha = p * _Complex(bw / 2, 0);
      final discriminant = alpha * alpha - _Complex(w0Sq, 0);
      final sqrtDisc = discriminant.sqrt();
      bpPoles.add(alpha + sqrtDisc);
      bpPoles.add(alpha - sqrtDisc);
    }

    // Bandpass zeros: all at s=0
    final bpZeros = <_Complex>[];
    for (int i = 0; i < order; i++) {
      bpZeros.add(_Complex.zero);
    }

    // Bilinear transform (using 2/T = 2 for normalized frequency)
    final digitalPoles = <_Complex>[];
    for (final p in bpPoles) {
      digitalPoles.add(
        (_Complex.one + p * _Complex(0.5, 0)) /
            (_Complex.one - p * _Complex(0.5, 0)),
      );
    }

    final digitalZeros = <_Complex>[];
    for (final z in bpZeros) {
      digitalZeros.add(
        (_Complex.one + z * _Complex(0.5, 0)) /
            (_Complex.one - z * _Complex(0.5, 0)),
      );
    }
    // Extra zeros at z=-1 for each "zero at infinity"
    for (int i = 0; i < order; i++) {
      digitalZeros.add(_Complex(-1, 0));
    }

    // Convert poles/zeros to polynomial coefficients
    final a = _polyFromRoots(digitalPoles);
    final bCoeff = _polyFromRoots(digitalZeros);

    // Compute gain at center frequency
    final wCenter = sqrt(pi * lowN * pi * highN);
    final ejw = _Complex(cos(wCenter), sin(wCenter));

    var numAtCenter = _Complex.one;
    for (final z in digitalZeros) {
      numAtCenter = numAtCenter * (ejw - z);
    }
    var denAtCenter = _Complex.one;
    for (final p in digitalPoles) {
      denAtCenter = denAtCenter * (ejw - p);
    }
    final gainComplex = denAtCenter / numAtCenter;
    final gain = gainComplex.magnitude;

    // Scale b coefficients
    final b = List<double>.generate(bCoeff.length, (i) => bCoeff[i] * gain);

    // Apply filtfilt
    return _filtfilt(b, a, signal);
  }

  /// Convert roots to polynomial coefficients (real parts only).
  static List<double> _polyFromRoots(List<_Complex> roots) {
    var poly = [_Complex.one];
    for (final root in roots) {
      final newPoly = List.filled(poly.length + 1, _Complex.zero);
      for (int i = 0; i < poly.length; i++) {
        newPoly[i] = newPoly[i] + poly[i];
        newPoly[i + 1] = newPoly[i + 1] - poly[i] * root;
      }
      poly = newPoly;
    }
    return poly.map((c) => c.real).toList();
  }

  /// Zero-phase forward-backward IIR filtering.
  static Float64List _filtfilt(List<double> b, List<double> a, Float64List x) {
    final n = x.length;
    final int padLen = (3 * max(b.length, a.length)).toInt();

    // Edge padding (reflect)
    final padded = Float64List(n + 2 * padLen);
    for (int i = 0; i < padLen; i++) {
      padded[i] = 2 * x[0] - x[min(padLen - i, n - 1).toInt()];
    }
    for (int i = 0; i < n; i++) {
      padded[padLen + i] = x[i];
    }
    for (int i = 0; i < padLen; i++) {
      padded[padLen + n + i] = 2 * x[n - 1] - x[max(n - 2 - i, 0).toInt()];
    }

    // Forward filter
    var forward = _filter(b, a, padded);
    // Reverse
    final reversed = Float64List(forward.length);
    for (int i = 0; i < forward.length; i++) {
      reversed[i] = forward[forward.length - 1 - i];
    }
    // Backward filter
    var backward = _filter(b, a, reversed);
    // Reverse again
    final result = Float64List(n);
    for (int i = 0; i < n; i++) {
      result[i] = backward[backward.length - 1 - padLen - i];
    }
    return result;
  }

  /// Direct-form II IIR filter.
  static Float64List _filter(List<double> b, List<double> a, Float64List x) {
    final n = x.length;
    final nb = b.length;
    final na = a.length;
    final y = Float64List(n);
    final a0 = a[0];

    for (int i = 0; i < n; i++) {
      double sum = 0;
      for (int j = 0; j < nb; j++) {
        if (i - j >= 0) sum += b[j] * x[i - j];
      }
      for (int j = 1; j < na; j++) {
        if (i - j >= 0) sum -= a[j] * y[i - j];
      }
      y[i] = sum / a0;
    }
    return y;
  }

  // ─── Median filter ────────────────────────────────────────────
  static Float64List medianFilter(Float64List signal, {int kernelSize = 5}) {
    final result = Float64List(signal.length);
    final half = kernelSize ~/ 2;
    final window = List<double>.filled(kernelSize, 0);

    for (int i = 0; i < signal.length; i++) {
      int count = 0;
      for (int j = -half; j <= half; j++) {
        final idx = i + j;
        if (idx >= 0 && idx < signal.length) {
          window[count++] = signal[idx];
        }
      }
      final slice = window.sublist(0, count)..sort();
      result[i] = slice[count ~/ 2];
    }
    return result;
  }

  // ─── Segmentation ─────────────────────────────────────────────
  static List<Float64List> segment(Float64List signal,
      {int sampleRate = sr,
      double segSec = segmentSec,
      double overlap = segmentOverlap}) {
    final segLen = (segSec * sampleRate).round();
    final step = (segLen * (1 - overlap)).round();

    if (signal.length < segLen) {
      // Pad short signals
      final padded = Float64List(segLen);
      final padLeft = (segLen - signal.length) ~/ 2;
      for (int i = 0; i < signal.length; i++) {
        padded[padLeft + i] = signal[i];
      }
      return [padded];
    }

    final segments = <Float64List>[];
    for (int start = 0; start <= signal.length - segLen; start += step) {
      segments.add(Float64List.fromList(
          signal.sublist(start, start + segLen)));
    }
    return segments;
  }

  // ─── FFT (Cooley-Tukey radix-2) ───────────────────────────────
  static List<_Complex> _fft(List<_Complex> x) {
    final n = x.length;
    if (n <= 1) return x;

    // Bit-reversal permutation
    final result = List<_Complex>.from(x);
    int j = 0;
    for (int i = 0; i < n; i++) {
      if (i < j) {
        final tmp = result[i];
        result[i] = result[j];
        result[j] = tmp;
      }
      int m = n >> 1;
      while (m >= 1 && j >= m) {
        j -= m;
        m >>= 1;
      }
      j += m;
    }

    // Butterfly operations
    for (int len = 2; len <= n; len <<= 1) {
      final halfLen = len >> 1;
      final angle = -2 * pi / len;
      final wBase = _Complex(cos(angle), sin(angle));
      for (int i = 0; i < n; i += len) {
        var w = _Complex.one;
        for (int k = 0; k < halfLen; k++) {
          final u = result[i + k];
          final t = w * result[i + k + halfLen];
          result[i + k] = u + t;
          result[i + k + halfLen] = u - t;
          w = w * wBase;
        }
      }
    }
    return result;
  }

  // ─── STFT ─────────────────────────────────────────────────────
  static List<Float64List> _stft(Float64List signal) {
    // Hann window
    final window = Float64List(winLength);
    for (int i = 0; i < winLength; i++) {
      window[i] = 0.5 * (1 - cos(2 * pi * i / (winLength - 1)));
    }

    final frames = <Float64List>[];
    for (int start = 0; start + winLength <= signal.length; start += hopLength) {
      // Apply window and zero-pad to nFft
      final frame = List<_Complex>.filled(nFft, _Complex.zero);
      for (int i = 0; i < winLength; i++) {
        frame[i] = _Complex(signal[start + i] * window[i], 0);
      }
      // FFT
      final spectrum = _fft(frame);
      // Power spectrum (only first nFft/2 + 1 bins)
      final power = Float64List(nFft ~/ 2 + 1);
      for (int i = 0; i <= nFft ~/ 2; i++) {
        power[i] = spectrum[i].real * spectrum[i].real +
            spectrum[i].imag * spectrum[i].imag;
      }
      frames.add(power);
    }
    return frames;
  }

  // ─── Mel filterbank ───────────────────────────────────────────
  static double _hzToMel(double hz) => 2595.0 * log(1 + hz / 700) / ln10;
  static double _melToHz(double mel) => 700.0 * (pow(10, mel / 2595.0) - 1);

  static List<Float64List> _melFilterbank() {
    final fMin = 0.0;
    final fMax = sr / 2.0;
    final melMin = _hzToMel(fMin);
    final melMax = _hzToMel(fMax);

    // nMels + 2 points evenly spaced in mel scale
    final melPoints = Float64List(nMels + 2);
    for (int i = 0; i < nMels + 2; i++) {
      melPoints[i] = melMin + i * (melMax - melMin) / (nMels + 1);
    }

    // Convert to Hz and then to FFT bin indices
    final binFreqs = Float64List(nMels + 2);
    for (int i = 0; i < nMels + 2; i++) {
      final hz = _melToHz(melPoints[i]);
      binFreqs[i] = (hz * (nFft + 1) / sr);
    }

    final fftBins = nFft ~/ 2 + 1;
    final filters = <Float64List>[];
    for (int m = 0; m < nMels; m++) {
      final filter = Float64List(fftBins);
      final fLow = binFreqs[m];
      final fCenter = binFreqs[m + 1];
      final fHigh = binFreqs[m + 2];

      for (int k = 0; k < fftBins; k++) {
        final freq = k.toDouble();
        if (freq >= fLow && freq <= fCenter && fCenter > fLow) {
          filter[k] = (freq - fLow) / (fCenter - fLow);
        } else if (freq > fCenter && freq <= fHigh && fHigh > fCenter) {
          filter[k] = (fHigh - freq) / (fHigh - fCenter);
        }
      }
      filters.add(filter);
    }
    return filters;
  }

  // ─── DCT-II ───────────────────────────────────────────────────
  static Float64List _dctII(Float64List x, int nCoeffs) {
    final n = x.length;
    final result = Float64List(nCoeffs);
    for (int k = 0; k < nCoeffs; k++) {
      double sum = 0;
      for (int i = 0; i < n; i++) {
        sum += x[i] * cos(pi * k * (2 * i + 1) / (2 * n));
      }
      // Orthogonal normalization
      if (k == 0) {
        sum *= sqrt(1.0 / n);
      } else {
        sum *= sqrt(2.0 / n);
      }
      result[k] = sum;
    }
    return result;
  }

  // ─── MFCC extraction ──────────────────────────────────────────
  /// Extract MFCC features from a single segment.
  /// Returns a (timeSteps x nMfcc) matrix.
  static List<Float64List>? extractMfcc(Float64List segmentData) {
    try {
      // STFT → power spectrum frames
      final powerFrames = _stft(segmentData);
      if (powerFrames.isEmpty) return null;

      // Mel filterbank
      final melFilters = _melFilterbank();

      // Apply mel filters and compute log mel spectrogram
      final logMelFrames = <Float64List>[];
      for (final power in powerFrames) {
        final melEnergies = Float64List(nMels);
        for (int m = 0; m < nMels; m++) {
          double energy = 0;
          for (int k = 0; k < min(power.length, melFilters[m].length); k++) {
            energy += power[k] * melFilters[m][k];
          }
          melEnergies[m] = 10.0 * log(max(energy, 1e-10)) / ln10;
        }
        // DCT to get MFCCs
        final mfcc = _dctII(melEnergies, nMfcc);
        logMelFrames.add(mfcc);
      }

      return logMelFrames; // (time, nMfcc)
    } catch (e) {
      print('MFCC extraction error: $e');
      return null;
    }
  }

  // ─── Full preprocessing pipeline ─────────────────────────────
  /// Process a WAV file and return MFCC features for each segment.
  /// Each segment's MFCC is padded/truncated to (maxTimeSteps, nMfcc).
  static List<List<Float64List>> processAudioFile(String wavPath) {
    // 1. Read WAV
    final (rawSignal, origSr) = readWav(wavPath);

    // 2. Validate & trim duration
    final duration = rawSignal.length / origSr;
    if (duration < 0.05) {
      throw Exception('Audio too short');
    }

    // If voice is more than 30 seconds, cut to the first 30 seconds
    var processedRawSignal = rawSignal;
    if (duration > maxDurationSec) {
      final maxSamples = (maxDurationSec * origSr).toInt();
      processedRawSignal = Float64List.sublistView(
        rawSignal,
        0,
        min(maxSamples, rawSignal.length),
      );
    }

    // 3. Preprocess (exact same pipeline as training)
    var signal = removeDcOffset(processedRawSignal);
    signal = resample(signal, origSr, sr);
    signal = normalizeAmplitude(signal);
    signal = butterworthBandpass(signal);
    signal = medianFilter(signal);

    // 4. Segment
    final segments = segment(signal);
    if (segments.isEmpty) {
      throw Exception('No segments extracted');
    }

    // 5. Extract MFCC per segment
    final allMfcc = <List<Float64List>>[];
    for (final seg in segments) {
      final mfcc = extractMfcc(seg);
      if (mfcc == null) continue;

      // Pad/truncate to maxTimeSteps
      List<Float64List> padded;
      if (mfcc.length < maxTimeSteps) {
        padded = List.generate(maxTimeSteps, (i) {
          if (i < mfcc.length) return mfcc[i];
          return Float64List(nMfcc); // Zero padding
        });
      } else {
        padded = mfcc.sublist(0, maxTimeSteps);
      }

      allMfcc.add(padded);
    }

    return allMfcc;
  }

  // ─── Signal Quality Assessment (SQA) ───────────────────────────
  /// Evaluates whether the audio is a valid heart sound (PCG) or random noise/clapping.
  static AudioQualityResult evaluateAudioQuality(String wavPath) {
    final (rawSignal, origSr) = readWav(wavPath);
    return evaluateSignalQuality(rawSignal, origSr);
  }

  /// Analyzes raw audio signal and returns detailed quality metrics.
  static AudioQualityResult evaluateSignalQuality(
      Float64List rawSignal, int origSr) {
    if (rawSignal.isEmpty) {
      return const AudioQualityResult(
        isValidHeartSound: false,
        reason: 'silence',
        lowFreqEnergyRatio: 0.0,
        crestFactor: 0.0,
        rms: 0.0,
        rhythmScore: 0.0,
      );
    }

    // If audio is more than 30 seconds, evaluate the first 30 seconds
    var signalToCheck = rawSignal;
    if (rawSignal.length / origSr > maxDurationSec) {
      final maxSamples = (maxDurationSec * origSr).toInt();
      signalToCheck = Float64List.sublistView(
        rawSignal,
        0,
        min(maxSamples, rawSignal.length),
      );
    }

    // 1. RMS and Crest Factor (Impulsiveness / Clapping Check)
    double sumSq = 0;
    double maxAbs = 0;
    for (final s in signalToCheck) {
      final absVal = s.abs();
      if (absVal > maxAbs) maxAbs = absVal;
      sumSq += s * s;
    }
    final rms = sqrt(sumSq / signalToCheck.length);
    final crestFactor = rms > 1e-8 ? (maxAbs / rms) : 0.0;

    // Check for silence / muted mic
    if (rms < minRmsThreshold || maxAbs < 0.005) {
      return AudioQualityResult(
        isValidHeartSound: false,
        reason: 'silence',
        lowFreqEnergyRatio: 0.0,
        crestFactor: crestFactor,
        rms: rms,
        rhythmScore: 0.0,
      );
    }

    // 2. Frequency Band Energy Ratio (High vs Low Frequency)
    double lowFreqRatio = 1.0;
    double highFreqRatio = 0.0;

    if (origSr >= 2000 && signalToCheck.length >= 1024) {
      const fftSize = 1024;
      final step = max(fftSize, (signalToCheck.length - fftSize) ~/ 6);
      double totalLowEnergy = 0;
      double totalHighEnergy = 0;
      double totalOverallEnergy = 0;
      int windowCount = 0;

      // Hann window for quality check
      final win = Float64List(fftSize);
      for (int i = 0; i < fftSize; i++) {
        win[i] = 0.5 * (1 - cos(2 * pi * i / (fftSize - 1)));
      }

      for (int start = 0;
          start + fftSize <= signalToCheck.length;
          start += step) {
        final frame = List<_Complex>.filled(fftSize, _Complex.zero);
        for (int i = 0; i < fftSize; i++) {
          frame[i] = _Complex(signalToCheck[start + i] * win[i], 0);
        }

        final spectrum = _fft(frame);
        for (int k = 0; k <= fftSize ~/ 2; k++) {
          final freq = k * origSr / fftSize;
          final power = spectrum[k].real * spectrum[k].real +
              spectrum[k].imag * spectrum[k].imag;

          totalOverallEnergy += power;
          if (freq >= 20 && freq <= 500) {
            totalLowEnergy += power;
          } else if (freq >= 1000 && freq <= min(8000, origSr / 2.0)) {
            totalHighEnergy += power;
          }
        }
        windowCount++;
      }

      if (totalOverallEnergy > 1e-12 && windowCount > 0) {
        lowFreqRatio = totalLowEnergy / totalOverallEnergy;
        highFreqRatio = totalHighEnergy / totalOverallEnergy;
      }
    }

    // 3. Rhythm / Periodicity Autocorrelation Check
    // Downsample and bandpass filter to 20-480 Hz
    var filtered = removeDcOffset(signalToCheck);
    filtered = resample(filtered, origSr, sr);
    filtered = normalizeAmplitude(filtered);
    filtered = butterworthBandpass(filtered);

    // Compute smoothed envelope (50ms moving average at 1000Hz)
    const envWin = 50;
    final env = Float64List(filtered.length);
    double winSum = 0;
    for (int i = 0; i < filtered.length; i++) {
      winSum += filtered[i].abs();
      if (i >= envWin) {
        winSum -= filtered[i - envWin].abs();
      }
      env[i] = winSum / min(i + 1, envWin);
    }

    // Envelope Autocorrelation for 40-180 BPM (lags 333 to 1500 samples)
    double rhythmScore = 0.0;
    if (env.length > 2000) {
      double meanEnv = 0;
      for (final v in env) meanEnv += v;
      meanEnv /= env.length;

      double varEnv = 0;
      for (final v in env) {
        final diff = v - meanEnv;
        varEnv += diff * diff;
      }

      if (varEnv > 1e-10) {
        final minLag = 333; // ~180 BPM at 1000Hz
        final maxLag = min(1500, env.length ~/ 2); // ~40 BPM

        double maxCorr = -1.0;
        for (int lag = minLag; lag <= maxLag; lag += 10) {
          double sumProd = 0;
          final n = env.length - lag;
          for (int t = 0; t < n; t += 2) {
            sumProd += (env[t] - meanEnv) * (env[t + lag] - meanEnv);
          }
          final corr = (sumProd * 2) / varEnv;
          if (corr > maxCorr) maxCorr = corr;
        }
        rhythmScore = max(0.0, maxCorr);
      }
    } else {
      // For short audio, use a moderate default rhythm score
      rhythmScore = 0.25;
    }

    // 4. Decision Rule
    String reason = 'valid';
    bool isValid = true;

    if (crestFactor > maxCrestFactor) {
      reason = 'clapping_or_tapping';
      isValid = false;
    } else if (lowFreqRatio < minLowFreqEnergyRatio &&
        highFreqRatio > maxHighFreqEnergyRatio) {
      reason = 'high_frequency_noise';
      isValid = false;
    } else if (lowFreqRatio < 0.25) {
      reason = 'high_frequency_noise';
      isValid = false;
    }

    return AudioQualityResult(
      isValidHeartSound: isValid,
      reason: reason,
      lowFreqEnergyRatio: lowFreqRatio,
      crestFactor: crestFactor,
      rms: rms,
      rhythmScore: rhythmScore,
    );
  }
}

// ─── Complex number helper ──────────────────────────────────────
class _Complex {
  final double real;
  final double imag;

  const _Complex(this.real, this.imag);

  static const zero = _Complex(0, 0);
  static const one = _Complex(1, 0);

  double get magnitude => math_sqrt(real * real + imag * imag);

  _Complex operator +(_Complex other) =>
      _Complex(real + other.real, imag + other.imag);

  _Complex operator -(_Complex other) =>
      _Complex(real - other.real, imag - other.imag);

  _Complex operator *(_Complex other) => _Complex(
        real * other.real - imag * other.imag,
        real * other.imag + imag * other.real,
      );

  _Complex operator /(_Complex other) {
    final denom = other.real * other.real + other.imag * other.imag;
    return _Complex(
      (real * other.real + imag * other.imag) / denom,
      (imag * other.real - real * other.imag) / denom,
    );
  }

  _Complex sqrt() {
    final r = magnitude;
    final angle = atan2(imag, real);
    return _Complex(
      _sqrt(r) * cos(angle / 2),
      _sqrt(r) * sin(angle / 2),
    );
  }

  static double _sqrt(double x) => x >= 0 ? math_sqrt(x) : 0;

  @override
  String toString() => '($real + ${imag}i)';
}

double math_sqrt(double x) => sqrt(x);
