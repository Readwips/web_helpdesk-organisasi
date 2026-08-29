import { Router } from 'express';
import { getEmployees, createEmployee, updateEmployee, importEmployees } from '../controllers/employee.controller';
import { authenticate, authorize, requireCsrf } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.get('/', getEmployees);
router.post('/', requireCsrf, createEmployee);
router.put('/:id', requireCsrf, updateEmployee);
router.post('/import', requireCsrf, importEmployees);

export { router as employeeRoutes };
