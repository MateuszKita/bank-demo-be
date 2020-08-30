import {Router} from 'express';
import UsersRouter from './users.route';
import TransfersRoute from './transfers.route';

const router = Router();

router.use('/users', UsersRouter);
router.use('/transfers', TransfersRoute);

export default router;
