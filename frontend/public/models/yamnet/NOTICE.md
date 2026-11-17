# YAMNet

Google's YAMNet audio event classifier (AudioSet, 521 classes), converted to TensorFlow.js layers format
with float16 weights by `ai-service/export_yamnet_tfjs.py`.

- Source: https://github.com/tensorflow/models/tree/master/research/audioset/yamnet
- Weights: https://storage.googleapis.com/audioset/yamnet.h5
- License: Apache License 2.0 — Copyright The TensorFlow Authors.

HeartAI uses it only to recognize recordings that are clearly not a heart sound (music, speech, other sounds).
