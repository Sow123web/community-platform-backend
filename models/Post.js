const mongoose = require("mongoose")

const postSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    caption: {
        type: String,
        default: ""
    },

    image: {
        type: String,
        default: ""

    },

    video: {
        type: String,
        default: ""
    },

    likes: {
        type: Number,
        default: 0
    },

    shares: {
    type: Number,
    default: 0
   },   

    comments: [

    {
        text: {
            type: String
        }
    }

    ],

    createdAt: {
        type: Date,
        default: Date.now
    },

    sharedWith: [

    {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User"

    }

]

})

module.exports = mongoose.model("Post", postSchema)