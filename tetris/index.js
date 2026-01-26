const canvas = document.getElementById("cnv");
const canvasHeight = canvas.height;
const canvasWidth = canvas.width;
const cols = 10;
const rows = 20;
const blockWidth = canvasWidth / cols;
const blockHeight = canvasHeight / rows;

// tetrominos

const I_BLOCK = {pics: [[0,0], [0,1], [0,2], [0,3]], color: "cyan"};
const J_BLOCK = {pics: [[1,0], [1,1], [1,2], [0,2]], color: "blue"};
const L_BLOCK = {pics: [[0,0], [0,1], [0,2], [1,2]], color: "orange"};
const O_BLOCK = {pics: [[0,0], [0,1], [1,0], [1,1]], color: "yellow"};
const S_BLOCK = {pics: [[0,1], [1,1], [1,0], [2,0]], color: "green"};
const T_BLOCK = {pics: [[0,1], [1,1], [2,1], [1,0]], color: "purple"};
const Z_BLOCK = {pics: [[0,0], [1,1], [1,0], [2,1]], color: "red"};

function drawBlock(block, refPos) {
  const xRef = refPos[0];
  const yRef = refPos[1];
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < 4; i++) {
    xPic = block.pics[i][0] + xRef;
    yPic = block.pics[i][1] + yRef;
    ctx.beginPath();
    ctx.fillStyle = block.color;
    ctx.fillRect(xPic * blockWidth, yPic * blockHeight, blockWidth, blockHeight);
  }
  // TODO use ctx.strokeStyle and ctx.strokeRect for borders
}

function drawBlocks() {
  drawBlock(I_BLOCK, [1, 1]);
  drawBlock(J_BLOCK, [3, 1]);
  drawBlock(L_BLOCK, [6, 1]);
  drawBlock(O_BLOCK, [1, 6]);
  drawBlock(S_BLOCK, [4, 6]);
  drawBlock(T_BLOCK, [1, 10]);
  drawBlock(Z_BLOCK, [5, 9]);
}

function drawBackground() {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  for (let c = 0; c < cols; c++) {
    ctx.beginPath()
    ctx.moveTo(blockWidth * c, 0);
    ctx.lineTo(blockWidth * c, canvasHeight);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "gray";
    ctx.stroke();
  }

  for (let r = 0; r < rows; r++) {
    ctx.beginPath()
    ctx.moveTo(0, blockHeight * r);
    ctx.lineTo(canvasWidth, blockHeight * r);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "gray";
    ctx.stroke();
  }
}

function drawStuff() {
  drawBlocks();
  drawBackground();
}

window.addEventListener("load", drawStuff);
