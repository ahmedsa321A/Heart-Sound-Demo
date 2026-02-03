
import os
import argparse
import numpy as np
import pickle
import librosa
import scipy.signal as signal
import torch
import warnings
from ts2vec import TS2Vec
from xgboost import XGBClassifier

warnings.filterwarnings('ignore')

# -----------------------------------------------------------------------------
# CONFIGURATION
# -----------------------------------------------------------------------------
# You can customize these paths or pass them as arguments
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
TS2VEC_MODEL_PATH = os.path.join(MODEL_DIR, 'ts2vec_pcg_model')
XGB_MODEL_PATH = os.path.join(MODEL_DIR, 'final_xgboost.pkl')
SCALER_PATH = os.path.join(MODEL_DIR, 'final_scaler.pkl')

TARGET_SR = 1000
WIN_SIZE_SECONDS = 2
WIN_SIZE = WIN_SIZE_SECONDS * TARGET_SR
HOP_SIZE = WIN_SIZE // 2
LOWCUT = 25
HIGHCUT = 400

# -----------------------------------------------------------------------------
# 1. PREPROCESSING (Reused from training pipeline)
# -----------------------------------------------------------------------------
def bandpass_filter(x, sr=TARGET_SR):
    nyquist = sr / 2
    low = LOWCUT / nyquist
    high = HIGHCUT / nyquist
    b, a = signal.butter(3, [low, high], btype='band')
    return signal.filtfilt(b, a, x)

def normalize_robust(x):
    median = np.median(x)
    mad = np.median(np.abs(x - median))
    if mad < 1e-8:
        return x - median
    return (x - median) / (mad + 1e-8)

def process_audio(filepath):
    """Load, resample, filter, and window audio."""
    try:
        x, sr = librosa.load(filepath, sr=None, mono=True)
    except Exception as e:
        raise ValueError(f"Could not load audio file: {e}")

    # Resample
    if sr != TARGET_SR:
        x = librosa.resample(x, orig_sr=sr, target_sr=TARGET_SR)
    
    # Filter
    x = bandpass_filter(x)
    
    # Windowing
    windows = []
    if len(x) < WIN_SIZE:
        # Pad short files
        x_padded = np.pad(x, (0, max(0, WIN_SIZE - len(x))), mode='constant')
        windows.append(x_padded)
    else:
        for start in range(0, len(x) - WIN_SIZE + 1, HOP_SIZE):
            w = x[start:start + WIN_SIZE]
            windows.append(w)
            
    # Normalize each window
    windows = np.array([normalize_robust(w) for w in windows])
    
    return windows

# -----------------------------------------------------------------------------
# 2. INFERENCE CLASS
# -----------------------------------------------------------------------------
class HeartSoundClassifier:
    def __init__(self, model_dir=MODEL_DIR):
        print(f"Loading models from {model_dir}...")
        
        # Load TS2Vec
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.encoder = TS2Vec(input_dims=1, output_dims=128, device=device)
        self.encoder.load(os.path.join(model_dir, 'ts2vec_pcg_model'))
        
        # Load XGBoost
        with open(os.path.join(model_dir, 'final_xgboost.pkl'), 'rb') as f:
            self.clf = pickle.load(f)
            
        # Load Scaler
        with open(os.path.join(model_dir, 'final_scaler.pkl'), 'rb') as f:
            self.scaler = pickle.load(f)
            
        self.classes = {0: "Unknown", 1: "Normal", 2: "Abnormal"}
        print(" Models loaded successfully.")

    def predict(self, filepath):
        # 1. Preprocess
        windows = process_audio(filepath)
        if len(windows) == 0:
            return {"error": "Audio too short or empty"}
        
        # 2. Encode (TS2Vec)
        # Reshape for encoder: (samples, time, channels)
        windows_in = windows.reshape(len(windows), -1, 1)
        
        # Get embeddings
        timestamp_emb = self.encoder.encode(windows_in, batch_size=64)
        
        # Pool (Mean only)
        # Note: Training data has 128-d, implying only one pooling was used.
        # We use Mean pooling as a robust default.
        embeddings = timestamp_emb.mean(axis=1)
        
        # 3. Classify
        # Scale
        X_scaled = self.scaler.transform(embeddings)
        
        # Predict Probabilities
        probs = self.clf.predict_proba(X_scaled)
        
        # Aggregate logic: Average probability across all windows
        avg_probs = np.mean(probs, axis=0)
        
        # Get final class
        pred_idx = np.argmax(avg_probs)
        pred_label = self.classes.get(pred_idx, "Unknown")
        confidence = avg_probs[pred_idx]
        
        return {
            "filename": os.path.basename(filepath),
            "prediction": pred_label,
            "confidence": float(confidence),
            "details": {
                "prob_normal": float(avg_probs[1]) if len(avg_probs) > 1 else 0,
                "prob_abnormal": float(avg_probs[2]) if len(avg_probs) > 2 else 0,
                "windows_processed": len(windows)
            }
        }

# -----------------------------------------------------------------------------
# 3. CLI ENTRY POINT
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Heart Sound Classifier Inference")
    parser.add_argument("audio_path", help="Path to the .wav file")
    args = parser.parse_args()
    
    if not os.path.exists(args.audio_path):
        print(f"Error: File not found {args.audio_path}")
        exit(1)
        
    classifier = HeartSoundClassifier()
    result = classifier.predict(args.audio_path)
    
    print("\n" + "="*40)
    print("RESULT")
    print("="*40)
    print(f"File:       {result['filename']}")
    print(f"Prediction: {result['prediction']}")
    print(f"Confidence: {result['confidence']:.2%}")
    print("-" * 20)
    print(f"Normal Prob:   {result['details']['prob_normal']:.2%}")
    print(f"Abnormal Prob: {result['details']['prob_abnormal']:.2%}")
    print("="*40)
