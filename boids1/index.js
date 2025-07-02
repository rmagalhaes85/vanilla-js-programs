(function() {
  const numBoids = 10;
  const numProperties = 8;
  let currentMemoryBank = 0;
  const tickInterval = 20;

  // Property indexes
  const PROP_X_VELOCITY = 0;
  const PROP_Y_VELOCITY = 1;
  const PROP_X_POSITION = 2;
  const PROP_Y_POSITION = 3;
  const PROP_HEADING = 4;

  const cnv = document.getElementById('cnv');
  if (!cnv) throw Error('No canvas');

  const memoryBanks = Array(2);
  memoryBanks[0] = Array(numBoids);
  memoryBanks[1] = Array(numBoids);

  for (let i = 0; i < numBoids; ++i) {
    let b = newBoid();
    randomizeBoidPosition(b);
    memoryBanks[0][i] = b;
    memoryBanks[1][i] = newBoid();
  }

  simulationTick();

  function simulationTick() {
    const memBank = memoryBanks[currentMemoryBank];

    window.requestAnimationFrame(render);
    //window.setTimeout(simulationTick, tickInterval);
  }

  function render() {
    console.log('render');
    const memBank = memoryBanks[currentMemoryBank];
    drawBoid(memBank[0], cnv, 200, 200);
    currentMemoryBank ^= 1;
  }

  function drawBoid(boid, canvas, canvasW, canvasH) {
    const ctx = canvas.getContext('2d');
    // define a set of points representing a "base" boid picture
    let boidDrawing = [0., 0., 0.05, 0., 0.025, 0.08];
    const baseBoidHeight = Math.abs(boidDrawing[5] - boidDrawing[1]);
    const baseBoidWidth = Math.abs(boidDrawing[2] - boidDrawing[0]);
    // move to the middle of view port
    for (let i = 0; i < 6; i++)
      boidDrawing[i] -= (i % 2 === 0) ? baseBoidWidth : baseBoidHeight;

    // apply linear transformation to rotate it based on its heading angle
    //const boidDrawing = boidDrawing;
    const cos_heading = Math.cos(boid[PROP_HEADING] * 2 * Math.PI);
    const sin_heading = Math.sin(boid[PROP_HEADING] * 2 * Math.PI);
    boidDrawing = [
      (boidDrawing[0] * cos_heading) + (boidDrawing[1] * - sin_heading),
      (boidDrawing[0] * sin_heading) + (boidDrawing[1] * cos_heading),
      (boidDrawing[2] * cos_heading) + (boidDrawing[3] * - sin_heading),
      (boidDrawing[2] * sin_heading) + (boidDrawing[3] * cos_heading),
      (boidDrawing[4] * cos_heading) + (boidDrawing[5] * - sin_heading),
      (boidDrawing[4] * sin_heading) + (boidDrawing[5] * cos_heading)
    ];

    // apply linear transformation to translate it to its end position
    const displacementX = boid[PROP_X_POSITION];// + baseBoidWidth;
    const displacementY = boid[PROP_Y_POSITION];// + baseBoidHeight;
    boidDrawing = [
      boidDrawing[0] + displacementX,
      boidDrawing[1] + displacementY,
      boidDrawing[2] + displacementX,
      boidDrawing[3] + displacementY,
      boidDrawing[4] + displacementX,
      boidDrawing[5] + displacementY,
    ];

    // readapt coordinates and apply linear transformation to scale it to the canvas dimensions
    for (let i = 0; i < 6; i++) {
      boidDrawing[i] += (i % 2 === 0) ? baseBoidWidth : baseBoidHeight;
    }

    boidDrawing = [
      boidDrawing[0] * canvasW,
      boidDrawing[1] * canvasH,
      boidDrawing[2] * canvasW,
      boidDrawing[3] * canvasH,
      boidDrawing[4] * canvasW,
      boidDrawing[5] * canvasH,
    ];

    for (let i = 0; i < 6; i++) {
      boidDrawing[i] += (i % 2 === 0) ? canvasW / 2 : canvasH / 2;
    }

    // draw the transformed lines on canvas
    ctx.beginPath();
    ctx.moveTo(boidDrawing[0], boidDrawing[1]);
    ctx.lineTo(boidDrawing[2], boidDrawing[3]);
    ctx.lineTo(boidDrawing[4], boidDrawing[5]);
    ctx.lineTo(boidDrawing[0], boidDrawing[1]);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 1;
    ctx.stroke();

  }

  function newBoid() {
    let boid = Array(numProperties);
    boid[PROP_X_VELOCITY] = 0.0;
    boid[PROP_Y_VELOCITY] = 0.0;
    boid[PROP_X_POSITION] = 0.0;
    boid[PROP_Y_POSITION] = 0.0;
    boid[PROP_HEADING] = 0.0;
    return boid;
  }

  function randomizeBoidPosition(boid) {
    boid[PROP_X_POSITION] = Math.random() - 0.5;
    boid[PROP_Y_POSITION] = Math.random() - 0.5;
    boid[PROP_HEADING] = Math.random();
  }

})();
