const multer = require("multer")

const cloudinary = require("../config/cloudinary")

const { CloudinaryStorage } =
require("multer-storage-cloudinary")

const storage = new CloudinaryStorage({

    cloudinary,

    params: async (req, file) => ({

        folder: "community-posts",

        resource_type:

            file.mimetype.startsWith("video")

            ? "video"

            : "image"

    })

})

const upload = multer({

    storage

})

module.exports = upload