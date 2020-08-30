import {Request, Response, Router} from 'express';
import {IAuthorizedRequest, IUserDTO} from '../models/users.model';
import {auth} from '../middleware/authorization';
import {Transfer} from '../mongoose/transfers.mongoose';
import {ITransferUser} from '../models/transfers.model';
import {BAD_REQUEST} from 'http-status-codes';
import {User} from '../mongoose/users.mongoose';

const router = Router();

/******************************************************************************
 *                      Get all user's money transfers - "GET /transfers/"
 ******************************************************************************/

router.get('/transfers', auth, async (req: Request, res: Response) => {
    const user: IUserDTO = (req as any as IAuthorizedRequest).user;
    const transfers = await Transfer.find({senderData: {accountNumber: user.accountNumber}});
    res.send(transfers);
});

/******************************************************************************
 *                      Perform money transfer - "POST /transfers/"
 ******************************************************************************/

router.get('/transfers', auth, async (req: Request, res: Response) => {
    try {
        const {recipientData, amount, title} = req.body;
        const user: IUserDTO = (req as any as IAuthorizedRequest).user;
        if (amount < user.money) {
            throw new Error('no-enough-money');
        }
        const senderData: ITransferUser = {
            name: `${user.firstName} ${user.lastName}`,
            accountNumber: user.accountNumber,
            address: {
                postalCode: user.address.postalCode,
                city: user.address.city,
                street: user.address.street
            }
        };
        const newTransfer = new Transfer({
            date: new Date().toISOString(),
            title,
            amount,
            senderData,
            recipientData
        });
        const recipient: IUserDTO | null = await User.findOne({accountNumber: recipientData.accountNumbe});
        if (recipient) {
            await newTransfer.save();
            recipient.money += amount;
            await recipient.save();
            user.money -= amount;
            await user.save();
        } else {
            throw new Error('wrong-recipient-account-number');
        }
        res.send({money: user.money});
    } catch (e) {
        console.error(e);
        res.status(BAD_REQUEST).send({message: e.message || 'incorrect-transfer-data'});
    }
});

export default router;
