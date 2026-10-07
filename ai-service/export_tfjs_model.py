"""
Export the Keras H5 model to TensorFlow.js layers format for in-browser inference.

Only needs h5py + numpy (no TensorFlow install). The architecture is rebuilt as a
tf.js Sequential topology and the weights are copied from the H5 file as-is.

Usage:
    pip install h5py numpy
    python export_tfjs_model.py

Output:
    ../frontend/public/models/heart_model/model.json
    ../frontend/public/models/heart_model/weights.bin
"""

import json
from pathlib import Path

import h5py
import numpy as np

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "Models" / "Mfcc" / "loss_focal_loss_model.h5"
OUT_DIR = BASE_DIR.parent / "frontend" / "public" / "models" / "heart_model"

# Keras layer class -> (config keys to keep, weight names in tf.js order)
LAYER_SPECS = {
    "Conv2D": (
        ["filters", "kernel_size", "strides", "padding", "data_format",
         "dilation_rate", "activation", "use_bias"],
        ["kernel", "bias"],
    ),
    "BatchNormalization": (
        ["axis", "momentum", "epsilon", "center", "scale"],
        ["gamma", "beta", "moving_mean", "moving_variance"],
    ),
    "MaxPooling2D": (["pool_size", "strides", "padding", "data_format"], []),
    "Dropout": (["rate"], []),
    "GlobalAveragePooling2D": (["data_format"], []),
    "Dense": (["units", "activation", "use_bias"], ["kernel", "bias"]),
}


def main():
    with h5py.File(MODEL_PATH, "r") as f:
        raw = f.attrs["model_config"]
        config = json.loads(raw if isinstance(raw, str) else raw.decode("utf-8"))
        weights_group = f["model_weights"]

        layers = []
        manifest = []
        buffers = []
        input_shape = None

        for layer in config["config"]["layers"]:
            cls = layer["class_name"]
            cfg = layer["config"]
            name = cfg["name"]

            if cls == "InputLayer":
                input_shape = cfg.get("batch_shape") or cfg.get("batch_input_shape")
                continue
            if cls not in LAYER_SPECS:
                raise ValueError(f"Unsupported layer type: {cls}")

            keep, weight_names = LAYER_SPECS[cls]
            layer_cfg = {"name": name, "trainable": False}
            layer_cfg.update({k: cfg[k] for k in keep if k in cfg})
            if not layers:
                layer_cfg["batch_input_shape"] = input_shape
            layers.append({"class_name": cls, "config": layer_cfg})

            for wname in weight_names:
                data = np.asarray(weights_group[name][name][wname], dtype=np.float32)
                manifest.append({
                    "name": f"{name}/{wname}",
                    "shape": list(data.shape),
                    "dtype": "float32",
                })
                buffers.append(data.tobytes(order="C"))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "weights.bin").write_bytes(b"".join(buffers))

    model_json = {
        "format": "layers-model",
        "generatedBy": "export_tfjs_model.py",
        "convertedBy": None,
        "modelTopology": {
            "class_name": "Sequential",
            "config": {"name": "heart_model", "layers": layers},
            "keras_version": "tfjs-layers",
            "backend": "tensor_flow.js",
        },
        "weightsManifest": [{"paths": ["weights.bin"], "weights": manifest}],
    }
    (OUT_DIR / "model.json").write_text(json.dumps(model_json, indent=1))

    total = sum(len(b) for b in buffers)
    print(f"[OK] Exported {len(layers)} layers, {total} bytes of weights to {OUT_DIR}")


if __name__ == "__main__":
    main()
