const express = require("express")
const socketio = require("socket.io")
const path = require("path")
const http = require("http");
const https = require("https")
const runSocket = require("./socket").runsocket
const fs = require("fs")

// var certOptions = {
//     key: fs.readFileSync(path.resolve('certificates/localhost.key')),
//     cert: fs.readFileSync(path.resolve('certificates/localhost.cert'))
// }

const app = express();
const server = http.createServer(app);
// const server = https.createServer(certOptions,app)
const io = socketio(server);

//set template engine
app.set('view engine', 'ejs');


// app.use(bodyParser.json())
app.use(express.json({extended:false}))
app.use(express.urlencoded({extended:true}))

app.use(express.static(path.join(__dirname,"public")))


app.get("/",(req,res)=>{
    const ip = req.connection.remoteAddress
    console.log(ip)
    return res.render("index")
})

app.use("/users",require("./routes/users"))
app.use("/admin",require("./routes/admin"))
// app.use("/test",require("./routes/test"))


runSocket(io)

const PORT = process.env.PORT ||3000

server.listen(PORT,()=>{
    console.log("server is running on port "+PORT)
})

