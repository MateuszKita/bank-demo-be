import {Schema, Model, model} from 'mongoose';
import {ITransferDTO} from '../models/transfers.model';

export const TransferSchema: Schema = new Schema({
    date: {
        type: String,
        required: true
    },
    title: {
        type: String,
        minlength: 1,
        maxlength: 250,
        required: true
    },
    amount: {
        type: Number,
        min: 0,
        default: 1000
    },
    senderData: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            postalCode: {
                type: String,
                required: true,
                trim: true
            },
            city: {
                type: String,
                required: true,
                trim: true
            },
            street: {
                type: String,
                required: true,
                trim: true
            }
        },
        accountNumber: {
            type: String,
            minlength: 26,
            maxlength: 26,
            required: true
        }
    },
    recipientData: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        address: {
            postalCode: {
                type: String,
                required: true,
                trim: true
            },
            city: {
                type: String,
                required: true,
                trim: true
            },
            street: {
                type: String,
                required: true,
                trim: true
            }
        },
        accountNumber: {
            type: String,
            minlength: 26,
            maxlength: 26,
            required: true
        }
    }
});

export const Transfer: Model<ITransferDTO> = model('Transfer', TransferSchema);
