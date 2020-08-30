import {Request, Response, Router} from 'express';
import {IAuthorizedRequest, IUser} from '../models/users.model';
import {auth} from '../middleware/authorization';
import {Transfer} from '../mongoose/transfers.mongoose';

const router = Router();

/******************************************************************************
 *                      Get all user's money transfers - "GET /transfers/"
 ******************************************************************************/

router.get('/transfers', auth, async (req: Request, res: Response) => {
    const user: IUser = (req as any as IAuthorizedRequest).user;
    const transfers = await Transfer.find({senderData: {accountNumber: user.accountNumber}});
    res.send(transfers);
});

export default router;
