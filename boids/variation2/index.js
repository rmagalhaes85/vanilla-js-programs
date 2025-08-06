(function() {
  const NUM_BOIDS = 2;
  const TICK_INTERVAL = 10;
  const VISUAL_RANGE = 1;
  const MAX_VELOCITY_MAG = 0.001;

  const BASE_BOID_PTS = [0., 0., 0., 0.025, 0.04, 0.0125];

  const cnv = document.getElementById('cnv');
  if (!cnv) throw Error('No canvas');

  if (NUM_BOIDS < 2) throw Error('Minimum number of boids is 2');

  const boids = Array(NUM_BOIDS);

  for (let i = 0; i < NUM_BOIDS; ++i) {
    let b = newBoid();
    randomizeBoidPosition(b);
    boids[i] = b;
  }

  simulationTick(0);

  function simulationTick(iteration) {
    //if (iteration > 10) return;
    computeSpeeds();
    applyDisplacements();
    window.requestAnimationFrame(render);
    window.setTimeout(function() {simulationTick(++iteration)}, TICK_INTERVAL);
  }

  function computeSpeeds() {
    console.log('===========[ computeSpeeds: begin ]=============');

    for (let i = 0; i < NUM_BOIDS; i++) {
      // loop for identifying boids within visual range
      let numBoidsInRange = 0;
      let rangePositionX = 0.;
      let rangePositionY = 0.;
      let rangeVelocityMag = 0.;
      let rangeVelocityAng = 0.;
      let wallHit = false;

      for (let j = 0; j < NUM_BOIDS; j++) {
        if (i === j) continue;
        const absoluteDistance = computeAbsoluteDistance(
          boids[i].currentPosX, boids[j].currentPosX,
          boids[i].currentPosY, boids[j].currentPosY
        );
        if (absoluteDistance > VISUAL_RANGE) continue;
        numBoidsInRange++;
        rangePositionX += boids[j].currentPosX;
        rangePositionY += boids[j].currentPosY;
        //rangeVelocityMag += boids[j][PROP_VELOCITY_MAG];
        //rangeVelocityAng += boids[j][PROP_VELOCITY_ANG];
      }

      //const currentX = boids[i].currentPosX;
      //const currentY = boids[i].currentPosY;
      ////debugger
      //if (currentX <= -0.5 || currentX >= 0.5 || currentY <= -0.5 || currentY >= 0.5) {
      //  //debugger;
      //  boids[i][PROP_VELOCITY_ANG] += (Math.PI / 2);
      //  wallHit |= true;
      //}

      if (numBoidsInRange === 0) continue;

      const avgPositionX = rangePositionX / numBoidsInRange;
      const avgPositionY = rangePositionY / numBoidsInRange;
      //const avgVelocityMag = rangeVelocityMag / numBoidsInRange;
      //const avgVelocityAng = rangeVelocityAng / numBoidsInRange;

      // rule 1: separation


      // rule 2: alignment
      //const rule2SpeedAng = computeDistanceAngle(
      //  boids[i][PROP_X_POSITION], avgPositionX,
      //  boids[i][PROP_Y_POSITION], avgPositionY
      //);

      // rule 3: cohesion
      const desiredPositionX = avgPositionX; //(boids[i][PROP_X_POSITION] + avgPositionX) / 2;
      const desiredPositionY = avgPositionY; //(boids[i][PROP_Y_POSITION] + avgPositionY) / 2;
      const distanceX = (desiredPositionX - boids[i].currentPosX) / (1000 / TICK_INTERVAL);
      const distanceY = (desiredPositionY - boids[i].currentPosY) / (1000 / TICK_INTERVAL);


      //boids[i][PROP_VELOCITY_MAG] = rule3SpeedMag;
      boids[i].desiredPosX = clamp(boids[i].currentPosX + distanceX);
      boids[i].desiredPosY = clamp(boids[i].currentPosY + distanceY);

      console.log(`Iteration ${i}: boid = ${JSON.stringify(boids[i], null, 2)}`);
    }

    console.log('===========[ computeSpeeds: end ]=============');
  }

  function computeAbsoluteDistance(ox, oy, dx, dy) {
    return Math.sqrt(Math.pow(ox - dx, 2) + Math.pow(oy - dy, 2));
  }

  function computeDistanceAngle(ox, oy, dx, dy) {
    return Math.atan2(dy - oy, dx - ox);
  }

  function clamp(v) {
    const l1 = -0.48;
    const l2 = 0.48;
    if (v < l1) { return l1; }
    else if (v > l2) { return l2; }
    else { return v; }
  }

  function applyDisplacements() {
    // TODO enforce speed and acceleration limits
    for (let i = 0; i < NUM_BOIDS; i++) {

      const distanceFromTarget = computeAbsoluteDistance(
        boids[i].currentPosX, boids[i].desiredPosX,
        boids[i].currentPosY, boids[i].desiredPosY
      );
      const angleFromTarget = computeDistanceAngle(
        boids[i].currentPosX, boids[i].desiredPosX,
        boids[i].currentPosY, boids[i].desiredPosY
      );

      boids[i].heading = angleFromTarget;
      const adjVelocityMag = Math.min(Math.abs(distanceFromTarget), MAX_VELOCITY_MAG) / (1000 / TICK_INTERVAL);
      const adjAng = angleFromTarget;
      const displacementX = adjVelocityMag * Math.cos(adjAng);
      const displacementY = adjVelocityMag * Math.sin(adjAng);
      boids[i].currentPosX += displacementX;
      boids[i].currentPosY += displacementY;
      boids[i].desiredPosX = 0.;
      boids[i].desiredPosY = 0.;
    }
  }

  function render() {
    //debugger
    const ctx = cnv.getContext('2d');
    ctx.clearRect(0, 0, cnv.width, cnv.height);

    for (let i = 0; i < NUM_BOIDS; i++) {
      //if (i !== 0) continue;
      drawBoid(boids[i], ctx, cnv.width, cnv.height);
    }
  }

  function drawBoid(boid, ctx, canvasW, canvasH) {
    // define a set of points representing a "base" boid picture
    //let boidDrawing = [0., 0., 0.05, 0., 0.025, 0.08];
    let boidDrawing = BASE_BOID_PTS;
    const baseBoidHeight = Math.abs(boidDrawing[5] - boidDrawing[1]);
    const baseBoidWidth = Math.abs(boidDrawing[2] - boidDrawing[0]);
    // move to the middle of view port
    for (let i = 0; i < 6; i++)
      boidDrawing[i] -= (i % 2 === 0) ? baseBoidWidth : baseBoidHeight;

    // apply linear transformation to rotate it based on its heading angle
    //const boidDrawing = boidDrawing;
    const cos_heading = Math.cos(boid.heading);
    const sin_heading = Math.sin(boid.heading);
    boidDrawing = [
      (boidDrawing[0] * cos_heading) + (boidDrawing[1] * - sin_heading),
      (boidDrawing[0] * sin_heading) + (boidDrawing[1] * cos_heading),
      (boidDrawing[2] * cos_heading) + (boidDrawing[3] * - sin_heading),
      (boidDrawing[2] * sin_heading) + (boidDrawing[3] * cos_heading),
      (boidDrawing[4] * cos_heading) + (boidDrawing[5] * - sin_heading),
      (boidDrawing[4] * sin_heading) + (boidDrawing[5] * cos_heading)
    ];

    // apply linear transformation to translate it to its end position
    const displacementX = boid.currentPosX;// + baseBoidWidth;
    const displacementY = boid.currentPosY;// + baseBoidHeight;
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
    return {
      currentPosX: 0.,
      currentPosY: 0.,
      desiredPosX: 0.,
      desiredPosY: 0.,
      heading: 0.
    };
  }

  function randomizeBoidPosition(boid) {
    boid.currentPosX = Math.random() - 0.5;
    boid.currentPosY = Math.random() - 0.5;
    boid.desiredPosX = 0.;
    boid.desiredPosY = 0.;
    boid.heading = Math.PI / 2;
  }

})();
