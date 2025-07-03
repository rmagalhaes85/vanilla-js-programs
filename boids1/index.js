(function() {
  const numBoids = 100;
  const numProperties = 8;
  let currentMemoryBank = 0;
  const tickInterval = 5;

  // Property indexes
  const PROP_VELOCITY_MAG = 0; // in normalized displacement per sec
  const PROP_VELOCITY_ANG = 1;
  const PROP_X_POSITION = 2;
  const PROP_Y_POSITION = 3;

  const cnv = document.getElementById('cnv');
  if (!cnv) throw Error('No canvas');

  const boids = Array(numBoids);

  for (let i = 0; i < numBoids; ++i) {
    let b = newBoid();
    randomizeBoidPosition(b);
    boids[i] = b;
  }

  simulationTick();

  function simulationTick() {
    computeSpeeds();
    applyDisplacements();
    window.requestAnimationFrame(render);
    window.setTimeout(simulationTick, tickInterval);
  }

  function computeSpeeds() {
  }

  function applyDisplacements() {
    for (let i = 0; i < numBoids; i++) {
      const adjVelocityMag = Math.abs(boids[i][PROP_VELOCITY_MAG]) / (1000 / tickInterval);
      const adjAng = boids[i][PROP_VELOCITY_ANG];
      const displacementX = adjVelocityMag * Math.cos(adjAng);
      const displacementY = adjVelocityMag * Math.sin(adjAng);
      boids[i][PROP_X_POSITION] += displacementX;
      boids[i][PROP_Y_POSITION] += displacementY;
    }
  }

  function render() {
    const ctx = cnv.getContext('2d');
    ctx.clearRect(0, 0, cnv.width, cnv.height);

    for (let i = 0; i < numBoids; i++) {
      drawBoid(boids[i], ctx, cnv.width, cnv.height);
    }
  }

  function drawBoid(boid, ctx, canvasW, canvasH) {
    // define a set of points representing a "base" boid picture
    //let boidDrawing = [0., 0., 0.05, 0., 0.025, 0.08];
    let boidDrawing = [0., 0., 0., 0.05, 0.08, 0.025];
    const baseBoidHeight = Math.abs(boidDrawing[5] - boidDrawing[1]);
    const baseBoidWidth = Math.abs(boidDrawing[2] - boidDrawing[0]);
    // move to the middle of view port
    for (let i = 0; i < 6; i++)
      boidDrawing[i] -= (i % 2 === 0) ? baseBoidWidth : baseBoidHeight;

    // apply linear transformation to rotate it based on its heading angle
    //const boidDrawing = boidDrawing;
    const cos_heading = Math.cos(boid[PROP_VELOCITY_ANG]);
    const sin_heading = Math.sin(boid[PROP_VELOCITY_ANG]);
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
    boid[PROP_VELOCITY_MAG] = .0;
    boid[PROP_VELOCITY_ANG] = .0;
    boid[PROP_X_POSITION] = 0.0;
    boid[PROP_Y_POSITION] = 0.0;
    return boid;
  }

  function randomizeBoidPosition(boid) {
    boid[PROP_VELOCITY_MAG] = Math.random() * 0.8;
    boid[PROP_VELOCITY_ANG] = Math.random() * 2 * Math.PI;
    boid[PROP_X_POSITION] = Math.random() - 0.5;
    boid[PROP_Y_POSITION] = Math.random() - 0.5;
  }

})();
