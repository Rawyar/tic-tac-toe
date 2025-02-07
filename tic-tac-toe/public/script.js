const socket = io();
let mySymbol = "";
let myTurn = false;
let boardState = ["", "", "", "", "", "", "", "", ""];

const statusText = document.getElementById("status");
const cells = document.querySelectorAll(".cell");
const restartButton = document.getElementById("restart");

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Columns
  [0, 4, 8],
  [2, 4, 6], // Diagonals
];

socket.on("message", (msg) => {
  statusText.innerText = msg;
});

socket.on("startGame", (data) => {
  mySymbol = data.symbol;
  myTurn = mySymbol === "X";
  statusText.innerText = myTurn ? "Your turn!" : "Waiting for opponent...";
});

socket.on("opponentMove", (data) => {
  boardState[data.index] = data.symbol;
  cells[data.index].innerText = data.symbol;
  cells[data.index].classList.add("taken");

  if (checkWin(data.symbol)) {
    statusText.innerText = `Player ${data.symbol} wins!`;
    disableBoard();
    return;
  }

  if (boardState.every((cell) => cell !== "")) {
    statusText.innerText = "It's a draw!";
    return;
  }

  myTurn = true;
  statusText.innerText = "Your turn!";
});

cells.forEach((cell, index) => {
  cell.addEventListener("click", () => {
    if (!myTurn || cell.classList.contains("taken")) return;

    cell.innerText = mySymbol;
    cell.classList.add("taken");
    boardState[index] = mySymbol;

    if (checkWin(mySymbol)) {
      statusText.innerText = `You win!`;
      disableBoard();
      socket.emit("makeMove", { index, symbol: mySymbol });
      return;
    }

    if (boardState.every((cell) => cell !== "")) {
      statusText.innerText = "It's a draw!";
      socket.emit("makeMove", { index, symbol: mySymbol });
      return;
    }

    socket.emit("makeMove", { index, symbol: mySymbol });
    myTurn = false;
    statusText.innerText = "Waiting for opponent...";
  });
});

function checkWin(symbol) {
  return winningCombinations.some((combination) =>
    combination.every((index) => boardState[index] === symbol)
  );
}

function disableBoard() {
  cells.forEach((cell) => cell.classList.add("taken"));
}

restartButton.addEventListener("click", () => {
  boardState = ["", "", "", "", "", "", "", "", ""];
  cells.forEach((cell) => {
    cell.innerText = "";
    cell.classList.remove("taken");
  });
  statusText.innerText = "Waiting for opponent...";
  socket.emit("restartGame");
});

socket.on("restartGame", () => {
  boardState = ["", "", "", "", "", "", "", "", ""];
  cells.forEach((cell) => {
    cell.innerText = "";
    cell.classList.remove("taken");
  });
  statusText.innerText = "Game restarted!";
});
