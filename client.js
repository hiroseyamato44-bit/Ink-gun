const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let camera = { x:0, y:0 };
let joystickDirection = { dx:0, dy:0 };

const socket = new WebSocket("wss://[RenderサーバーURL]");

let playerId;
let MAP_WIDTH, MAP_HEIGHT;
let players = {};
let guest0001 = {};
let inkMap = [];

// 初期化マップ
function initInkMap() {
  for(let y=0; y<30; y++){
    inkMap[y] = [];
    for(let x=0; x<40; x++){
      inkMap[y][x] = null;
    }
  }
}

initInkMap();

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if(data.type==="init"){
    playerId = data.id;
    MAP_WIDTH = data.MAP_WIDTH;
    MAP_HEIGHT = data.MAP_HEIGHT;
    guest0001 = data.guest0001;
  } else if(data.type==="update"){
    players = data.players;
    guest0001 = data.guest0001;
  }
};

// 移動送信
function sendMove(dx,dy){
  socket.send(JSON.stringify({ type:"move", dx, dy }));
}
function sendWeapon(weapon){
  socket.send(JSON.stringify({ type:"weapon", weapon }));
}

// 武器ボタン
document.getElementById("weapon").onclick = ()=>sendWeapon("roller");

// nipplejs でジョイスティック作成
const joystick = nipplejs.create({
  zone: document.getElementById('joystick'),
  mode: 'static',
  position: { left: '75px', bottom: '75px' },
  color: 'blue',
  size: 100
});

joystick.on('move', function(evt, data) {
  const angle = data.angle ? data.angle.degree : 0;
  const dist = data.distance ? data.distance : 0;
  joystickDirection.dx = Math.round(Math.cos(angle*Math.PI/180)*Math.min(1, dist/50));
  joystickDirection.dy = Math.round(Math.sin(angle*Math.PI/180)*Math.min(1, dist/50));
});

joystick.on('end', function(){ joystickDirection = { dx:0, dy:0 }; });

// 描画ループ
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const cellW = canvas.width / MAP_WIDTH;
  const cellH = canvas.height / MAP_HEIGHT;

  ctx.save();
  ctx.translate(-camera.x, -camera.y);

  // インク描画
  for(let y=0; y<MAP_HEIGHT; y++){
    for(let x=0; x<MAP_WIDTH; x++){
      if(inkMap[y][x]){
        ctx.fillStyle = inkMap[y][x];
        ctx.fillRect(x*cellW, y*cellH, cellW, cellH);
      }
    }
  }

  // プレイヤー描画
  for(let id in players){
    const p = players[id];
    if(p.x<0)p.x=0; if(p.x>MAP_WIDTH-1)p.x=MAP_WIDTH-1;
    if(p.y<0)p.y=0; if(p.y>MAP_HEIGHT-1)p.y=MAP_HEIGHT-1;

    if(p.weapon==="roller") inkMap[p.y][p.x] = p.color;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x*cellW, p.y*cellH, cellW, cellH);
  }

  // guest0001描画
  ctx.fillStyle = guest0001.color;
  ctx.fillRect(guest0001.x*cellW, guest0001.y*cellH, cellW, cellH);

  ctx.restore();
  requestAnimationFrame(draw);
}

draw();

// joystick方向に移動送信（0.1秒ごと）
setInterval(()=>{
  if(joystickDirection.dx!==0 || joystickDirection.dy!==0){
    sendMove(joystickDirection.dx, joystickDirection.dy);
  }
}, 100);
