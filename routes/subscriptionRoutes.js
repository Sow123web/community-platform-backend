const express = require("express")
const Razorpay = require("razorpay")
const nodemailer = require("nodemailer")

const razorpay = new Razorpay({

    key_id: process.env.RAZORPAY_KEY_ID,

    key_secret: process.env.RAZORPAY_SECRET

})

const router = express.Router()

const User = require("../models/User")

router.put("/buy-plan", async (req, res) => {

    try {

        const user = await User.findById(req.body.userId)

        if(!user) {

            return res.status(404).json({
                message: "User Not Found"
            })

        }

        // IST TIME CHECK

        const now = new Date()

        const indianTime =
        new Date(now.toLocaleString("en-US", {
            timeZone: "Asia/Kolkata"
        }))

        const hour = indianTime.getHours()

        // ALLOW ONLY 10AM TO 11AM

        if(hour < 19 || hour >= 20) {

            return res.status(403).json({
                message:
                "Payments allowed only between 10 AM and 11 AM IST"
            })

        }

        // UPDATE PLAN

        user.plan = req.body.plan

        user.applicationsUsed = 0

        user.planPurchasedAt = new Date()

        await user.save()

        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: user.email,

            subject: "Subscription Plan Invoice",

            text:
            `Hello ${user.name},

        Your ${user.plan} plan purchase was successful.

        Thank you for subscribing.

        - Internship Platform`

        })

        res.status(200).json({

            message: "Plan Purchased Successfully",

            currentPlan: user.plan

        })

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

router.post("/create-order", async (req, res) => {

    try {

        const options = {

            amount: req.body.amount * 100,

            currency: "INR",

            receipt:
            "receipt_" + Date.now()

        }

        const order =
        await razorpay.orders.create(options)

        res.status(200).json(order)

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    }

})

router.post("/apply-internship", async (req, res) => {

    try {

        const user = await User.findById(req.body.userId)

        if(!user) {

            return res.status(404).json({
                message: "User Not Found"
            })

        }

        // PLAN LIMITS

        const limits = {

            Free: 1,

            Bronze: 3,

            Silver: 5,

            Gold: Infinity

        }

        const maxLimit = limits[user.plan]

        // CHECK LIMIT

        if(user.applicationsUsed >= maxLimit) {

            return res.status(403).json({

                message:
                "Application limit reached for your plan"

            })

        }

        // INCREASE APPLICATION COUNT

        user.applicationsUsed += 1

        await user.save()

        res.status(200).json({

            message:
            "Internship Applied Successfully",

            applicationsUsed:
            user.applicationsUsed,

            remaining:
            maxLimit === Infinity
            ? "Unlimited"
            : maxLimit - user.applicationsUsed

        })

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

router.post("/send-otp", async (req, res) => {

    try {

        const user = await User.findById(req.body.userId)

        if(!user) {

            return res.status(404).json({
                message: "User Not Found"
            })

        }

        // PREMIUM CHECK

        if(
    user.plan !== "Bronze" &&
    user.plan !== "Silver" &&
    user.plan !== "Gold"
) {

    return res.status(403).json({

        message:
        "Resume feature available only for premium users"

    })

}

        // GENERATE 6 DIGIT OTP

        const otp =
        Math.floor(100000 + Math.random() * 900000)

        // SAVE OTP

        user.otp = otp.toString()

        user.otpExpires =
        new Date(Date.now() + 5 * 60 * 1000)

        await user.save()

        // SEND EMAIL

        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: user.email,

            subject: "Resume Verification OTP",

            text:
            `Your OTP for resume payment verification is ${otp}`

        })

        res.status(200).json({

            message:
            "OTP Sent Successfully"

        })

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

router.post("/verify-otp", async (req, res) => {

    try {

        const user = await User.findById(req.body.userId)

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

        // CLEAR OTP AFTER SUCCESS

        user.otp = null

        user.otpExpires = null

        await user.save()

        res.status(200).json({

            message:
            "OTP Verified Successfully"

        })

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

router.put("/resume-payment", async (req, res) => {

    try {

        const user = await User.findById(req.body.userId)

        if(!user) {

            return res.status(404).json({
                message: "User Not Found"
            })

        }

        // PAYMENT SUCCESS SIMULATION

        user.resumePaymentDone = true

        await user.save()

        res.status(200).json({

            message:
            "Resume Payment Successful"

        })

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

router.post("/create-resume", async (req, res) => {

    try {

        const user = await User.findById(req.body.userId)

        if(!user) {

            return res.status(404).json({
                message: "User Not Found"
            })

        }

        // PREMIUM PLAN CHECK

        if(
    user.plan !== "Bronze" &&
    user.plan !== "Silver" &&
    user.plan !== "Gold"
) {

    return res.status(403).json({

        message:
        "Resume feature available only for premium users"

    })

}

        if(!user.resumePaymentDone) {

            return res.status(403).json({

                message:
                "Complete ₹50 payment before creating resume"

            })

        }

        // STORE RESUME

        user.resume = {

            name: req.body.name,

            qualification:
            req.body.qualification,

            experience:
            req.body.experience,

            skills:
            req.body.skills,

            photo:
            req.body.photo

        }

        await user.save()

        res.status(200).json({

            message:
            "Resume Created/Updated Successfully",

            resume:
            user.resume

        })

    }

    catch(error) {

        res.status(500).json({
            message: error.message
        })

    }

})

router.get("/key", (req, res) => {

    res.status(200).json({

        key: process.env.RAZORPAY_KEY_ID

    })

})

module.exports = router