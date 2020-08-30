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
        res.status(CREATED).send({login: user.login});
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
 *                       Get login data (random indexes of password) - "GET /users/login"
 ******************************************************************************/

router.get('/login', async (req: Request, res: Response) => {
    try {
        const user = await (User as any).findByLogin(req.body.login);
        let randomIndexesForMask: number[] = [];
        while (randomIndexesForMask.length === 0 || randomIndexesForMask.every((indexForMask) => indexForMask >= user.password.length)) {
            randomIndexesForMask = getUniqueRandomNumbersInRange(6, 20);
        }
        user.randomIndexes = randomIndexesForMask;
        await user.save();
        res.send({indexesForMask: randomIndexesForMask});
    } catch (e) {
        console.error(e);
        let httpStatus = BAD_REQUEST;
        let message = 'Could not get login data';
        switch (e.message) {
            case USER_ERROR.LOGIN_NOT_FOUND:
                httpStatus = NOT_FOUND;
                message = 'Could not find user with given login';
                break;
            default:
        }
        res.status(httpStatus).send({message});
    }
});

function getUniqueRandomNumbersInRange(count: number, range: number) {
    const randomNumbers = [];
    while (randomNumbers.length < count) {
        const randomNumber = Math.floor(Math.random() * range) + 1;
        if (randomNumbers.indexOf(randomNumber) === -1) {
            randomNumbers.push(randomNumber);
        }
    }
    return randomNumbers;
}

/******************************************************************************
 *                       Log In - "POST /users/login"
 ******************************************************************************/

router.post('/login', async (req: Request, res: Response) => {
    try {
        const {login, password} = req.body as IUser;
        if (password.length !== 6) {
            throw new Error(USER_ERROR.PASSWORD_INCORRECT);
        }
        const user = await (User as any).findByCredentials(login, password);
        if (user.randomIndexes.length !== 6) {
            throw new Error(USER_ERROR.PASSWORD_INCORRECT);
        }
        const token = await user.generateAuthToken();
        user.randomIndexes = [];
        await user.save();
        res.send({token});
    } catch (e) {
        console.error(e);
        let httpStatus = BAD_REQUEST;
        let message = 'Could not log in...';
        switch (e.message) {
            case USER_ERROR.PASSWORD_INCORRECT:
                httpStatus = UNAUTHORIZED;
                message = 'Password is incorrect...';
                break;
            case USER_ERROR.LOGIN_NOT_FOUND:
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
    const user: IUser = (req as any as IAuthorizedRequest).user;
    const {firstName, lastName, dateOfBirth, address, parentsNames, accountNumber} = user;
    res.send({firstName, lastName, dateOfBirth, address, parentsNames, accountNumber});
});

/******************************************************************************
 *                      Log out user - "POST /users/logout"
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
