import unittest
import io
import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Add Services to path
sys.path.append(str(Path(__file__).resolve().parent.parent / "Services"))

from mfcc_api import (
    app,
    convert_to_mono_if_needed,
    remove_dc_offset,
    normalize_amplitude,
    segment_signal,
    SR
)

client = TestClient(app)

class TestAIService(unittest.TestCase):
    def test_convert_to_mono(self):
        # 1D signal remains 1D
        mono_signal = np.array([0.1, 0.2, 0.3])
        self.assertEqual(convert_to_mono_if_needed(mono_signal).shape, (3,))

        # 2D stereo signal (2, 100) converted to 1D (100,)
        stereo_signal = np.zeros((2, 100))
        converted = convert_to_mono_if_needed(stereo_signal)
        self.assertEqual(converted.shape, (100,))

    def test_dc_offset_and_normalize(self):
        signal = np.array([1.0, 3.0, 5.0])
        no_dc = remove_dc_offset(signal)
        self.assertAlmostEqual(np.mean(no_dc), 0.0)

        norm = normalize_amplitude(no_dc)
        self.assertLessEqual(np.max(np.abs(norm)), 1.0)

    def test_segment_signal(self):
        # 30-second signal at SR=1000 Hz => 30,000 samples
        sig_30s = np.random.uniform(-0.1, 0.1, 30000)
        segments, starts = segment_signal(sig_30s)
        self.assertGreater(len(segments), 0)
        self.assertEqual(len(segments[0]), 2000) # 2 sec segments

    def test_health_endpoint(self):
        response = client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "service": "ai-service"})

    def test_predict_endpoint_valid_audio(self):
        # Create 5-second stereo WAV file
        data = np.random.uniform(-0.1, 0.1, (5000, 2))
        buf = io.BytesIO()
        sf.write(buf, data, SR, format='WAV')
        buf.seek(0)

        response = client.post(
            "/predict",
            files={"file": ("test_heart_sound.wav", buf, "audio/wav")}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("predictionResult", data)
        self.assertIn("predictionScore", data)
        self.assertIn(data["predictionResult"], ["Normal", "Abnormal"])

    def test_predict_invalid_format(self):
        buf = io.BytesIO(b"not an audio file")
        response = client.post(
            "/predict",
            files={"file": ("test.txt", buf, "text/plain")}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Invalid file format", response.json()["detail"])

if __name__ == "__main__":
    unittest.main()
