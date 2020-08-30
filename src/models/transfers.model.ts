import {ObjectId} from 'mongodb';
import {Document} from 'mongoose';

export interface ITransfer {
    _id: ObjectId;
    date: string;
    title: string;
    amount: number;
    senderData: ITransferUser;
    recipientData: ITransferUser;
}

export interface ITransferDTO extends ITransfer, Document {
    _id: ObjectId | string | any;
}

export interface ITransferUser {
    name: string;
    accountNumber: string;
    address: {
        postalCode: string;
        city: string;
        street: string;
    };
}
