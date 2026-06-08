const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
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

    phone: {
    type: String,
    required: true
    },

    lastPasswordReset: {
    type: Date,
    default: null
    },

    friends: [
    {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User"

    }

],

    plan: {
    type: String,
    default: "Free"
    },

    applicationsUsed: {
    type: Number,
    default: 0
    },

    planPurchasedAt: {
    type: Date,
    default: null
    },

    otp: {
    type: String,
    default: null
    },

    otpExpires: {
    type: Date,
    default: null
    },

    resume: {
    type: Object,
    default: null
    },

    resumePaymentDone: {
    type: Boolean,
    default: false
    },

    language: {
    type: String,
    default: "English"
    },

    loginHistory: [

    {

        browser: String,

        operatingSystem: String,

        device: String,

        ipAddress: String,

        loginTime: {

            type: Date,

            default: Date.now

        }

    }

    ]

})

module.exports = mongoose.model("User", userSchema)
