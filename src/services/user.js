const { User } = require('../models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config();

//TODO set identity prop name based on exam description
const identityName = 'email';

async function register(identity, firstName, lastName, password) {
    
    const existing = await User.findOne({ [identityName]: identity } );
    
    if (existing) {
        throw new Error(`This ${identityName} is already in use`);
    };

    const user = new User({
        firstName,
        lastName,
        [identityName]: identity,
        password: await bcrypt.hash(password, 10)
    });
    
    try {
        await user.save();
    } catch (err) {
        /* if (err.code == 11000) {
            throw new Error("This firstname or lastname is already in use");
        }; */
        throw err;
    }

    return user;
};

async function login(identity, password) {
    const user = await User.findOne({ [identityName]: identity } );

    if (!user) {
        throw new Error(`Incorrect ${identityName} or password`);
    };

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        throw new Error(`Incorrect ${identityName} or password`);
    };

    await user.save();

    return user;
};

async function getUserById(id) {
    return User.findById(id).lean();
};

async function updateUserInfo(oldIdentity, newIdentity, firstName, lastName, password, picture = '', pictureId = '') {
    console.log(oldIdentity, newIdentity, firstName, lastName, password, picture, pictureId)
    const user = await User.findOne({ [identityName]: oldIdentity } );
    if (!user) {
        throw new Error(`This ${identityName} does not exist`);
    }

    if (newIdentity && newIdentity !== oldIdentity) {
        // Провери дали новия имейл вече съществува
        const existingUser = await User.findOne({ [identityName]: newIdentity });
        if (existingUser) {
            throw new Error('This email is already taken');
        }
        user.email = newIdentity;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (picture) user.picture = picture;
    if (pictureId) user.pictureId = pictureId;

    if (password) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        user.password = hashedPassword;
    }

    await user.save();
    return user;
}

async function removePicture(identity) {
    const user = await User.findOne({ [identityName]: identity } );
    if (!user) {
        throw new Error(`This ${identityName} does not exist`);
    }

    if (user.pictureId) {
        console.log('Inside if for picture destroy');
        await cloudinary.uploader.destroy(user.pictureId).then(result => console.log(result));
    }

    user.picture = ''
    user.pictureId = '';

    await user.save();
    console.log(user);
    
    return user;
}

module.exports = {
    register,
    login,
    getUserById,
    updateUserInfo,
    removePicture
}