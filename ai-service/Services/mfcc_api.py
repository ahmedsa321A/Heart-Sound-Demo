import io
import numpy as np
import librosa
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import load_model
from scipy.signal import butter, filtfilt, medfilt
import tensorflow.keras.backend as K
from pathlib import Path


app = FastAPI()




def focal_loss(gamma=2.0, alpha=0.5):
    def loss(y_true, y_pred):
        y_pred = K.clip(y_pred, 1e-7, 1 - 1e-7)
        pt = y_true * y_pred + (1 - y_true) * (1 - y_pred)
        return -K.mean(alpha * K.pow(1 - pt, gamma) * K.log(pt))
    return loss

# Load model with custom loss
print("Loading model...")
BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "Models" / "Mfcc" / "loss_focal_loss_model.h5"

MODEL = load_model(
        str(MODEL_PATH),
    custom_objects={'loss': focal_loss(gamma=2.0, alpha=0.5)}
)
print("✓ Model loaded successfully!")

###########################################################
# CONFIG (MUST MATCH TRAINING!)
###########################################################
SR = 1000
SEGMENT_SEC = 2.0
SEGMENT_OVERLAP = 0.5
BANDPASS_LOW = 20
BANDPASS_HIGH = 480
BANDPASS_ORDER = 4

N_MFCC = 40
N_MELS = 40
N_FFT = 512
WIN_LENGTH = 256
HOP_LENGTH = 64

# Based on 2-second segments at 1000 Hz with HOP_LENGTH=64
# Typical MFCC time steps: ~32 frames
MAX_TIME_STEPS = 32

# Optimal threshold from validation (you provided this!)
OPTIMAL_THRESHOLD = 0.58

# Max recording duration (30 seconds)
MAX_DURATION_SEC = 30
MAX_AUDIO_LENGTH = MAX_DURATION_SEC * SR  # 30,000 samples

###########################################################
# PREPROCESSING FUNCTIONS
###########################################################
def convert_to_mono_if_needed(signal):
    """Convert stereo to mono if needed"""
    if signal.ndim == 1:
        return signal
    return np.mean(signal, axis=0)

def remove_dc_offset(signal):
    """Remove DC component"""
    return signal - np.mean(signal)

def resample_signal(signal, orig_sr, target_sr=SR):
    """Resample to target sample rate"""
    if orig_sr == target_sr:
        return signal
    return librosa.resample(signal, orig_sr=orig_sr, target_sr=target_sr)

def normalize_amplitude(signal, eps=1e-8):
    """Normalize to [-1, 1] range"""
    m = np.max(np.abs(signal))
    if m < eps:
        return signal
    return signal / m

def butter_bandpass_filter(x, low=BANDPASS_LOW, high=BANDPASS_HIGH, fs=SR, order=BANDPASS_ORDER):
    """Apply bandpass filter (20-480 Hz for heart sounds)"""
    nyq = 0.5 * fs
    lown = low / nyq
    highn = min(high / nyq, 0.999)
    b, a = butter(order, [lown, highn], btype='band')
    return filtfilt(b, a, x)

def median_denoise(x, kernel=5):
    """Remove impulse noise"""
    return medfilt(x, kernel_size=kernel)

def segment_signal(signal, sr=SR, seg_sec=SEGMENT_SEC, overlap=SEGMENT_OVERLAP):
    """
    Segment signal into overlapping windows
    For 30-sec audio: ~29 segments (2s windows, 50% overlap)
    """
    seg_len = int(seg_sec * sr)
    step = int(seg_len * (1 - overlap))

    # Handle short signals (pad to segment length)
    if len(signal) < seg_len:
        pad_left = (seg_len - len(signal)) // 2
        pad_right = seg_len - len(signal) - pad_left
        seg = np.pad(signal, (pad_left, pad_right), mode='constant')
        return [seg], [0]

    # Sliding window segmentation
    segments, starts = [], []
    for start in range(0, len(signal) - seg_len + 1, step):
        segments.append(signal[start:start+seg_len])
        starts.append(start)
    
    return segments, starts

