# HeartAI heart sound model (fine-tuned, 2026-11-18)

Same CNN and MFCC pipeline as `ai-service/Models/Mfcc/loss_focal_loss_model.h5` (which it was initialized from),
fine-tuned on the GPU with PyTorch and converted back to TF.js. Decision cutoff: **0.4766** (top-3 mean of segment probabilities).

**Training data** (70% of patients; 15% validation, 15% test): PhysioNet 2016, CirCor 2022 (murmur present = abnormal),
Yaseen 2018, each with 3 "phone simulation" copies (low-cut filter, background noise from ESC-50, pink noise).

**Test results** (never used for training or model selection), AUC — abnormal caught / normal correct:

| Test set | Previous model | This model |
|---|---|---|
| PASCAL set_a — real iPhone recordings (84) | 0.365 — 6% / 94% | 0.532 — 38% / 77% |
| PASCAL set_b — stethoscope, other clinic (461) | 0.706 — 12% / 94% | 0.697 — 38% / 87% |
| PhysioNet 2016, held-out patients (486) | 0.971 — 78% / 96% | 0.963 — 87% / 89% |
| CirCor 2022, held-out patients (446) | 0.585 — 19% / 90% | 0.847 — 64% / 93% |
| Yaseen 2018, held-out (150) | 0.973 — 10% / 100% | 0.987 — 92% / 100% |

Phone recordings remain unreliable (AUC near 0.5); labeled phone recordings collected through the app are needed to improve them.
