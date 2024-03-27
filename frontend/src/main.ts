import { io, Socket } from "socket.io-client";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  VirusPosition,
  ScoreData,
  GameEndedData,
} from "@shared/types/SocketTypes";
import "./assets/scss/style.scss";

const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;

const moveOnwaitRoomButtonEl = document.querySelector(
  "#connectBtn"
) as HTMLButtonElement;
const nickNameInput = document.querySelector(
  "#nickname-input"
) as HTMLInputElement;
const waitingScreen = document.querySelector("#lobby") as HTMLDivElement;
const playingRoom = document.querySelector("#game-wrapper") as HTMLDivElement;
const clickSound = document.getElementById(
  "clickSound"
) as HTMLAudioElement | null;

const yourTimeElement: HTMLElement | null =
  document.getElementById("player1-time");
const opponentTimeElement: HTMLElement | null =
  document.getElementById("player2-time");
const intervalMap: Map<HTMLElement, boolean> = new Map();

const player1NameElement = document.getElementById(
  "player1-name"
) as HTMLDivElement;
const player2NameElement = document.getElementById(
  "player2-name"
) as HTMLDivElement;

document.addEventListener("DOMContentLoaded", () => {
  const nicknameInput: HTMLInputElement = document.getElementById(
    "nickname-input"
  ) as HTMLInputElement;
  const connectBtn: HTMLButtonElement = document.getElementById(
    "connectBtn"
  ) as HTMLButtonElement;

  nicknameInput.addEventListener("input", () => {
    connectBtn.disabled = nicknameInput.value.trim() === "";
  });
});

// Connect to Socket.IO Server
console.log("Connecting to Socket.IO Server at:", SOCKET_HOST);
const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(SOCKET_HOST);

// Listen for when connection is established
socket.on("connect", () => {
  console.log("💥 Connected to the server", SOCKET_HOST);
  console.log("🔗 Socket ID:", socket.id);

  showStartRoom();
});

socket.emit("requestHighscoreAndMatchHistory");

// Show start room
const showStartRoom = () => {
  const nicknameScreen = document.getElementById("nickname");
  if (nicknameScreen) {
    nicknameScreen.classList.remove("hide");
  } else {
    console.error("Nickname skärmen kunde inte hittas i DOM");
  }
  waitingScreen.classList.add("hide");
  playingRoom.classList.add("hide");

  const gameTitleContainer = document.getElementById("game-title");
  if (gameTitleContainer) {
    gameTitleContainer.style.display = "none";
  }
  const showNickname = document.getElementById("nickname-form");
  if (showNickname) {
    showNickname.style.display = "block";
  }

  const highscoreStart = document.getElementById("highscoreContainer");
  if (highscoreStart) {
    highscoreStart.style.display = "block";
  }
};

// show waitingroom
const showWaitingRoom = (nickname: string) => {
  const nicknameScreen = document.getElementById("nickname");
  if (nicknameScreen) {
    nicknameScreen.classList.add("hide");
  }

  waitingScreen.classList.remove("hide");

  playingRoom.classList.add("hide");

  const messageElement = document.getElementById(
    "message"
  ) as HTMLParagraphElement;
  if (messageElement) {
    messageElement.textContent =
      "Waiting for another player to join the game...";
  } else {
    console.error("Elementet för meddelandet kunde inte hittas.");
  }

  const gameTitleContainer = document.getElementById("game-title");
  if (gameTitleContainer) {
    gameTitleContainer.style.display = "none";
  }
  const hideLobby = document.getElementById("lobby");
  if (hideLobby) {
    hideLobby.style.display = "block";
  }
  const showNickname = document.getElementById("nickname-form");
  if (showNickname) {
    showNickname.style.display = "none";
  }

  const playerListItem = document.createElement("li");
  playerListItem.textContent = nickname;

  const playersList = document.getElementById("players");

  if (playersList) {
    playersList.appendChild(playerListItem);
  } else {
    console.error("Elementet för spelarlistan kunde inte hittas.");
  }
  const highscoreMatches = document.getElementById("highscoreContainer");
  if (highscoreMatches) {
    highscoreMatches.style.display = "none";
  }
};

