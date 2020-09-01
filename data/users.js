const {removeMember} = require("./rooms")

let users = [];


function getUsers() {
  return users;
}

function addUser(user) {
  users.push(user);
}

function updateUser(user) {
  if (!getUserByUsername(user.username)) return null;
  let newUser;
  users = users.map((usr) => {
    if (usr.username === user.username) {
      newUser = { ...usr, id: user.id };
      return newUser;
    } else return usr;
  });
  return newUser;
}

function removeUser(id) {
 
  return (users = users.filter((user) => {
    if(user.id === id){
      removeMember(user.roomId)
      return false
    }
    return true
    
  }));
}

function getUserById(id) {

  return users.find((user) => user.id === id);
}

function getUserByUsername(username) {
  return users.find((user) => user.username === username);
}

function userPOSTED({ username, roomId }) {
  return users.find(
    (user) =>
    user.roomId === roomId && user.id === null && user.username === username 
  );
}

function userExist({ username, roomId }) {
  return users.find(
    (user) =>
      user.username === username && user.id !== null && user.roomId === roomId
  );
}
function userInRoom(username,roomId){
    return users.find(
        (user) =>
          user.username === username && user.roomId === roomId
      );
}

function getUsersByRoomId(roomId){
  return users.filter(user=>user.roomId === roomId)
}

function removeUsersInRoom(roomId){
  users = users.filter(user=>user.roomId !== roomId)
}

function getUserPrivateKey(username){
  let user = users.find(user=>user.username == username)
  if(user) return user.rsaKeys.privateKey
  return null;
}

function isCreator(username){
  return users.find(user=>user.username === username).creator
}

function getCreator(roomId){
  return users.find(user=>user.roomId === roomId && user.creator === true)
}

module.exports = {
  addUser,
  updateUser,
  getUserById,
  getUserByUsername,
  userPOSTED,
  userExist,
  removeUser,
  getUsers,
  userInRoom,
  getUsersByRoomId,
  removeUsersInRoom,
  getUserPrivateKey,
  getCreator,
  isCreator
};
