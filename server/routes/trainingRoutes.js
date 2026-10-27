import express from 'express';
import {
  getMyTrainings,
  getAllTrainings,
  assignTraining,
  updateTrainingStatus,
} from '../controllers/trainingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/my-trainings', getMyTrainings);
router.get('/all', authorize('HR', 'Manager'), getAllTrainings);
router.post('/assign', authorize('HR', 'Manager'), assignTraining);
router.put('/:id/status', updateTrainingStatus);

export default router;