//show playingroom
const showPlayingRoom = () => {
  const nicknameScreen = document.getElementById("nickname");
  if (nicknameScreen) {
    nicknameScreen.classList.add("hide");
  }
  waitingScreen.classList.add("hide");

  playingRoom.classList.remove("hide");

  if (yourTimeElement && opponentTimeElement) {
    startTimer(yourTimeElement);
    startTimer(opponentTimeElement);
  }
  const gameTitleContainer = document.getElementById("game-title");
  if (gameTitleContainer) {
    gameTitleContainer.style.display = "block";
  }

  const showNickname = document.getElementById("nickname-form");
  if (showNickname) {
    showNickname.style.display = "none";
  }

  const highscoreMatches = document.getElementById("highscoreContainer");
  if (highscoreMatches) {
    highscoreMatches.style.display = "none";
  }

  const hideLobby = document.getElementById("lobby");
  if (hideLobby) {
    hideLobby.style.display = "none";
    hideLobby.style.display = "none";
    hideLobby.innerHTML = "";
    hideLobby.style.border = "none";
    hideLobby.style.paddingTop = "40px";
  }

  socket.on("updateFrontendScore", (data) => {
    const playerOneScoreElement = document.getElementById("player1-score");
    if (playerOneScoreElement) {
      playerOneScoreElement.textContent = data.playerOneScore.toString();
    }

    const playerTwoScoreElement = document.getElementById("player2-score");
    if (playerTwoScoreElement) {
      playerTwoScoreElement.textContent = data.playerTwoScore.toString();
    }
  });
};

socket.on("updateHighscore", (highscores) => {
  const list = document.getElementById("highscoreList") as HTMLUListElement;
  list.innerHTML = "";
  highscores.forEach((score) => {
    const item = document.createElement("li");
    item.innerHTML = `
    ${score.nickname}: <strong>${score.averageReactionMs} </strong> ms `;
    list.appendChild(item);
  });
});

socket.on("updateMatchHistory", (matchHistory) => {
  const list = document.getElementById("matchHistoryList") as HTMLUListElement;
  if (!list) {
    console.error("The matchHistoryList element was not found.");
    return;
  }
  if (!matchHistory || matchHistory.length === 0) {
    // Hantera fall då matchHistory är null eller tom.
    list.innerHTML = "<li>No match history available.</li>";
    return;
  } else {
    list.innerHTML = ""; // Rensa befintlig lista
    matchHistory.forEach((match) => {
      const item = document.createElement("li");
      item.innerHTML = `${match.playerOne || "Unknown"} ${
        match.playerOneScore
      } - ${match.playerTwo || "Unknown"} ${match.playerTwoScore} ms<br>
      Winner:<strong> ${match.winner || "No winner"}</strong>`;
      list.appendChild(item);
    });
  }
});

let startTime: number;

function startTimer(timerElement: HTMLElement): void {
  intervalMap.set(timerElement, true);
  console.log("Start timer: " + timerElement.innerHTML);

  window.setInterval(() => {
    let seconds: number = timerElement
      ? parseInt(timerElement.innerText, 10)
      : 0;
    seconds++;
    const keepRunning = intervalMap.get(timerElement);

    if (seconds == 30 && keepRunning) {
      setTimer(timerElement, false);
      if (timerElement == yourTimeElement) {
        virusClick();
      }
    }

    if (seconds <= 30 && keepRunning) {
      const secondsFormatted: string = seconds.toString();
      timerElement.textContent = `${secondsFormatted}`;
    }
  }, 1000);
}

socket.on("connect", () => {
  console.log("Connected to the server", SOCKET_HOST);
  showStartRoom();
});

function setTimer(timerElement: HTMLElement, run: boolean): void {
  if (timerElement !== undefined) {
    intervalMap.set(timerElement, run);
  }
}

