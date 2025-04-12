const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store connected users (simple map of socket.id to username)
const users = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('A user joined:', socket.id);

  // Ask user for their name
  socket.on('setUsername', (username) => {
    users[socket.id] = username; // Save username
    io.emit('userList', Object.values(users)); // Send updated user list to everyone
    socket.emit('message', `Welcome, ${username}!`);
  });

  // Handle private messages
  socket.on('privateMessage', ({ to, message }) => {
    const sender = users[socket.id];
    const recipientSocketId = Object.keys(users).find(
      (id) => users[id] === to
    );
    if (recipientSocketId) {
      // Send to recipient
      io.to(recipientSocketId).emit('message', `${sender}: ${message}`);
      // Send back to sender (so they see their own message)
      socket.emit('message', `${sender}: ${message}`);
    } else {
      socket.emit('message', `Error: ${to} not found`);
    }
  });

  // Clean up when user leaves
  socket.on('disconnect', () => {
    console.log('User left:', socket.id);
    delete users[socket.id];
    io.emit('userList', Object.values(users)); // Update user list
  });
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});