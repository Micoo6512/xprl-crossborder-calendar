import { Router } from 'express';
import authRoutes from './auth.routes.js';
import festivalRoutes from './festival.routes.js';
import jumpRoutes from './jump.routes.js';
import orderRoutes from './order.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/festivals', festivalRoutes);
router.use('/', jumpRoutes);
router.use('/', orderRoutes);
router.use('/', userRoutes);

export default router;
