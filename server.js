const cors = require("cors")
const express = require("express")
const mongoose = require("mongoose")
require("dotenv").config()

const userRoutes = require("./routes/userRoutes")
const postRoutes = require("./routes/postRoutes")
const subscriptionRoutes = require("./routes/subscriptionRoutes")

const app = express()

app.use(express.json())
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://community-platform-frontend-eosin.vercel.app"
        ],
        credentials: true
    })
)
app.use("/api/users", userRoutes)
app.use("/api/subscriptions", subscriptionRoutes)
app.use("/api/posts", postRoutes)

mongoose.connect(process.env.MONGO_URL)
.then(() => {
    console.log("MongoDB Connected")
})
.catch((error) => {
    console.log(error)
})

app.get("/", (req, res) => {
    res.send("Community Project Running")
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {

    console.log(`Server started on port ${PORT}`)

})