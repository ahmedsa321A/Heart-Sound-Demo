"""
Convert Keras H5 model to TFLite for on-device inference.

Usage:
    python convert_model.py

Output:
    ../mobile/assets/models/heart_model.tflite
"""

import os
import sys
import numpy as np
from pathlib import Path


def main():
    base_dir = Path(__file__).resolve().parent
    model_path = base_dir / "Models" / "Mfcc" / "loss_focal_loss_model.h5"

    print(f"Loading model from: {model_path}")

    # Use environment variable to suppress TF warnings
    os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

    import tensorflow as tf
    import tensorflow.keras.backend as K

    # Custom loss function matching training
    def focal_loss(gamma=2.0, alpha=0.5):
        def loss(y_true, y_pred):
            y_pred = K.clip(y_pred, 1e-7, 1 - 1e-7)
            pt = y_true * y_pred + (1 - y_true) * (1 - y_pred)
            return -K.mean(alpha * K.pow(1 - pt, gamma) * K.log(pt))
        return loss

    # Try multiple loading strategies for compatibility
    model = None

    # Strategy 1: Direct load with custom objects (may fail on Keras 3 / TF 2.16+)
    try:
        from tensorflow.keras.models import load_model
        import keras
        model = load_model(
            str(model_path),
            custom_objects={
                'loss': focal_loss(gamma=2.0, alpha=0.5),
                'Dense': lambda **kwargs: keras.layers.Dense(
                    **{k: v for k, v in kwargs.items() if k != 'quantization_config'}
                ),
            },
        )
        print("[OK] Loaded with standard load_model")
    except Exception as e1:
        print(f"Standard load failed: {e1}")

        # Strategy 2: Use h5py to extract weights and rebuild model manually
        try:
            import h5py
            import json

            with h5py.File(str(model_path), 'r') as f:
                # Try to get model config
                if 'model_config' in f.attrs:
                    config_str = f.attrs['model_config']
                    if isinstance(config_str, bytes):
                        config_str = config_str.decode('utf-8')
                    config = json.loads(config_str)
                    print(f"[INFO] Model config found, architecture: {config.get('class_name', 'unknown')}")

            # Build model from config with compatibility fixes
            # The input shape from config is [None, 32, 40, 1]
            print("[INFO] Rebuilding model architecture from config...")

            # We know the model input shape from the config error: [None, 32, 40, 1]
            # Let's use tf.keras.models.load_model with compile=False
            model = tf.keras.models.load_model(
                str(model_path),
                compile=False,
                custom_objects={
                    'focal_loss': focal_loss(gamma=2.0, alpha=0.5),
                },
            )
            print("[OK] Loaded with compile=False")
        except Exception as e2:
            print(f"compile=False load failed: {e2}")

            # Strategy 3: Load weights only into a manually defined architecture
            try:
                print("[INFO] Attempting manual model reconstruction...")
                import h5py
                import json

                with h5py.File(str(model_path), 'r') as f:
                    config_str = f.attrs.get('model_config', b'{}')
                    if isinstance(config_str, bytes):
                        config_str = config_str.decode('utf-8')
                    config = json.loads(config_str)

                # Parse the config to understand layer structure
                layers_config = config.get('config', {}).get('layers', [])

                # Build using Sequential/Functional API based on config
                inputs = tf.keras.Input(shape=(32, 40, 1), name='input')
                x = inputs

                layer_outputs = {'input_layer_23': x}  # Map layer names to outputs

                for layer_cfg in layers_config:
                    cls = layer_cfg['class_name']
                    cfg = layer_cfg.get('config', {})
                    name = cfg.get('name', '')

                    if cls == 'InputLayer':
                        continue
                    elif cls == 'Conv2D':
                        filters = cfg.get('filters', 32)
                        kernel_size = tuple(cfg.get('kernel_size', [3, 3]))
                        activation = cfg.get('activation', 'relu')
                        padding = cfg.get('padding', 'same')
                        x = tf.keras.layers.Conv2D(
                            filters, kernel_size, activation=activation,
                            padding=padding, name=name
                        )(x)
                    elif cls == 'MaxPooling2D':
                        pool_size = tuple(cfg.get('pool_size', [2, 2]))
                        x = tf.keras.layers.MaxPooling2D(pool_size, name=name)(x)
                    elif cls == 'BatchNormalization':
                        x = tf.keras.layers.BatchNormalization(name=name)(x)
                    elif cls == 'Dropout':
                        rate = cfg.get('rate', 0.25)
                        x = tf.keras.layers.Dropout(rate, name=name)(x)
                    elif cls == 'Flatten':
                        x = tf.keras.layers.Flatten(name=name)(x)
                    elif cls == 'GlobalAveragePooling2D':
                        x = tf.keras.layers.GlobalAveragePooling2D(name=name)(x)
                    elif cls == 'Dense':
                        units = cfg.get('units', 64)
                        activation = cfg.get('activation', 'relu')
                        x = tf.keras.layers.Dense(units, activation=activation, name=name)(x)
                    else:
                        print(f"  [WARN] Unknown layer type: {cls}, skipping...")

                    layer_outputs[name] = x

                model = tf.keras.Model(inputs=inputs, outputs=x)
                model.summary()

                # Load weights
                model.load_weights(str(model_path))
                print("[OK] Model reconstructed and weights loaded")

            except Exception as e3:
                print(f"\nAll loading strategies failed:")
                print(f"  Strategy 1: {e1}")
                print(f"  Strategy 2: {e2}")
                print(f"  Strategy 3: {e3}")
                print("\nPlease ensure TensorFlow and Keras versions are compatible.")
                print("Try: pip install tensorflow==2.15.0")
                sys.exit(1)

    print(f"[OK] Model loaded. Input shape: {model.input_shape}")
    print(f"[OK] Model output shape: {model.output_shape}")

    # Convert to TFLite
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = []
    converter.target_spec.supported_types = [tf.float32]

    print("Converting to TFLite...")
    tflite_model = converter.convert()

    # Save
    output_dir = base_dir.parent / "mobile" / "assets" / "models"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "heart_model.tflite"

    with open(output_path, "wb") as f:
        f.write(tflite_model)

    size_kb = os.path.getsize(output_path) / 1024
    print(f"\n[OK] TFLite model saved to: {output_path}")
    print(f"[OK] Model size: {size_kb:.1f} KB")

    # Verify
    print("\nVerifying converted model...")
    interpreter = tf.lite.Interpreter(model_path=str(output_path))
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    print(f"  Input:  {input_details[0]['shape']} dtype={input_details[0]['dtype']}")
    print(f"  Output: {output_details[0]['shape']} dtype={output_details[0]['dtype']}")

    # Test with dummy data
    dummy_input = np.random.randn(*input_details[0]['shape']).astype(np.float32)
    interpreter.set_tensor(input_details[0]['index'], dummy_input)
    interpreter.invoke()
    dummy_output = interpreter.get_tensor(output_details[0]['index'])
    print(f"  Test output: {dummy_output}")
    print("\n[OK] Verification passed! Model is ready for mobile deployment.")


if __name__ == "__main__":
    main()
