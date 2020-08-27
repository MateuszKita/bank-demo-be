import {compare, hash} from 'bcryptjs';
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
    password: {
        type: String,
        required: true,
        minlength: 8,
        trim: true,
        validate(value: string) {
            // TODO : validate number and capitalized letter in password
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
        // TODO : Adjust to masked password
        user.password = await hash(user.password, 8);
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
        throw new Error(USER_ERROR.EMAIL_NOT_FOUND);
    }

    return user;
};

UserSchema.statics.findByCredentials = async (login: string, password: string) => {
    const user = await User.findOne({login});

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
