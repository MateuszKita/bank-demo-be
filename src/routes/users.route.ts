import {Request, Response, Router} from 'express';
import {BAD_REQUEST, CONFLICT, CREATED, INTERNAL_SERVER_ERROR, NOT_FOUND, UNAUTHORIZED} from 'http-status-codes';
import {User} from '../mongoose/users.mongoose';
import {IAuthorizedRequest, IUser, IUserDTO} from '../models/users.model';
import {auth} from '../middleware/authorization';
import {USER_ERROR} from '../models/users.constans';

const router = Router();

/******************************************************************************
 *                       Create User - "POST /users/"
 ******************************************************************************/

router.post('/', async (req: Request, res: Response) => {
    const user = new User(req.body);
    try {
        user.accountNumber = generateRandomNumber(26);
        const {firstName, lastName}: IUser = req.body;
        // TODO : validate is login unique
        user.login = generateLogin(firstName, lastName);
        await user.save();
        const token = await user.generateAuthToken();
        res.status(CREATED).send({login: user.login, token});
    } catch (e) {
        console.error(e);
        res.status(e.code === 11000 ? CONFLICT : BAD_REQUEST).send({message: e.message});
    }
});

function generateRandomNumber(length: number) {
    let result = '';
    const allowedChars = '0123456789';
    for (let counter = 0; counter < length; counter++) {
        result += allowedChars.charAt(Math.floor(Math.random() * allowedChars.length));
    }
    return result;
}

function generateLogin(firstName: string, lastName: string) {
    return `${firstName}${lastName}${generateRandomNumber(6)}`.toLowerCase();
}

/******************************************************************************
 *                       Log In - "POST /users/login"
 ******************************************************************************/

router.post('/login', async (req: Request, res: Response) => {
    try {
        const user = await (User as any).findByCredentials(req.body.email, req.body.password);
        await user.save();
        const token = await user.generateAuthToken();
        res.send({user, token});
    } catch (e) {
        let httpStatus = BAD_REQUEST;
        let message = 'Could not log in...';
        switch (e.message) {
            case USER_ERROR.PASSWORD_INCORRECT:
                httpStatus = UNAUTHORIZED;
                message = 'Password is incorrect...';
                break;
            case USER_ERROR.EMAIL_NOT_FOUND:
                httpStatus = NOT_FOUND;
                message = 'Could not find user with given e-mail address...';
                break;
            default:
        }
        res.status(httpStatus).send({message});
    }
});

/******************************************************************************
 *                      Get info about User / Specific User - "GET /users/me"
 ******************************************************************************/

router.get('/me', auth, async (req: Request, res: Response) => {
    res.send((req as any as IAuthorizedRequest).user);
});

/******************************************************************************
 *                      Log all User everywhere - "POST /users/logout"
 ******************************************************************************/

router.post('/logout', auth, async (req: Request, res: Response) => {
    try {
        const authorizedRequest: IAuthorizedRequest = (req as any as IAuthorizedRequest);
        authorizedRequest.user.tokens = [];
        await authorizedRequest.user.save();
        res.send();
    } catch (e) {
        console.error(e);
        res.status(INTERNAL_SERVER_ERROR).send(e);
    }
});

export default router;
