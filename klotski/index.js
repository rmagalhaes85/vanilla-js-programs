class KlotskiModel {
  state = [
    ['v1', 'q1', 'q1', 'v2'],
    ['v1', 'q1', 'q1', 'v2'],
    ['v3', 'h1', 'h1', 'v4'],
    ['v3', 's1', 's2', 'v4'],
    [ 's3', ' ', ' ', 's4'],
  ];
  listeners = [];
  selectedPiece = 's3';
  possiblePieces = ['v1', 'v2', 'v3', 'v4', 's1', 's2', 's3', 's4', 'q1', 'h1'];

  selectNextMovablePiece() {
    const initialIndex = this.possiblePieces.indexOf(this.selectedPiece);
    let index = initialIndex;
    do {
      if (++index >= this.possiblePieces.length) {
        index = 0;
      }
      this.selectedPiece = this.possiblePieces[index];
    } while (index != initialIndex && !this.canMove(this.selectedPiece, '', this.state));
    this.notifyListeners();
  }

  selectPiece(pieceId) {
    if (this.possiblePieces.indexOf(pieceId) === -1) return;
    this.selectedPiece = pieceId;
    this.notifyListeners();
  }

  getPosition(piece) {
    const board_w = 4;
    const board_h = 5;
    for (let i = 0; i < board_h; i++)
      for (let j = 0; j < board_w; j++)
        if (this.state[i][j] === piece) return { x: j, y: i };
    throw new Error(`Piece not found in state: ${piece}`);
  }

  getDimensions(kind) {
    //const possiblePieces = ['v1', 'v2', 'v3', 'v4', 's1', 's2', 's3', 's4', 'q1', 'h1'];
    if (kind === 'v') return { w: 1, h: 2 };
    if (kind === 's') return { w: 1, h: 1 };
    if (kind === 'q') return { w: 2, h: 2 };
    if (kind === 'h') return { w: 2, h: 1 };
    throw new Error(`Unknown piece kind: ${kind}`);
  }

  canMove(piece, direction) {
    const kind = piece[0];
    const { x, y } = this.getPosition(piece);
    const { w: pw, h: ph } = this.getDimensions(kind);
    const bw = 4;
    const bh = 5;
    if (!direction) {
      direction = 'nesw';
    }
    if (direction.indexOf('n') > -1 && y > 0) {
      let northIsEmpty = true;
      for (let i = 0; i < pw; ++i) {
        northIsEmpty &= this.state[y - 1][x + i] === ' ';
      }
      if (northIsEmpty) return true;
    }
    if (direction.indexOf('e') > -1 && x < bw - pw) {
      let eastIsEmpty = true;
      for (let i = 0; i < ph; ++i) {
        eastIsEmpty &= this.state[y + i][x + pw] === ' ';
      }
      if (eastIsEmpty) return true;
    }
    if (direction.indexOf('s') > -1 && y < bh - ph) {
      let southIsEmpty = true;
      for (let i = 0; i < pw; ++i) {
        southIsEmpty &= this.state[y + ph][x + i] === ' ';
      }
      if (southIsEmpty) return true;
    }
    if (direction.indexOf('w') > -1 && x > 0) {
      let westIsEmpty = true;
      for (let i = 0; i < ph; ++i) {
        westIsEmpty &= this.state[y + i][x - 1] === ' ';
      }
      if (westIsEmpty) return true;
    }
    return false;
  }

  movePiece(pieceId, direction) {
    if (!this.canMove(pieceId, direction)) return;
    // piece movement logic
    const { x: curx, y: cury } = this.getPosition(pieceId);
    const kind = pieceId[0];
    const { w: pw, h: ph } = this.getDimensions(kind);
    for (let x = curx; x < (curx + pw); x++)
      for (let y = cury; y < (cury + ph); y++) {
        if (this.state[y][x] !== pieceId) {
          const found = this.state[y][x];
          throw new Error(`Encountered a piece other than ${pieceId} at pos x=${x}, y=${y}: ${found}`);
        }
        this.state[y][x] = " ";
      }

    let newx = curx, newy = cury;
    if (direction === "n") { newy--; }
    else if (direction === "e") { newx++; }
    else if (direction === "s") { newy++; }
    else if (direction === "w") { newx--; }
    else { throw new Error(`Invalid direction: ${direction}`); }

    for (let x = newx; x < (newx + pw); x++)
      for (let y = newy; y < (newy + ph); y++) {
        if (this.state[y][x] !== " ") {
          throw new Error(`Expected an empty place at pos x=${x}, y=${y}`);
        }
        this.state[y][x] = pieceId;
      }
    this.notifyListeners();
  }

  processCellClick(boardX, boardY) {
    const pieceInPosition = this.state[boardY][boardX];

    if (this.possiblePieces.indexOf(pieceInPosition) > -1) {
      this.selectedPiece = pieceInPosition;
      this.notifyListeners();
      return;
    }

    // in case the clicked cell is empty, let's check if such cell could be the destiny of
    // the selected piece. In case it is, we move the selected piece towards the clicked
    // cell
    const { x: selectedPieceX, y: selectedPieceY } = this.getPosition(this.selectedPiece);
    const { w: selectedPieceW, h: selectedPieceH } = this.getDimensions(this.selectedPiece[0]);

    if (boardY === (selectedPieceY - 1) && (boardX >= selectedPieceX && boardX < (selectedPieceX + selectedPieceW))) {
      this.movePiece(this.selectedPiece, 'n');
    } else if (boardX === (selectedPieceX - 1) && (boardY >= selectedPieceY && boardY < (selectedPieceY + selectedPieceH))) {
      this.movePiece(this.selectedPiece, 'w');
    } else if (boardY === (selectedPieceY + selectedPieceH) && (boardX >= selectedPieceX && boardX < (selectedPieceX + selectedPieceW))) {
      this.movePiece(this.selectedPiece, 's');
    } else if (boardX === (selectedPieceX + selectedPieceW) && (boardY >= selectedPieceY && boardY < (selectedPieceY + selectedPieceH))) {
      this.movePiece(this.selectedPiece, 'e');
    } else {
      throw new Error('Invalid movement requested');
    }

  }

  moveSelectedPiece(direction) {
    this.movePiece(this.selectedPiece, direction);
  }

  notifyListeners() {
    for (const l of this.listeners) {
      l({state: this.state, selectedPiece: this.selectedPiece});
    }
  }

  addEventListener(eventName, handlerFn) {
    this.listeners.push(handlerFn);
  }
}