function resetTimers(): void {
  if (yourTimeElement !== null && opponentTimeElement !== null) {
    yourTimeElement.innerText = "00";
    opponentTimeElement.innerText = "00";
    startTime = Date.now();
    setTimer(yourTimeElement, true);
    setTimer(opponentTimeElement, true);
  }
}

socket.on("otherRegisterClick", (time) => {
  console.log("Andra spelarens klick:" + time);
  if (opponentTimeElement) {
    setTimer(opponentTimeElement, false);
    opponentTimeElement.innerText = (time / 1000).toString();
  } else {
    console.error("The opponent's timer element was not found.");
  }
});

socket.on("UpdateLobby", (players: string[]) => {
  console.log("Lobby updated with players:", players);
  updateLobby(players);
});

const updateLobby = (players: string[]) => {
  const lobbyList = document.getElementById("player-list");

  players.forEach((player, index) => {
    const playerElement = document.createElement("li");
    playerElement.textContent = player;
    lobbyList?.appendChild(playerElement);

    if (index === 0) {
      player1NameElement.textContent = player;
    } else if (index === 1) {
      player2NameElement.textContent = player;
    }
  });

  if (players.length == 2) {
    console.log("Show playing room from UpdateLobby");
    showPlayingRoom();
  }
};

socket.on("OtherPlayerJoined", (response) => {
  if (!response.success) {
    console.log("Error when other player joined");
  }

  console.log("UpdateLobby otherplayerjoined");
  updateLobby(response.nicknames);
});

function isPlayerMe(name: string) {
  return nickNameInput.value.trim() == name.trim();
}
socket.on("PlayerJoined", (data) => {
  displayPlayerNames(data.player1name, data.player2name);
});

socket.on("updateFrontendScore", (data) => {
  const playerOneScoreElement = document.getElementById("player1-score");
  if (playerOneScoreElement) {
    playerOneScoreElement.textContent = data.playerOneScore.toString();
  }

  const playerTwoScoreElement = document.getElementById("player2-score");
  if (playerTwoScoreElement) {
    playerTwoScoreElement.textContent = data.playerTwoScore.toString();
  }
});

// Listen for when server got tired of us
socket.on("disconnect", () => {
  console.log("💀 Disconnected from the server:", SOCKET_HOST);
});

// Listen for when we're reconnected (either due to our or the servers connection)
socket.io.on("reconnect", () => {
  console.log("🍽️ Reconnected to the server:", SOCKET_HOST);
  console.log("🔗 Socket ID:", socket.id);
});

moveOnwaitRoomButtonEl.addEventListener("click", (e) => {
  e.preventDefault();

  const trimmedNickname = nickNameInput.value.trim();

  if (!trimmedNickname) {
    return;
  }

  //Ansluter till serven
  socket.emit("JoinTheGame", trimmedNickname, (response) => {
    console.log("JoinTheGame: Join was successful", response.success);

    if (response.player1name && response.player2name) {
      displayPlayerNames(response.player1name, response.player2name);
    } else {
    }

    showWaitingRoom(trimmedNickname!);

    const gameTitleContainer = document.getElementById("game-title");
    if (gameTitleContainer) {
      gameTitleContainer.style.display = "block";
    }
  });
});

function displayPlayerNames(player1name: string, player2name: string) {
  const player1NameElement = document.getElementById("player1-name");
  const player2NameElement = document.getElementById("player2-name");

  if (isPlayerMe(player1name)) {
    if (player1NameElement) player1NameElement.textContent = player1name;
    if (player2NameElement) player2NameElement.textContent = player2name;
  } else {
    if (player1NameElement) player1NameElement.textContent = player2name;
    if (player2NameElement) player2NameElement.textContent = player1name;
  }
}

socket.on("positionVirus", (data: VirusPosition, roomId: string) => {
  console.log(`Virus position received for room ${roomId}:`, data.x, data.y);
  showVirus(data.x, data.y);
});

