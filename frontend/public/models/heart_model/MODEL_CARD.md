# HeartAI heart sound model (fine-tuned, 2026-11-18, v3)

Same CNN and MFCC pipeline as `ai-service/Models/Mfcc/loss_focal_loss_model.h5` (which it was initialized from),
fine-tuned on the GPU with PyTorch and converted back to TF.js. Decision cutoff: **0.506** (top-3 mean of segment
probabilities), chosen on validation data to keep the previous model's sensitivity.

**Training data** (70% of patients; 15% validation, 15% test): PhysioNet 2016, CirCor 2022 (murmur present = abnormal),
Yaseen 2018, BMD-HS (any valve disease = abnormal) and HeartWave (any abnormal class = abnormal), each with 3
"phone simulation" copies (low-cut filter, background noise from ESC-50, pink noise).

**Test results** (never used for training or model selection), AUC — abnormal caught / normal correct:

| Test set | Previous model (v2) | This model (v3) |
|---|---|---|
| PASCAL set_a — real iPhone recordings (84) | 0.532 — 38% / 77% | 0.533 — 36% / 77% |
| PASCAL set_b — stethoscope, other clinic (461) | 0.697 — 38% / 87% | 0.727 — 37% / 91% |
| PhysioNet 2016, held-out patients (486) | 0.963 — 87% / 89% | 0.962 — 86% / 90% |
| CirCor 2022, held-out patients (446) | 0.847 — 64% / 93% | 0.857 — 66% / 95% |
| Yaseen 2018, held-out (150) | 0.987 — 92% / 100% | 0.992 — 92% / 100% |
| BMD-HS, held-out patients (136) | 0.766 — 99% / 0% | 0.848 — 100% / 4% |
| HeartWave, held-out (203) | 0.575 — 73% / 12% | 0.767 — 97% / 5% |

Three training runs with different seeds gave the same results within ±0.005 AUC.
Phone recordings remain unreliable (AUC near 0.5); labeled phone recordings collected through the app are needed to improve them.
On BMD-HS and HeartWave recordings most normal hearts score above the cutoff: the model ranks them well (AUC) but the
cutoff does not fit those stethoscopes yet.

## Data sources and licenses

- PhysioNet/CinC Challenge 2016 — ODC-BY 1.0
- CirCor DigiScope 2022 (PhysioNet) — ODC-BY 1.0
- Yaseen et al. 2018, "Classification of Heart Sound Signal Using Multiple Features" — CC BY 4.0
- BMD-HS (Ali et al., "BUET Multi-disease Heart Sound Dataset") — CC BY-NC-ND 4.0, **non-commercial use only**
- HeartWave dataset (Littmann 3200 recordings) — used here for non-commercial research; check its publisher's license before any commercial use
- ESC-50 (background noise for phone simulation) — CC BY-NC 3.0, **non-commercial use only**

Because of BMD-HS and ESC-50 this model may only be used non-commercially. For commercial use, retrain without them.
