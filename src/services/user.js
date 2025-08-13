const { User } = require('../models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config();

//TODO set identity prop name based on exam description
const identityName = 'email';

async function register(identity, firstName, lastName, password, lat, lng) {

    const existing = await User.findOne({ [identityName]: identity });

    if (existing) {
        throw new Error(`This ${identityName} is already in use`);
    };

    const user = new User({
        firstName,
        lastName,
        [identityName]: identity,
        password: await bcrypt.hash(password, 10),
        loginHistory: lat != null && lng != null
            ? [{ lat, lng, date: new Date() }]
            : []
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

const GEO_THRESHOLD_KM = 500; // distance limit

function getDistance(lat1, lng1, lat2, lng2) {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

async function login(identity, password, lat, lng) {
    console.log(lat, lng);

    const user = await User.findOne({ [identityName]: identity });

    if (!user) {
        throw new Error(`Incorrect ${identityName} or password`);
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        throw new Error(`Incorrect ${identityName} or password`);
    }


    if (lat != null && lng != null) {
        user.loginHistory.unshift({ lat, lng, date: new Date() });


        if (user.loginHistory.length > 5) {
            user.loginHistory = user.loginHistory.slice(0, 5);
        }


        if (user.loginHistory.length > 1) {
            const last = user.loginHistory[1];
            const distance = getDistance(last.lat, last.lng, lat, lng);
            if (distance > GEO_THRESHOLD_KM) {
                console.log(`⚠️ Suspicious login detected for ${identity}: ${distance.toFixed(2)} km away`);
            }
        }

        await user.save();
    }

    return user;
}

/* async function login(identity, password) {
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
}; */

async function getUserById(id) {
    return User.findById(id).lean();
};

async function deleteById(userId) {
    const record = await User.findById(userId);
    if (!record) {
        throw new Error("Record not found " + userId);
    };

    if (record._id.toString() != userId) {
        throw new Error("Access denied");
    };

    await User.findByIdAndDelete(userId);
};

async function updateUserInfo(oldIdentity, newIdentity, firstName, lastName, password, picture = '', pictureId = '') {
    console.log(oldIdentity, newIdentity, firstName, lastName, password, picture, pictureId)
    const user = await User.findOne({ [identityName]: oldIdentity });
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
    const user = await User.findOne({ [identityName]: identity });
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
    deleteById,
    updateUserInfo,
    removePicture
}