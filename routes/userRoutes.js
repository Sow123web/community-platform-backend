const express = require("express")
const router = express.Router()
const nodemailer = require("nodemailer")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const authMiddleware = require("../middleware/authMiddleware")

router.post("/register", async (req, res) => {

    try {

        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            phone: req.body.phone
        })

        await newUser.save()

        res.status(201).json({
            message: "User Registered Successfully"
        })

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

router.post("/login", async (req, res) => {

    console.log("Login Request:", req.body)

    try {

        const user = await User.findOne({

            email: req.body.email

        })

        if(!user) {

            return res.status(404).json({

                message: "User Not Found"

            })

        }

        if(user.password !== req.body.password) {

            return res.status(401).json({

                message: "Invalid Password"

            })

        }

        // MOBILE TIME RESTRICTION

        if(req.body.device === "Mobile") {

            const now = new Date()

            const indianTime =
            new Date(now.toLocaleString("en-US", {

                timeZone: "Asia/Kolkata"

            }))

            const hour = indianTime.getHours()

            if(hour < 10 || hour >= 13) {

                return res.status(403).json({

                    message:
                    "Mobile login allowed only between 10 AM and 1 PM"

                })

            }

        }

        // CHROME OTP LOGIC

        if(false && req.body.browser === "Chrome") {

            const otp =
            Math.floor(100000 + Math.random() * 900000)

            user.otp = otp.toString()

            user.otpExpires =
            new Date(Date.now() + 5 * 60 * 1000)

            await user.save()

            try {

    console.log("Sending OTP...")

    await transporter.sendMail({

        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Login Verification OTP",
        text: `Your Login OTP is ${otp}`

    })

    console.log("OTP Sent")

}
catch(error) {

    console.log("MAIL ERROR:", error)

    return res.status(500).json({
        message: error.message
    })

}

            return res.status(200).json({

                message:
                "OTP sent for Chrome login verification"

            })

        }

        const ipAddress =

        req.headers['x-forwarded-for']

        ||

        req.socket.remoteAddress

        // STORE LOGIN HISTORY

        user.loginHistory.push({

    browser: req.body.browser,

    operatingSystem:
    req.body.operatingSystem,

    device: req.body.device,

    ipAddress,

    loginTime: new Date()

})

        await user.save()

        const token = jwt.sign(

            {

                id: user._id

            },

            "secretkey",

            {

                expiresIn: "7d"

            }

        )

        // FINAL LOGIN SUCCESS

        res.status(200).json({

            message: "Login Successful",
            token, userId: user._id

        })

    }

    catch(error) {

        console.log("LOGIN ERROR:", error)

        res.status(500).json({

            message: error.message

        })

    }

})

router.post("/verify-login-otp", async (req, res) => {

    try {

        const user = await User.findOne({

            email: req.body.email

        })

        if(!user) {

            return res.status(404).json({

                message: "User Not Found"

            })

        }

        // CHECK OTP

        if(user.otp !== req.body.otp) {

            return res.status(400).json({

                message: "Invalid OTP"

            })

        }

        // CHECK OTP EXPIRY

        if(new Date() > user.otpExpires) {

            return res.status(400).json({

                message: "OTP Expired"

            })

        }

        // STORE LOGIN HISTORY

        user.loginHistory.push({

            browser:
            req.body.browser,

            operatingSystem:
            req.body.operatingSystem,

            device:
            req.body.device,

            ipAddress:
            req.body.ipAddress,

            loginTime:
            new Date()

        })

        // CLEAR OTP

        user.otp = null

        user.otpExpires = null

        await user.save()

        // GENERATE TOKEN

        const token = jwt.sign(

            {

                id: user._id

            },

            "secretkey",

            {

                expiresIn: "7d"

            }

        )

        res.status(200).json({

            message:
            "Login Successful After OTP Verification",

            token,

            userId:
            user._id

        })

    }

    catch(error) {

        res.status(500).json({

            message: error.message

        })

    }

})

router.get("/login-history",authMiddleware,async (req, res) => {

        try {

            const user =
            await User.findById(req.userId)

            if(!user) {

                return res.status(404).json({

                    message: "User Not Found"

                })

            }

            res.status(200).json({

                loginHistory:
                user.loginHistory

            })

        }

        catch(error) {

            console.log(error)

            res.status(500).json({

                message: error.message

            })

        }

    }

)

router.put(

    "/add-friend",

    authMiddleware,

    async (req, res) => {

        try {

            const user =
            await User.findById(req.userId)

            const friend =
            await User.findById(req.body.friendId)

            if(!friend) {

                return res.status(404).json({

                    message: "Friend Not Found"

                })

            }

            if(

                user.friends.includes(friend._id)

            ) {

                return res.status(400).json({

                    message:
                    "Already Friends"

                })

            }

            user.friends.push(friend._id)

            await user.save()

            res.status(200).json({

                message:
                "Friend Added Successfully",

                totalFriends:
                user.friends.length

            })

        }

        catch(error) {

            console.log(error)

            res.status(500).json({

                message: error.message

            })

        }

    }

)

router.put("/forgot-password", async (req, res) => {

    try {

        const user = await User.findOne({

            $or: [

                { email: req.body.email },

                { phone: req.body.phone }

            ]

        })

        if(!user) {

            return res.status(404).json({
                message: "User Not Found"
            })

        }

        // CHECK DAILY LIMIT

        const today = new Date()

        today.setHours(0, 0, 0, 0)

        if(user.lastPasswordReset &&
           user.lastPasswordReset >= today) {

            return res.status(403).json({
                message: "You can use this option only once per day"
            })

        }

        // GENERATE RANDOM PASSWORD

        const letters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

        let newPassword = ""

        for(let i = 0; i < 8; i++) {

            const randomIndex =
            Math.floor(Math.random() * letters.length)

            newPassword += letters[randomIndex]

        }

        // UPDATE PASSWORD

        user.password = newPassword

        user.lastPasswordReset = new Date()

        await user.save()

        try {

    console.log("Sending password reset email...")

    await transporter.sendMail({

        from: process.env.EMAIL_USER,

        to: user.email,

        subject: "Password Reset",

        text: `Your temporary password is: ${newPassword}`

    })

    console.log("Password reset email sent")

}
catch(error) {

    console.log("RESET MAIL ERROR:", error)

    return res.status(500).json({

        message: error.message

    })

}

transporter.verify(function(error, success) {

    if(error) {

        console.log("SMTP VERIFY ERROR:", error)

    }

    else {

        console.log("SMTP READY")

    }

})

        res.status(200).json({

    message:
    "Temporary password sent to your email"

})

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

router.put("/update-password", async (req, res) => {

    try {

        const user = await User.findOne({

            email: req.body.email

        })

        if(!user) {

            return res.status(404).json({

                message: "User Not Found"

            })

        }

        if(user.password !== req.body.tempPassword) {

            return res.status(400).json({

                message:
                "Invalid Temporary Password"

            })

        }

        user.password = req.body.newPassword

        await user.save()

        res.status(200).json({

            message:
            "Password Updated Successfully"

        })

    }

    catch(error) {

        res.status(500).json({

            message:
            error.message

        })

    }

})  

const transporter = nodemailer.createTransport({

    host: "smtp-relay.brevo.com",

    port: 587,

    secure: false,

    auth: {

        user: process.env.BREVO_USER,

        pass: process.env.BREVO_PASS

    }

})

transporter.verify((error, success) => {

    if(error) {

        console.log("BREVO ERROR:", error)

    }

    else {

        console.log("BREVO SMTP READY")

    }

})

router.put("/change-language", authMiddleware, async (req, res) => {

    try {

        const user = await User.findById(req.userId)

        if(!user) {

            return res.status(404).json({
                message: "User Not Found"
            })

        }

        // SUPPORTED LANGUAGES

        const supportedLanguages = [

            "English",

            "Spanish",

            "Hindi",

            "Portuguese",

            "Chinese",

            "French"

        ]

        // CHECK VALID LANGUAGE

        if(!supportedLanguages.includes(req.body.language)) {

            return res.status(400).json({

                message:
                "Unsupported Language"

            })

        }

        // FRENCH OTP LOGIC

        if(req.body.language === "French") {

            // GENERATE OTP

            const otp =
            Math.floor(100000 + Math.random() * 900000)

            user.otp = otp.toString()

            user.otpExpires =
            new Date(Date.now() + 5 * 60 * 1000)
            

            await user.save()

            // SEND EMAIL

            await transporter.sendMail({

                from: process.env.EMAIL_USER,

                to: user.email,

                subject:
                "French Language Verification OTP",

                text:
                `Your OTP for enabling French language is ${otp}`

            })

            return res.status(200).json({

                message:
                "OTP sent to email for French verification"

            })

        }

        // APPLY OTHER LANGUAGES DIRECTLY

        user.language = req.body.language

        await user.save()

        res.status(200).json({

            message:
            "Language Updated Successfully",

            language:
            user.language

        })

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

router.put("/verify-french-otp",authMiddleware, async (req, res) => {

    try {

        const user = await User.findById(req.userId)

        if(!user) {

            return res.status(404).json({
                message: "User Not Found"
            })

        }

        // CHECK OTP

        if(user.otp !== req.body.otp) {

            return res.status(400).json({
                message: "Invalid OTP"
            })

        }

        // CHECK OTP EXPIRY

        if(new Date() > user.otpExpires) {

            return res.status(400).json({
                message: "OTP Expired"
            })

        }

        // APPLY FRENCH LANGUAGE

        user.language = "French"

        // CLEAR OTP

        user.otp = null

        user.otpExpires = null

        await user.save()

        res.status(200).json({

            message:
            "French Language Enabled Successfully",

            language:
            user.language

        })

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

router.get("/profile", authMiddleware, async (req, res) => {

        try {

            const user =
            await User.findById(req.userId)

            if(!user) {

                return res.status(404).json({

                    message: "User Not Found"

                })

            }

            res.status(200).json({

    name: user.name,

    email: user.email,

    plan: user.plan,

    resumePaymentDone:
    user.resumePaymentDone,

    language: user.language,

    resume: user.resume,

    loginHistory: user.loginHistory
})

        }

        catch(error) {

            res.status(500).json({

                message: error.message

            })

        }

    }

)

module.exports = router