import {User} from '../mongoose/users.mongoose';
import {verify} from 'jsonwebtoken';
import {NextFunction, Request, Response} from 'express';
import {UNAUTHORIZED} from 'http-status-codes';
import {JWT_KEY} from '../shared/constants';

export const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authorizationHeader = req.header('Authorization');
        if (req && authorizationHeader) {
            const token = authorizationHeader.replace('Bearer ', '');
            const decoded = verify(token, JWT_KEY) as any;
            const user = await User.findOne({_id: decoded._id, 'tokens.token': token});

            if (!user) {
                throw new Error();
            }

            (req as any).token = token;
            (req as any).user = user;
        } else {
            console.error('ERROR: No authorization header');
        }
        next();
    } catch (e) {
        res.status(UNAUTHORIZED).send({error: 'Please authenticate.'});
    }
};
