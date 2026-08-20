import { Router } from 'express';
import { getEmployees, createEmployee, updateEmployee, importEmployees } from '../controllers/employee.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', getEmployees);
router.post('/', createEmployee);
router.put('/:id', updateEmployee);
router.post('/import', importEmployees);

export { router as employeeRoutes };