class KlotskiController {
  constructor(model) {
    this.model = model;
  }

  selectNextMovablePiece() {
    this.model.selectNextMovablePiece();
  }

  selectPiece(pieceId) {
    this.model.selectPiece(pieceId);
  }


  movePiece(pieceId, direction) {
    this.model.movePiece(pieceId, direction);
  }

  moveSelectedPiece(direction) {
    this.model.moveSelectedPiece(direction);
  }

  displayBoard() {
    this.model.notifyListeners();
  }

  handleViewPortClick(eventData) {
    const {boardX, boardY} = eventData;
    this.model.processCellClick(boardX, boardY);
  }

  handleKeyboardEvent(eventData) {
    if (eventData.code === "Space" || eventData.code === "Tab") {
      this.selectNextMovablePiece();
    } else if (["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].indexOf(eventData.code) > -1) {
      const directionsMap = {
        "ArrowUp": "n",
        "ArrowRight": "e",
        "ArrowDown": "s",
        "ArrowLeft": "w"
      };
      this.moveSelectedPiece(directionsMap[eventData.code]);
    } else {
      return;
    }
    eventData.preventDefault();
  }
}

class KlotskiViewPort {
  //pieceCoordinates = [];
  eventListeners = [];
  cellsW = 4;
  cellsH = 5;

  constructor(canvas) {
    this.canvas = canvas;
    this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
  }

  handleCanvasClick(eventData) {
    const rect = this.canvas.getBoundingClientRect();
    const x = eventData.clientX - rect.left;
    const y = eventData.clientY - rect.top;
    const canvasH = this.canvas.height;
    const canvasW = this.canvas.width;
    const boardX = Math.trunc((x - 1) / (canvasW / this.cellsW));
    const boardY = Math.trunc((y - 1) / (canvasH / this.cellsH));
    eventData.boardX = boardX;
    eventData.boardY = boardY;
    this.notifyListeners(eventData);
  }

