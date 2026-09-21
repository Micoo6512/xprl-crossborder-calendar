import { Router } from 'express';
import { body } from 'express-validator';
import { listPlans, createOrder, payOrder } from '../controllers/order.controller.js';
import { authRequired } from '../middleware/auth.js';
import validateRequest from '../middleware/validateRequest.js';

const router = Router();

router.get('/membership/plans', listPlans);
router.post(
  '/orders',
  authRequired,
  [
    body('planCode').isString().isIn(['monthly', 'yearly']).withMessage('planCode 仅支持 monthly/yearly'),
    validateRequest,
  ],
  createOrder,
);
router.post('/orders/:id/pay', authRequired, payOrder);

export default router;
