const express = require("express")
const router = express.Router()
const User = require("../models/User")
const Post = require("../models/Post")
const authMiddleware =require("../middleware/authMiddleware")
const upload = require("../middleware/upload")

router.post("/create-post", authMiddleware, upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]), async (req, res) => {

    try {

        console.log("FILES RECEIVED:")
        console.dir(req.files, { depth: null })

        const user = await User.findById(req.userId)

        if(!user) {

            return res.status(404).json({
                message: "User Not Found"
            })

        }

        // CHECK FRIEND RULES

        if(user.friends === 0) {

            return res.status(403).json({
                message: "You need at least 1 friend to create posts"
            })

        }

        // FIND TODAY START TIME

        const today = new Date()

        today.setHours(0, 0, 0, 0)

        // COUNT TODAY POSTS

        const todayPosts = await Post.countDocuments({

            userId: req.userId,

            createdAt: {
                $gte: today
            }

        })

        // POST LIMIT LOGIC

        if(user.friends === 1 && todayPosts >= 1) {

            return res.status(403).json({
                message: "Daily post limit reached"
            })

        }

        if(user.friends === 2 && todayPosts >= 2) {

            return res.status(403).json({
                message: "Daily post limit reached"
            })

        }

        console.log("FILES:", req.files)

        const imageUrl =

    req.files?.image

    ? req.files.image[0].path

    : ""

const videoUrl =

    req.files?.video

    ? req.files.video[0].path

    : ""

    if (
    !req.body.caption &&
    !imageUrl &&
    !videoUrl
) {
    return res.status(400).json({
        message:
        "Post must contain caption, image, or video"
    })
}

console.log("Image URL:", imageUrl)

console.log("Video URL:", videoUrl)

        // CREATE POST

        const newPost = new Post({

    userId: req.userId,

    caption: req.body.caption || "",

    image: imageUrl,

    video: videoUrl

})

        await newPost.save()

        res.status(201).json({
            message: "Post Created Successfully"
        })

    }

    catch(error) {

    console.error("CREATE POST ERROR:")

    console.error(error)

    console.error(error.message)

    console.error(error.stack)

    res.status(500).json({

        message: error.message

    })

}

})

router.put("/like-post/:id", async (req, res) => {

    try {

        const post = await Post.findById(req.params.id)

        if(!post) {

            return res.status(404).json({
                message: "Post Not Found"
            })

        }

        post.likes += 1

        await post.save()

        res.status(200).json({
            message: "Post Liked Successfully",
            totalLikes: post.likes
        })

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

router.put("/comment-post/:id", async (req, res) => {

    try {

        const post = await Post.findById(req.params.id)

        if(!post) {

            return res.status(404).json({
                message: "Post Not Found"
            })

        }

        post.comments.push({

            text: req.body.text

        })

        await post.save()

        res.status(200).json({
            message: "Comment Added Successfully",
            comments: post.comments
        })

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

router.get("/all-posts", async (req, res) => {

    try {

        const posts = await Post.find()

        .sort({ createdAt: -1 })

        res.status(200).json(posts)

    }

    catch(error) {

        console.log(error)

        res.status(500).json({
            message: error.message
        })

    }

})

router.put("/share-post/:id", async (req, res) => {

    try {

        const post = await Post.findById(req.params.id)

        if(!post) {

            return res.status(404).json({
                message: "Post Not Found"
            })

        }

        post.shares += 1

        post.sharedWith.push(req.body.friendId)

        await post.save()

        res.status(200).json({
            message: "Post Shared Successfully",
            totalShares: post.shares
        })

    }

    catch(error) {

        console.log(error)

        res.status(500).json({
            message: error.message
        })

    }

})

module.exports = router