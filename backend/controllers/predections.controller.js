
import {Router} from 'express';
import * as predectionsService from '../Modules/Predections/predections.service.js';
import { upload } from '../middleware/middleware.upload.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/makePrediction', protect, upload.single('audio'), predectionsService.createPrediction);
router.get('/getPredictions', protect, predectionsService.getPredictions);

export default router;