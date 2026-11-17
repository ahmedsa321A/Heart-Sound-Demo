"""Exports YAMNet's core network (log-mel patches [N,96,64] -> 521 class scores) to TensorFlow.js layers format.

The website and backend use it to reject music/speech before the heart model runs
(frontend/src/services/demo/soundGate.ts). Output: frontend/public/models/yamnet/ (float16 weights).

Usage (needs tensorflow and tf_keras):
    # put YAMNet's original files next to this script:
    #   https://github.com/tensorflow/models/tree/master/research/audioset/yamnet  -> yamnet.py, params.py, features.py
    #   https://storage.googleapis.com/audioset/yamnet.h5
    python export_yamnet_tfjs.py ../frontend/public/models/yamnet
    ../backend/scripts/sync-inference.sh
"""
import os, sys, json, numpy as np
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'; os.environ['CUDA_VISIBLE_DEVICES'] = ''
sys.path.insert(0, os.path.dirname(__file__))
import params as yp, yamnet as ym
from tf_keras import layers, Model
P = yp.Params()
inp = layers.Input(shape=(P.patch_frames, P.patch_bands))
preds, _ = ym.yamnet(inp, P)
core = Model(inp, preds)
core.load_weights(os.path.join(os.path.dirname(__file__), 'yamnet.h5'))  # by layer order (the h5 names the classifier 'logits')
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
tfjs_layers, manifest, blobs = [], [], []
first = True
for layer in core.layers:
    cls = layer.__class__.__name__; cfg = layer.get_config()
    if cls == 'InputLayer': continue
    keep = {'Reshape': ['target_shape'], 'Conv2D': ['filters', 'kernel_size', 'strides', 'padding', 'use_bias', 'activation'],
            'BatchNormalization': ['axis', 'epsilon', 'center', 'scale'], 'ReLU': [],
            'DepthwiseConv2D': ['kernel_size', 'strides', 'padding', 'depth_multiplier', 'use_bias', 'activation'],
            'GlobalAveragePooling2D': [], 'Dense': ['units', 'use_bias', 'activation'], 'Activation': ['activation']}[cls]
    c = {'name': layer.name.replace('/', '_'), 'trainable': False, **{k: cfg[k] for k in keep}}
    if cls == 'BatchNormalization' and isinstance(c['axis'], list): c['axis'] = c['axis'][0]
    if first: c['batch_input_shape'] = [None, P.patch_frames, P.patch_bands]; first = False
    tfjs_layers.append({'class_name': cls, 'config': c})
    wnames = {'Conv2D': ['kernel'], 'DepthwiseConv2D': ['depthwise_kernel'], 'Dense': ['kernel', 'bias'],
              'BatchNormalization': ['beta', 'moving_mean', 'moving_variance']}.get(cls, [])
    ws = layer.get_weights(); assert len(ws) == len(wnames), (layer.name, len(ws), wnames)
    for wn, w in zip(wnames, ws):
        manifest.append({'name': f"{c['name']}/{wn}", 'shape': list(w.shape), 'dtype': 'float32',
                         'quantization': {'dtype': 'float16', 'original_dtype': 'float32'}})
        blobs.append(w.astype(np.float16).tobytes())
open(os.path.join(OUT, 'weights.bin'), 'wb').write(b''.join(blobs))
json.dump({'format': 'layers-model', 'generatedBy': 'yamnet export_tfjs.py (weights: storage.googleapis.com/audioset/yamnet.h5, Apache-2.0)',
           'modelTopology': {'class_name': 'Sequential', 'config': {'name': 'yamnet_core', 'layers': tfjs_layers}, 'keras_version': 'tfjs-layers', 'backend': 'tensor_flow.js'},
           'weightsManifest': [{'paths': ['weights.bin'], 'weights': manifest}]}, open(os.path.join(OUT, 'model.json'), 'w'))
# Reference outputs for parity tests
rng = np.random.default_rng(0); x = rng.normal(-3, 2, (3, P.patch_frames, P.patch_bands)).astype(np.float32)
np.save(os.path.join(OUT, '..', 'yamnet_ref_input.npy'), x); np.save(os.path.join(OUT, '..', 'yamnet_ref_output.npy'), core(x).numpy())
print('layers', len(tfjs_layers), 'weights MB', round(sum(len(b) for b in blobs) / 1e6, 2))
