
  # Medical Heart Sound Detection UI

  This is a code bundle for Medical Heart Sound Detection UI. The original project is available at https://www.figma.com/design/dmrVRGpPxNpKKS1nqk6aDO/Medical-Heart-Sound-Detection-UI.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
  ## Demo mode (no backend)

  Set `VITE_DEMO_MODE=true` in `.env` to run the website without the backend, database or AI service
  (same as the mobile app's demo mode):

  - A demo user is signed in automatically; auth pages redirect to the dashboard.
  - Analysis runs in the browser: signal quality check → MFCC features → CNN via TensorFlow.js
    (model files in `public/models/heart_model/`, loaded only in demo mode).
  - History and stats are stored in the browser (localStorage).

  To regenerate the browser model from the Keras model, run `python ai-service/export_tfjs_model.py`
  (needs only `h5py` and `numpy`).

  ## Tests

  Run `npx tsx --test src/__tests__/*.test.js`.
