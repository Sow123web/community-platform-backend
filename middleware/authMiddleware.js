const jwt = require("jsonwebtoken")

const authMiddleware = (req, res, next) => {

    try {

        const token =
        req.headers.authorization

        if(!token) {

            return res.status(401).json({

                message: "No Token Provided"

            })

        }

        const decoded = jwt.verify(

            token,

            "secretkey"

        )

        req.userId = decoded.id

        next()

    }

    catch(error) {

        res.status(401).json({

            message: "Invalid Token"

        })

    }

}

module.exports = authMiddleware