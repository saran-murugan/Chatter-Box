const express = require("express");
const PORT = 3000 || process.env.PORT;
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const messageFormat = require('./utils/message');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//get static folders
app.use(express.static(path.join(__dirname,'public')));
const botName = 'chatterBox Bot';
/* <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> */

//run when client connects
io.on("connection", socket => {

    socket.on('joinRoom', ({username,room}) => {
        const user = userJoin(socket.id,username,room);

        socket.join(user.room);
        
        //welcome the current user only
        socket.emit('message',messageFormat(botName,"Welcome to chatterBox"));
        
        //broadcast to all except the current user
        socket.broadcast
        .to(user.room)
        .emit('message',messageFormat(botName,`${user.username} has joined the room`)
        );

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room:user.room,
            users:getRoomUsers(user.room)
        });
    });

    //listen for chatMessage
    socket.on('chatMessage',(msg)=>{
        const user = getCurrentUser(socket.id)
        io.to(user.room).emit('message', messageFormat(user.username,msg));
    });

    //runs when client disconnects
    socket.on("disconnect", () => {
        const user = userLeave(socket.id);
        if(user){
        io.to(user.room).emit('message',messageFormat(botName,`${user.username} has left the room`)
        );
        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room:user.room,
            users:getRoomUsers(user.room)
        });
        }
    })
});



/* <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>  */
server.listen(PORT , () => {
    console.log(`The server is running on port ${PORT}`);
})