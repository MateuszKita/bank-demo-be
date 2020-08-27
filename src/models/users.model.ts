import {ObjectId} from 'mongodb';
import {Document} from 'mongoose';

export interface IUser {
    _id: ObjectId | any;
    login: string;
    password: string;
    tokens: IUserToken[];
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    address: {
        postalCode: string;
        city: string;
        street: string;
    };
    parentsNames: {
        mother: string;
        father: string;
    };
    accountNumber: string;
}

export interface IUserDTO extends IUser, Document {
    generateAuthToken(): () => string;
}

export interface IAuthorizedRequest extends Request {
    token: string;
    user: IUserDTO;
}

export interface IUserToken {
    token: string;
    _id: ObjectId;
}
