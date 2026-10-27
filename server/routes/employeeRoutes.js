import express from 'express';
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllEmployees)
  .post(authorize('HR'), createEmployee);

router
  .route('/:id')
  .get(getEmployeeById)
  .put(updateEmployee)
  .delete(authorize('HR'), deleteEmployee);

export default router;