def extract_mfcc_segment(segment, sr=SR):
    """Extract MFCC features from segment"""
    try:
        mfcc = librosa.feature.mfcc(
            y=segment, 
            sr=sr,
            n_mfcc=N_MFCC,
            n_fft=N_FFT,
            win_length=WIN_LENGTH,
            hop_length=HOP_LENGTH,
            n_mels=N_MELS,
            htk=True  # CRITICAL: Must match training!
        )
        return mfcc.T  # Transpose to (time, n_mfcc)
    except Exception as e:
        print(f"MFCC extraction error: {e}")
        return None

###########################################################
# API ENDPOINTS
###########################################################
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Predict heart sound abnormality from audio file
    
    Expected input: WAV file (max 30 seconds)
    Returns: prediction result and confidence score
    """
    try:
        # Validate file type
        if not file.filename.lower().endswith(('.wav', '.mp3', '.flac', '.ogg')):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file format. Please upload WAV, MP3, FLAC, or OGG file."
            )
        
        # 1. Load audio
        audio_bytes = await file.read()
        signal, orig_sr = librosa.load(io.BytesIO(audio_bytes), sr=None, mono=False)
        
        # 2. Validate duration
        duration = len(signal) / orig_sr
        if duration > MAX_DURATION_SEC:
            raise HTTPException(
                status_code=400,
                detail=f"Audio too long ({duration:.1f}s). Maximum duration is {MAX_DURATION_SEC}s."
            )
        
        if duration < 0.5:
            raise HTTPException(
                status_code=400,
                detail="Audio too short. Minimum duration is 0.5 seconds."
            )
        
        # 3. Preprocess (EXACT same pipeline as training)
        signal = convert_to_mono_if_needed(signal)
        signal = remove_dc_offset(signal)
        signal = resample_signal(signal, orig_sr, SR)
        signal = normalize_amplitude(signal)
        signal = butter_bandpass_filter(signal)
        signal = median_denoise(signal)

        # 4. Segment into 2-second windows
        segments, _ = segment_signal(signal)
        
        if len(segments) == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to extract valid segments from audio."
            )
        
        # 5. Extract MFCC and predict per segment
        segment_probs = []
        for seg in segments:
            mfcc = extract_mfcc_segment(seg)
            if mfcc is None:
                continue
                
            if mfcc.shape[0] < MAX_TIME_STEPS:
                pad_width = MAX_TIME_STEPS - mfcc.shape[0]
                mfcc = np.pad(mfcc, ((0, pad_width), (0, 0)), mode="constant")
            else:
                mfcc = mfcc[:MAX_TIME_STEPS, :]
            
            # Verify shape
            assert mfcc.shape == (MAX_TIME_STEPS, N_MFCC), \
                f"MFCC shape mismatch: {mfcc.shape} vs expected ({MAX_TIME_STEPS}, {N_MFCC})"
            
            # Add batch and channel dimensions: (1, 32, 40, 1)
            input_data = mfcc[np.newaxis, ..., np.newaxis]
            
            # Predict (suppress TF output)
            prob = MODEL.predict(input_data, verbose=0).ravel()[0]
            segment_probs.append(float(prob))

        if len(segment_probs) == 0:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate predictions from segments."
            )

        # 6. Aggregate using top-3 mean (robust MIL aggregation)
        top_scores = sorted(segment_probs, reverse=True)
        top_k = min(3, len(top_scores))
        final_score = float(np.mean(top_scores[:top_k]))
        
        # 7. Apply optimal threshold (0.58 from validation)
        result = "Abnormal" if final_score >= OPTIMAL_THRESHOLD else "Normal"
        
        # Calculate confidence (distance from threshold)
        confidence = abs(final_score - OPTIMAL_THRESHOLD) / OPTIMAL_THRESHOLD
        confidence = min(confidence, 1.0)  # Cap at 100%

        return {
            "predictionResult": result,
            "predictionScore": round(final_score, 4)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )



if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*70)
    print("HEART SOUND CLASSIFICATION API")
    print("="*70)
    print(f"✓ Model loaded: loss_focal_loss_model.h5")
    print(f"✓ Optimal threshold: {OPTIMAL_THRESHOLD}")
    print(f"✓ Max recording duration: {MAX_DURATION_SEC}s")
    print("="*70)
    print("\n Starting server on http://localhost:8000")
    print(" API docs available at http://localhost:8000/docs")
    print("="*70 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)