function virusClick() {
  console.log("Virus klickad!");
  removeVirus();

  if (clickSound !== null) {
    clickSound.play();
  }

  if (yourTimeElement !== null) {
    setTimer(yourTimeElement, false);
    const timerValue = Date.now() - startTime;
    console.log(timerValue);
    if (yourTimeElement) {
      yourTimeElement.innerText = (timerValue / 1000).toString();
    }
    socket.emit("registerClick", timerValue);
  } else {
    console.error("The element #player1-time was not found.");
  }
}

function removeVirus() {
  const virusImg = document.getElementById("virusImage");
  if (virusImg) {
    virusImg.remove();
  }
}

socket.on("newRound", (round) => {
  const roundCounter = document.getElementById("round");
  if (roundCounter) {
    roundCounter.textContent = `Round: ${round}`;
  }
  resetTimers();
});

socket.on("winnerOfRound", (winner) => {
  console.log("Winner of round:", winner);
});

// Lyssna efter uppdateringar från servern
socket.on("updateScore", (data: ScoreData) => {
  if (data.scores) {
    const player1ScoreEl = document.getElementById("player1-score");
    const player2ScoreEl = document.getElementById("player2-score");

    if (player1ScoreEl && player2ScoreEl) {
      player1ScoreEl.textContent = data.scores.player1.toString();
      player2ScoreEl.textContent = data.scores.player2.toString();
    }

    if (data.highscore) {
      const { player, score } = data.highscore;
      const highscoreListElement = document.getElementById("highscoreList");
      if (highscoreListElement) {
        highscoreListElement.innerHTML = `<p>${player} - ${score} sek </p>`;
      }
    }
  }
});

function showVirus(x: number, y: number) {
  const virusImg = document.createElement("img");
  virusImg.src = "/images/virus.png";
  virusImg.alt = "ugly green virus";
  virusImg.setAttribute("id", "virusImage");
  console.log("bild", virusImg);

  virusImg.style.gridColumnStart = `${x}`;
  virusImg.style.gridRowStart = `${y}`;
  console.log(`Virus position: ${x}, ${y}`);
  console.log(`Virus style: ${virusImg.style}`);

  const gameBoard = document.getElementById("gameBoard");
  if (!gameBoard) {
    console.error("unable to find gameBoard element");
  } else {
    gameBoard.appendChild(virusImg);
  }
  startTime = Date.now();

  if (virusImg) {
    virusImg.addEventListener("click", virusClick);
  }
}

function updateFrontend(data: GameEndedData): void {
  document.getElementById(
    "winner"
  )!.textContent = `The winner is ${data.winner} !`;
}

const customConfirm = document.getElementById("custom-confirm");

document.getElementById("rematch-yes")!.addEventListener("click", () => {
  if (customConfirm) {
    customConfirm.style.display = "none";
  }

  const showNickname = document.getElementById("nickname-form");
  if (showNickname) {
    showNickname.style.display = "block";
  }

  const gameWrap = document.getElementById("game-wrapper");
  if (gameWrap) {
    gameWrap.style.display = "none";
  }

  location.reload();

  const nicknameDiv = document.getElementById("nickname");
  if (nicknameDiv) {
    nicknameDiv.classList.remove("hide");
    nicknameDiv.scrollIntoView({ behavior: "smooth" });
  }
});

document.getElementById("rematch-no")!.addEventListener("click", () => {
  if (customConfirm) {
    customConfirm.style.display = "none";

    const gifImage = document.getElementById("gif-image");
    if (gifImage) {
      gifImage.classList.remove("hide");
    }
    const fullscreenOverlay = document.getElementById("fullscreen-overlay");
    if (fullscreenOverlay) {
      fullscreenOverlay.classList.remove("hide");
    }
  }
});

socket.on("gameEnded", (data: GameEndedData) => {
  console.log("Game Ended Data:", data);
  updateFrontend(data);

  if (customConfirm) {
    customConfirm.classList.remove("hide");
  }
});
