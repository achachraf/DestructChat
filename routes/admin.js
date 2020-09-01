const adminAuth = require("../middleware/adminAuth");
const router = require("express").Router();

const {
  getUsers,
  removeUser,
  getUsersByRoomId,
  removeUsersInRoom,
} = require("../data/users");
const { disconnectSocket } = require("../socket");
const {
  getRooms,
  removeRoom,
} = require("../data/rooms");

router.get("/", adminAuth, (req, res) => {
  const users = getUsers();
  return res.render("dashboard/users", { users });
});

router.get("/rooms", adminAuth, (req, res) => {
  const rooms = getRooms();
  return res.render("dashboard/rooms", { rooms });
});

router.get("/room/:roomId", adminAuth, (req, res) => {
  const { roomId } = req.params;
  const users = getUsersByRoomId(roomId);
  if (!users) return res.render("/users", { error: "Room Not Found" });
  return res.render("dashboard/users", { users });
});

router.delete("/user", adminAuth, (req, res) => {
  const id = req.body.id;
  //removeUser(id);
  disconnectSocket(id);
  return res.status(200).send();
});

router.delete("/room/", adminAuth, (req, res) => {
  const { roomId } = req.body;
  if (!removeRoom(roomId)) {
    return res.render("error", { error: "Room Not Found" });
  }
  removeUsersInRoom(roomId);
  const users = getUsersByRoomId(roomId);
  for (let user of users) {
    disconnectSocket(user.id);
  }
  return res.status(200).send();
});

module.exports = router;
