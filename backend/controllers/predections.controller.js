
import {Router} from 'express';
import * as predectionsService from '../Modules/Predections/predections.service.js';
import { upload } from '../../middleware/middleware.upload.js';

const router = Router();

router.post('/makePrediction', upload.single('audio'), predectionsService.createPredection);
router.get('/getPredictions', predectionsService.getPredections);

export default router;