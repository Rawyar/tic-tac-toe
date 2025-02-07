const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("A player connected:", socket.id);

  if (!waitingPlayer) {
    waitingPlayer = socket;
    socket.emit("message", "Waiting for an opponent...");
  } else {
    const player1 = waitingPlayer;
    const player2 = socket;

    player1.emit("startGame", { symbol: "X" });
    player2.emit("startGame", { symbol: "O" });

    player1.opponent = player2;
    player2.opponent = player1;

    waitingPlayer = null;
  }

  socket.on("makeMove", (data) => {
    if (socket.opponent) {
      socket.opponent.emit("opponentMove", data);
    }
  });

  socket.on("restartGame", () => {
    if (socket.opponent) {
      socket.opponent.emit("restartGame");
    }
  });

  socket.on("disconnect", () => {
    console.log("A player disconnected:", socket.id);
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }
    if (socket.opponent) {
      socket.opponent.emit("message", "Your opponent left the game.");
      socket.opponent.opponent = null;
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
