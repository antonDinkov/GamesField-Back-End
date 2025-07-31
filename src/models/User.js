const { Schema, model, Types } = require('mongoose');

//TODO add/change properties depending on exam description

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
        

    },
    email: {
        type: String,
        required: true,
        unique: true

    },
    password: {
        type: String,
        required: true
    },
    picture: {
        type: String,
        required: true
    },
    lastPlayed: {
        type: Types.ObjectId,
        ref: 'Data',
        default: null
    },
    myGames: [{
        type: Types.ObjectId,
        ref: 'Data',
        default: []
    }]
}, {
    collation: {
        locale: 'en',
        strength: 2
    }
});

const User = model('User', userSchema);

module.exports = { User };