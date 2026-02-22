// server.js
const WebSocket = require("ws");

// サーバーポート
const PORT = process.env.PORT || 10000;

// マップサイズ
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;

// プレイヤー情報
let players = {}; // { id: {x, y, weapon, color} }

// guest0001 AI
let guest0001 = { x: 5, y: 5, color: "#00ffff", weapon: "shooter" };

// WebSocketサーバー
const wss = new WebSocket.Server({ port: PORT });

// 全員にデータ送信
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(msg);
  });
}

// guest0001 の自作AI
function moveGuest() {
  const playerList = Object.values(players);
  if (playerList.length === 0) return;
  const target = playerList[0]; // 一番最初のプレイヤーを狙う

  // X軸移動
  if (guest0001.x < target.x) guest0001.x++;
  else if (guest0001.x > target.x) guest0001.x--;

  // Y軸移動
  if (guest0001.y < target.y) guest0001.y++;
  else if (guest0001.y > target.y) guest0001.y--;

  // 近くにいれば攻撃（簡易）
  if (Math.abs(guest0001.x - target.x) <= 1 && Math.abs(guest0001.y - target.y) <= 1) {
    console.log("guest0001 attacks!");
  }
}

// 0.1秒ごとに状態更新
setInterval(() => {
  moveGuest();
  broadcast({ type: "update", players, guest0001 });
}, 100);

// プレイヤーが接続したとき
wss.on("connection", ws => {
  const id = Date.now() + Math.random();
  players[id] = { x: 1, y: 1, weapon: "shooter", color: "#ff0000" };

  // 初期情報送信
  ws.send(JSON.stringify({ type: "init", id, MAP_WIDTH, MAP_HEIGHT, guest0001 }));

  // メッセージ受信
  ws.on("message", message => {
    try {
      const data = JSON.parse(message);

      // 移動
      if (data.type === "move") {
        const p = players[id];
        if (data.dx) p.x += data.dx;
        if (data.dy) p.y += data.dy;
        if (p.x < 0) p.x = 0;
        if (p.x > MAP_WIDTH - 1) p.x = MAP_WIDTH - 1;
        if (p.y < 0) p.y = 0;
        if (p.y > MAP_HEIGHT - 1) p.y = MAP_HEIGHT - 1;
      }

      // 武器変更
      if (data.type === "weapon") {
        players[id].weapon = data.weapon;
      }
    } catch (e) {
      console.log("Error parsing message", e);
    }
  });

  // 切断時
  ws.on("close", () => {
    delete players[id];
  });
});

console.log("Splatoon battle server running on port", PORT);
