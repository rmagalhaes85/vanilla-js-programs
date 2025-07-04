(function() {
  const NUM_BOIDS = 100;
  const NUM_PROPERTIES = 8;
  const TICK_INTERVAL = 5;
  const MAX_VELOCITY_MAG_CHANGE = 0.5;
  const MAX_VELOCITY_ANG_CHANGE = 0.1;
  const MAX_VELOCITY_MAG = 3;
  const VISUAL_RANGE = 0.15;

  // Property indexes
  const PROP_VELOCITY_MAG = 0; // in normalized displacement per sec
  const PROP_VELOCITY_ANG = 1;
  const PROP_X_POSITION = 2;
  const PROP_Y_POSITION = 3;

  const cnv = document.getElementById('cnv');
  if (!cnv) throw Error('No canvas');

  const boids = Array(NUM_BOIDS);

  for (let i = 0; i < NUM_BOIDS; ++i) {
    let b = newBoid();
    randomizeBoidPosition(b);
    boids[i] = b;
  }

  simulationTick();

  function simulationTick() {
    computeSpeeds();
    applyDisplacements();
    window.requestAnimationFrame(render);
    window.setTimeout(simulationTick, TICK_INTERVAL);
  }

  function computeSpeeds() {
    for (let i = 0; i < NUM_BOIDS; i++) {
      // loop for identifying boids within visual range
      let numBoidsInRange = 0;
      let rangePositionX = 0.;
      let rangePositionY = 0.;
      let rangeVelocityMag = 0.;
      let rangeVelocityAng = 0.;

      for (let j = 0; j < NUM_BOIDS; j++) {
        if (i === j) continue;
        const absoluteDistance = computeAbsoluteDistance(
          boids[i][PROP_X_POSITION], boids[j][PROP_X_POSITION],
          boids[i][PROP_Y_POSITION], boids[j][PROP_Y_POSITION]
        );
        if (absoluteDistance > VISUAL_RANGE) continue;
        numBoidsInRange++;
        rangePositionX += boids[j][PROP_X_POSITION];
        rangePositionY += boids[j][PROP_Y_POSITION];
        rangeVelocityMag += boids[j][PROP_VELOCITY_MAG];
        rangeVelocityAng += boids[j][PROP_VELOCITY_ANG];
      }

      if (numBoidsInRange === 0) continue;

      const avgPositionX = rangePositionX / numBoidsInRange;
      const avgPositionY = rangePositionY / numBoidsInRange;
      const avgVelocityMag = rangeVelocityMag / numBoidsInRange;
      const avgVelocityAng = rangeVelocityAng / numBoidsInRange;

      // rule 1: separation


      // rule 2: alignment
      const rule2SpeedAng = computeDistanceAngle(
        boids[i][PROP_X_POSITION], avgPositionX,
        boids[i][PROP_Y_POSITION], avgPositionY
      );

      // rule 3: cohesion
      const desiredPositionX = (boids[i][PROP_X_POSITION] + avgPositionX) / 2;
      const desiredPositionY = (boids[i][PROP_Y_POSITION] + avgPositionY) / 2;
      const distanceFromTarget = computeAbsoluteDistance(
        boids[i][PROP_X_POSITION], desiredPositionX,
        boids[i][PROP_Y_POSITION], desiredPositionY
      );
      const rule3SpeedMag = Math.max(distanceFromTarget, MAX_VELOCITY_MAG);
      const rule3SpeedAng = computeDistanceAngle(
        boids[i][PROP_X_POSITION], desiredPositionX,
        boids[i][PROP_Y_POSITION], desiredPositionY
      );

      boids[i][PROP_VELOCITY_MAG] = rule3SpeedMag;
      boids[i][PROP_VELOCITY_ANG] = rule2SpeedAng + rule3SpeedAng / 3;
    }
  }

  function computeAbsoluteDistance(ox, oy, dx, dy) {
    return Math.sqrt(Math.pow(ox - dx, 2) + Math.pow(oy - dy, 2));
  }

  function computeDistanceAngle(ox, oy, dx, dy) {
    return Math.atan2(dy - oy, dx - ox);
  }

  function applyDisplacements() {
    // TODO enforce speed and acceleration limits
    for (let i = 0; i < NUM_BOIDS; i++) {
      const adjVelocityMag = Math.abs(boids[i][PROP_VELOCITY_MAG]) / (1000 / TICK_INTERVAL);
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

    for (let i = 0; i < NUM_BOIDS; i++) {
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
    let boid = Array(NUM_PROPERTIES);
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
