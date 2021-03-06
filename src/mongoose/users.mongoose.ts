import {compare, hash} from 'bcryptjs';
import {Schema, Model, model} from 'mongoose';
import {JWT_KEY} from '../shared/constants';
import {sign} from 'jsonwebtoken';
import {IUserDTO} from '../models/users.model';
import {USER_ERROR} from '../models/users.constans';

export const UserSchema: Schema = new Schema({
    login: {
        type: String,
        required: true,
        trim: true
    },
    password: [{
        type: String,
        required: true,
        trim: true
    }],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: String,
        required: true
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
    parentsNames: {
        mother: {
            type: String,
            required: true,
            trim: true
        },
        father: {
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
    },
    randomIndexes: [{
        type: Number
    }],
    money: {
        type: Number,
        min: 0,
        default: 1000
    }
});

async function hashPassword(password: string[]) {
    return Promise.all(password.map((char: string) => hash(char, 8)));
}

UserSchema.pre('save', async function(next) {
    const user = this as IUserDTO;
    const isPasswordHashed: boolean = user.password[0].length > 1;
    if (isPasswordHashed && user.password.every((char: string) => char === char.toUpperCase())) {
        next(new Error('no lowercase in password'));
    }
    if (isPasswordHashed && user.password.every((char: string) => char === char.toLowerCase())) {
        next(new Error('no uppercase in password'));
    }
    if (isPasswordHashed && !user.password.some((char: string) => !/^\d$/.test(char))) {
        next(new Error('no digit in password'));
    }
    if (user.isModified('password')) {
        user.password = await hashPassword(user.password);
    }
    next();
});

UserSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;

    return userObject;
};

UserSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = sign({_id: user._id.toString()}, JWT_KEY);

    user.tokens = user.tokens.concat({token});
    await user.save();

    return token;
};

UserSchema.statics.findByLogin = async (login: string) => {
    const user = await User.findOne({login});

    if (!user) {
        throw new Error(USER_ERROR.LOGIN_NOT_FOUND);
    }

    return user;
};

async function compareHashedStringArray(password: string[], hashedPassword: string[], indexes: number[]) {
    return password
        .map((char: string, index: number) => ({char, originalIndex: index}))
        .filter((_, index) => indexes.includes(index))
        .every((charObj: { char: string, originalIndex: number }) => hashedPassword[charObj.originalIndex]
            ? compare(charObj.char, hashedPassword[charObj.originalIndex])
            : true);
}

UserSchema.statics.findByCredentials = async (login: string, password: string[]) => {
    const user = await User.findOne({login});

    if (!user) {
        throw new Error(USER_ERROR.LOGIN_NOT_FOUND);
    }

    const isMatch = await compareHashedStringArray(password, user.password, user.randomIndexes);

    if (!isMatch) {
        throw new Error(USER_ERROR.PASSWORD_INCORRECT);
    }

    return user;
};

export const User: Model<IUserDTO> = model('User', UserSchema);
