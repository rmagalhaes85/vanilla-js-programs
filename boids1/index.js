(function() {
  const NUM_BOIDS = 2;
  const NUM_PROPERTIES = 8;
  const TICK_INTERVAL = 10;
  const MAX_VELOCITY_MAG_CHANGE = 0.5;
  const MAX_VELOCITY_ANG_CHANGE = Math.PI / 2;
  const MAX_VELOCITY_MAG = 10;
  const MIN_VELOCITY_MAG = 0.25;
  const VISUAL_RANGE = 0.15;
  const COLISION_RANGE = 0.01;
  const ZERO_THRESHOLD = 1e-10;
  const MAX_ITERATIONS = -1;

  // Property indexes
  const PROP_X_POSITION = 0;
  const PROP_Y_POSITION = 1;
  const PROP_VELOCITY_MAG = 2; // in normalized displacement per sec
  const PROP_VELOCITY_ANG = 3;
  const PROP_OUT_OF_AREA = 4;

  const cnv = document.getElementById('cnv');
  if (!cnv) throw Error('No canvas');

  const boids = Array(NUM_BOIDS);

  //regularSimulation();
  collisionOf2();

  function regularSimulation() {
    for (let i = 0; i < NUM_BOIDS; ++i) {
      let b = newBoid();
      randomizeBoidPosition(b);
      //b[PROP_X_POSITION] += i * 0.1 - 0.2;
      //b[PROP_Y_POSITION] += i * 0.1 - 0.4;
      //b[PROP_VELOCITY_MAG] = 0.1;
      //b[PROP_VELOCITY_ANG] = 0;
      boids[i] = b;
    }

    simulationTick(0);
  }

  function collisionOf2() {
    let b = newBoid();
    b[PROP_X_POSITION] = .35;
    b[PROP_Y_POSITION] = .0;
    b[PROP_VELOCITY_MAG] = .1;
    b[PROP_VELOCITY_ANG] = Math.PI;
    boids[0] = b;
    b = newBoid();
    b[PROP_X_POSITION] = -.35;
    b[PROP_Y_POSITION] = .0;
    b[PROP_VELOCITY_MAG] = .1;
    b[PROP_VELOCITY_ANG] = .0;
    boids[1] = b;

    simulationTick(0);
  }

  //runTests();

  function simulationTick(iteration) {
    computeSpeeds();
    applyDisplacements();
    window.requestAnimationFrame(render);
    if (MAX_ITERATIONS < 0 || ++iteration < MAX_ITERATIONS)
      window.setTimeout(function() { simulationTick(iteration) }, TICK_INTERVAL);
  }

  function computeAverages(boids, i, visibleRadius, collisionRadius) {
    const numBoids = boids.length;
    if (numBoids < 2) throw new Error('Two boids are the minimum');

    let numBoidsInRange = 0;
    let rangePositionX = 0.;
    let rangePositionY = 0.;
    let rangeVelocityX = 0.;
    let rangeVelocityY = 0.;

    const boidXPosition = boids[i][PROP_X_POSITION];
    const boidYPosition = boids[i][PROP_Y_POSITION];
    const boidVelocityMag = boids[i][PROP_VELOCITY_MAG];
    const boidVelocityAng = boids[i][PROP_VELOCITY_ANG];

    let collisionAvoidanceX = undefined;
    let collisionAvoidanceY = undefined;

    for (let j = 0; j < numBoids; j++) {
      const absoluteDistance = (i === j) ? 0. : computeAbsoluteDistance(
        boidXPosition, boidYPosition,
        boids[j][PROP_X_POSITION], boids[j][PROP_Y_POSITION]
      );

      if (absoluteDistance > visibleRadius) continue;

      numBoidsInRange++;
      rangePositionX += boids[j][PROP_X_POSITION];
      rangePositionY += boids[j][PROP_Y_POSITION];
      let thisVelMag = boids[j][PROP_VELOCITY_MAG] * Math.cos(boids[j][PROP_VELOCITY_ANG]);
      let thisVelAng = boids[j][PROP_VELOCITY_MAG] * Math.sin(boids[j][PROP_VELOCITY_ANG]);
      thisVelMag = (Math.abs(thisVelMag) <= ZERO_THRESHOLD) ? 0. : thisVelMag;
      thisVelAng = (Math.abs(thisVelAng) <= ZERO_THRESHOLD) ? 0. : thisVelAng;
      rangeVelocityX += thisVelMag;
      rangeVelocityY += thisVelAng;

      if (absoluteDistance > collisionRadius) continue;
      if (i === j) continue;

      if (collisionAvoidanceX === undefined) collisionAvoidanceX = boidXPosition;
      if (collisionAvoidanceY === undefined) collisionAvoidanceY = boidYPosition;

      collisionAvoidanceX += (collisionAvoidanceX - boids[j][PROP_X_POSITION]) * 3;
      collisionAvoidanceY += (collisionAvoidanceY - boids[j][PROP_Y_POSITION]) * 3;
    }

    if (numBoidsInRange === 0)
      throw new Error('At least the current boid should be in its own visible range');

    const avgPositionX = rangePositionX / numBoidsInRange;
    const avgPositionY = rangePositionY / numBoidsInRange;
    const avgVelocityMag = numBoidsInRange === 1 ? boidVelocityMag : computeAbsoluteDistance(0, 0, rangeVelocityX, rangeVelocityY) / numBoidsInRange;
    const avgVelocityAng = numBoidsInRange === 1 ? boidVelocityAng : computeDistanceAngle(0, 0, rangeVelocityX, rangeVelocityY);

    return { numBoidsInRange, avgPositionX, avgPositionY, avgVelocityMag, avgVelocityAng,
      collisionAvoidanceX, collisionAvoidanceY };
  }

  function computeSpeeds() {
    for (let i = 0; i < NUM_BOIDS; i++) {

      const {
        numBoidsInRange,
        avgPositionX,
        avgPositionY,
        avgVelocityMag,
        avgVelocityAng,
        collisionAvoidanceX,
        collisionAvoidanceY
      } = computeAverages(boids, i, VISUAL_RANGE, COLISION_RANGE);

      // if the boid is alone, don't adjust course (this will change in a near future when
      // we start detecting screen borders
      if (numBoidsInRange === 1) continue;

      const boidXPosition = boids[i][PROP_X_POSITION];
      const boidYPosition = boids[i][PROP_Y_POSITION];
      let rule1SpeedMag, rule1SpeedAng;
      // rule 1: separation
      if (collisionAvoidanceX !== undefined && collisionAvoidanceY !== undefined) {
        debugger;
        const distanceFromTarget = computeAbsoluteDistance(
          boidXPosition, boidYPosition,
          collisionAvoidanceX, collisionAvoidanceY
        );
        rule1SpeedMag = Math.min(MIN_VELOCITY_MAG, Math.min(distanceFromTarget, MAX_VELOCITY_MAG));
        rule1SpeedAng = computeDistanceAngle(
          boidXPosition, boidYPosition,
          collisionAvoidanceX, collisionAvoidanceY
        );
      }

      // rule 2: alignment
      const rule2SpeedAng = computeDistanceAngle(
        boidXPosition, boidYPosition,
        avgPositionX, avgPositionY
      );

      // rule 3: cohesion
      const desiredPositionX = avgPositionX; //(boidXPosition + avgPositionX) / 2;
      const desiredPositionY = avgPositionY; //(boidYPosition + avgPositionY) / 2;
      const distanceFromTarget = computeAbsoluteDistance(
        boidXPosition, boidYPosition,
        desiredPositionX, desiredPositionY
      );
      const rule3SpeedMag = Math.max(MIN_VELOCITY_MAG, Math.min(distanceFromTarget, MAX_VELOCITY_MAG));
      //const rule3SpeedMag = Math.max(distanceFromTarget, MAX_VELOCITY_MAG);
      const rule3SpeedAng = computeDistanceAngle(
        boidXPosition, boidYPosition,
        desiredPositionX, desiredPositionY
      );

      //boids[i][PROP_VELOCITY_MAG] = rule3SpeedMag;
      if (!boids[i][PROP_OUT_OF_AREA]) {
        let newAngle, newSpeed;

        if (rule1SpeedMag !== undefined && rule1SpeedAng !== undefined) {
          console.log('rule1SpeedMag', rule1SpeedMag, 'rule1SpeedAng', rule1SpeedAng); newAngle = rule1SpeedAng; newSpeed = rule1SpeedMag; } else { newAngle = (rule2SpeedAng + rule3SpeedAng) / 2; newSpeed = rule3SpeedMag; }
        //if (Math.abs(newAngle - boids[i][PROP_VELOCITY_ANG]) > Math.PI / 2) {
        //  console.log(`Boid ${i}, current angle = ${boids[i][PROP_VELOCITY_ANG]}, new angle = ${newAngle}`);
        //  //debugger
        //}

        newAngle %= (2 * Math.PI);
        if (newAngle < -MAX_VELOCITY_ANG_CHANGE) newAngle = -MAX_VELOCITY_ANG_CHANGE;
        if (newAngle > MAX_VELOCITY_ANG_CHANGE) newAngle = MAX_VELOCITY_ANG_CHANGE;
        boids[i][PROP_VELOCITY_ANG] = newAngle;
        boids[i][PROP_VELOCITY_MAG] = newSpeed;
      }

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
      let displacementX = 0.;
      let displacementY = 0.;
      const adjAng = boids[i][PROP_VELOCITY_ANG];
      displacementX += adjVelocityMag * Math.cos(adjAng);
      displacementY += adjVelocityMag * Math.sin(adjAng);
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
    let boidDrawing = [0., 0., 0., 0.025, 0.04, 0.0125];
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
    boid[PROP_OUT_OF_AREA] = false;
    return boid;
  }

  function randomizeBoidPosition(boid) {
    boid[PROP_VELOCITY_MAG] = Math.random() * 0.5 + 0.3;
    boid[PROP_VELOCITY_ANG] = Math.random() * 2 * Math.PI;
    boid[PROP_X_POSITION] = Math.random() - 0.5;
    boid[PROP_Y_POSITION] = Math.random() - 0.5;
  }

  function runTests() {
    // function computeAverages(boids, i, visibleRadius) {
    console.log(computeAverages(
      [
        [ -0.1, 0., 0.1, 0.],
        [ 0.1, 0. , 0.1, 0.]
      ],
      0, 0.5));
    console.log(computeAverages(
      [
        [ -0.2, 0., 0.1, 0.],
        [ 0.0, 0. , 0.1, 0.]
      ],
      0, 0.5));
    console.log(computeAverages(
      [
        [ -0.1, 0., 0.1, 0.],
        [ 0.1, 0. , 0.1, Math.PI / 2]
      ],
      0, 0.5));
    console.log(computeAverages(
      [
        [ -0.1, 0., 0.1, 0.],
        [ -0.1, 0., 0.1, 0.],
        [ 0.1, 0. , 0.1, Math.PI / 2],
        [ 0.1, 0. , 0.1, Math.PI / 2]
      ],
      0, 0.5));
    //debugger;
    console.log(computeAverages(
      [
        [ -0.2, 0., 0.1, 0.],
        [ 0.0, 0. , 0.1, Math.PI]
      ],
      0, 0.5));
  }

})();
