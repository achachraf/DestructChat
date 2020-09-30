const adminAuth = require("../middleware/adminAuth");
const router = require("express").Router();
const fs = require("fs")
const {
  getUsers,
  removeUser,
  getUsersByRoomId,
  removeUsersInRoom,
} = require("../data/users");
const { disconnectSocket,emitAlert } = require("../socket");
const {
  getRooms,
  removeRoom,
} = require("../data/rooms");
const { route } = require("./users");


//get users
router.get("/", adminAuth, (req, res) => {
  const users = getUsers();
  return res.render("dashboard/users", { users });
});


//get roomd
router.get("/rooms", adminAuth, (req, res) => {
  const rooms = getRooms();
  return res.render("dashboard/rooms", { rooms });
});


//get room by ID
router.get("/room/:roomId", adminAuth, (req, res) => {
  const { roomId } = req.params;
  const users = getUsersByRoomId(roomId);
  if (!users) return res.render("/users", { error: "Room Not Found" });
  return res.render("dashboard/users", { users });
});


//remove user
router.delete("/user", adminAuth, (req, res) => {
  const id = req.body.id;
  emitAlert(id,"You've been kicked from the chat")
  disconnectSocket(id);
  return res.status(200).send();
});


// remove room 
router.delete("/room/", adminAuth, (req, res) => {
  const { roomId } = req.body;
  if (!removeRoom(roomId)) {
    return res.render("error", { error: "Room Not Found" });
  }
  removeUsersInRoom(roomId);
  const users = getUsersByRoomId(roomId);
  for (let user of users) {
    emitAlert(user.id,"You've been kicked from the chat")
    disconnectSocket(user.id);
  }
  
  return res.status(200).send();
});

// get log
router.get("/log/",adminAuth,(req,res)=>{
  let data = fs.readFileSync("logs.txt","utf8");
  const reg = /\n/g
  data = data.replace(reg,"<br>")
  return res.send(data);
  // return res.sendFile(__dirname+"/../logs.txt")
})

module.exports = router;