  addEventListener(eventName, handlerFn) {
    this.eventListeners.push(handlerFn);
  }

  notifyListeners(eventData) {
    //console.log({eventData});
    for (const f of this.eventListeners) {
      f(eventData);
    }
  }

  handleModelChange(eventData) {
    // gets the new model data and calls this.displayBoard()
    this.displayBoard(eventData);
  }

  displayBoard({state, selectedPiece}) {
    // computes the positions of the pieces to be displayed on canvas.
    // stores these positions, they are gonna be needed to map clicks to piece Ids
    let i, j;
    const w = 4;
    const h = 5;
    const boardW = 400;
    const boardH = 500;
    const pieceW = boardW / w;
    const pieceH = boardH / h;
    let drewPieces = [];
    let drawingInstructions = [];
    const ctx = document.getElementById("gamecanvas").getContext("2d");
    let errorMsg = '';
    for (i = 0; i < h; ++i) {
      for (j = 0; j < w; ++j) {
        const pieceAtPos = state[i][j];
        if (drewPieces.includes(pieceAtPos)) continue;
        if (!pieceAtPos.trim()) continue;
        const kind = pieceAtPos[0];
        const pieceX = boardW * j / w;
        const pieceY = boardH * i / h;
        const currentDrawingInstruction = {
          selected: pieceAtPos === selectedPiece,
          piece: pieceAtPos,
          x1: pieceX,
          y1: pieceY,
        };
        switch (kind) {
          case 'v':
            currentDrawingInstruction.fillColor = 'green';
            currentDrawingInstruction.w = pieceW;
            currentDrawingInstruction.h = pieceH * 2;
            break;
          case 'q':
            currentDrawingInstruction.fillColor = 'orange';
            currentDrawingInstruction.w = pieceW * 2;
            currentDrawingInstruction.h = pieceH * 2;
            break;
          case 'h':
            currentDrawingInstruction.fillColor = 'red';
            currentDrawingInstruction.w = pieceW * 2;
            currentDrawingInstruction.h = pieceH;
            break;
          case 's':
            currentDrawingInstruction.fillColor = 'blue';
            currentDrawingInstruction.w = pieceW;
            currentDrawingInstruction.h = pieceH;
            break;
          default:
            errorMsg = `Unknown piece kind: ${kind}`;
            break;
        }
        if (errorMsg) break;
        drawingInstructions.push(currentDrawingInstruction);
        drewPieces.push(pieceAtPos);
      }
      // leave the selected piece for the end
      ctx.clearRect(0, 0, boardW, boardH);
      for (const instr of drawingInstructions.sort((a, b) => a.selected ? 1 : -1)) {
        ctx.resetTransform();
        ctx.translate(instr.x1, instr.y1);
        ctx.fillStyle = instr.fillColor;
        ctx.strokeStyle = instr.selected ? 'white' : 'black';
        ctx.lineWidth = instr.selected ? 3 : 1;
        ctx.fillRect(0, 0, instr.w, instr.h);
        ctx.strokeRect(0, 0, instr.w, instr.h);
      }
      if (errorMsg) break;
    }
    if (errorMsg) {
      throw new Error(errorMsg);
    }
  }
}

function game() {
  const canvas = document.getElementById('gamecanvas');
  const model = new KlotskiModel();
  const viewPort = new KlotskiViewPort(canvas);
  const controller = new KlotskiController(model);

  model.addEventListener('modelchange', function(eventData) { viewPort.handleModelChange(eventData); });
  viewPort.addEventListener('click', function(eventData) { controller.handleViewPortClick(eventData); });
  window.addEventListener('keydown', function(eventData) { controller.handleKeyboardEvent(eventData); });

  // for purposes of debugging via dev tools
  window.model = model;
  window.viewPort = viewPort;
  window.controller = controller;

  controller.displayBoard();
}

game();
