import {compare, hash} from 'bcryptjs';
import isEmail = require('validator/lib/isEmail');
import {Schema, Model, model} from 'mongoose';
import {JWT_KEY} from '../shared/constants';
import {sign} from 'jsonwebtoken';
import {IUserDTO} from '../models/users.model';
import {USER_ERROR} from '../models/users.constans';

export const UserSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value: string) {
            const emailIsValid = isEmail(value);
            if (!emailIsValid) {
                throw new Error('Email is invalid');
            }
            return emailIsValid;
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value: string) {
            // const passwordIncludesIncorrectWords = value.toLowerCase().includes('password');
            //             // if (passwordIncludesIncorrectWords) {
            //             //     throw new Error('Password cannot contain "password"');
            //             // }
            //             // return !passwordIncludesIncorrectWords;
            return true;
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
});

UserSchema.pre('save', async function(next) {
    const user = this as IUserDTO;
    if (user.isModified('password')) {
        user.password = await hash(user.password, 8);
    }
    next();
});

UserSchema.pre('remove', async function(next) {
    const user = this;
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

UserSchema.statics.findByCredentials = async (email: string, password: string) => {
    const user = await User.findOne({email});

    if (!user) {
        throw new Error(USER_ERROR.EMAIL_NOT_FOUND);
    }

    const isMatch = await compare(password, user.password);

    if (!isMatch) {
        throw new Error(USER_ERROR.PASSWORD_INCORRECT);
    }

    return user;
};

export const User: Model<IUserDTO> = model('User', UserSchema);
