const http = require('http');
const WebSocket = require('ws');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 10000;

let players = {};
let guest0001 = { x: 5, y: 5, color: "purple", weapon: "shooter" };

// 接続時処理
wss.on('connection', (ws) => {
  const playerId = "player" + Date.now();
  players[playerId] = { x: 0, y: 0, color: "orange", weapon: "roller" };

  ws.send(JSON.stringify({ type: "init", id: playerId, guest0001 }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if(data.type === "move"){
      players[playerId].x += data.dx;
      players[playerId].y += data.dy;
    } else if(data.type === "weapon"){
      players[playerId].weapon = data.weapon;
    }
  });

  ws.on('close', () => {
    delete players[playerId];
  });
});

// 60fpsで更新を全員に送信
setInterval(() => {
  const state = { type: "update", players, guest0001 };
  wss.clients.forEach(client => {
    if(client.readyState === WebSocket.OPEN){
      client.send(JSON.stringify(state));
    }
  });
}, 1000/60);

server.listen(PORT, () => {
  console.log(`Splatoon battle server running on port ${PORT}`);
});
