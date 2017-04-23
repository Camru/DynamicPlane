let VSHADER_SOURCE = 
`attribute vec4 a_Position;
 attribute vec4 a_Color;
 uniform mat4 u_ProjectionMatrix;
 uniform mat4 u_ViewMatrix;
 uniform mat4 u_ModelMatrix;
 uniform float u_Time;
 uniform float u_Frequency;
 uniform float u_Amplitude;
 varying vec4 v_Color;
 varying vec4 v_Position;
 void main() {
    vec4 position2 = a_Position;
    position2.y += u_Amplitude * sin(u_Frequency * u_Time + a_Position.x * 7.0); 
    position2.y += u_Amplitude * cos(u_Frequency * u_Time + a_Position.z * 7.0); 
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * position2;  
    v_Position = position2;
    v_Color = a_Color;
 }`;

let FSHADER_SOURCE =
`precision mediump float;
 uniform float u_Brightness;
 varying vec4 v_Color;
 varying vec4 v_Position;
 void main() {
  gl_FragColor = vec4(v_Position.x * u_Brightness, v_Position.y * u_Brightness, v_Position.z * u_Brightness, 1.0);
 }`;

function main() {
  const canvas = document.getElementById('webgl');
  let gl = getWebGLContext(canvas);

  const controls = {
    frequency: document.getElementById('frequency'),
    amplitude: document.getElementById('amplitude'),
    brightness: document.getElementById('brightness'),
    rotationSpeed: document.getElementById('rotationSpeed'),
    cameraX: document.getElementById('cameraX'),
    cameraY: document.getElementById('cameraY'),
    cameraZ: document.getElementById('cameraZ')
  };


  // Init and compile shaders
  if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('failed to get rendering context');
    return;
  }

  // Set positons of vertices
  var n = initVertextBuffers(gl); 
  if (n < 0) {
    console.log('failed to set position of vertices');
    return;
  }

  // gl.clearColor(0.0,	0.0,	0.0, 1.0);
  gl.clearColor(0.11,	0.07,	0.17, 1.0);
  gl.enable(gl.DEPTH_TEST);

  let tiltAngle = -50;
  let rotation = 0;
  let rotSpeed = 20;
  let then = 0;
  let step = 0;
  const animate = now => {
    if (!now) now = 0.016; 
    now *= 0.001; // convert time to seconds
    let deltaTime = now - then;
    then = now;

    step += 0.024;
    rotation += controls.rotationSpeed.value * deltaTime; 
    let time = gl.getUniformLocation(gl.program, 'u_Time');
    locationCheck(time, 'time');
    gl.uniform1f(time, now);

    let u_Frequency = gl.getUniformLocation(gl.program, 'u_Frequency');
    locationCheck(u_Frequency, 'u_Freqency');
    gl.uniform1f(u_Frequency, controls.frequency.value);

    let u_Amplitude = gl.getUniformLocation(gl.program, 'u_Amplitude');
    locationCheck(u_Amplitude, 'u_Amplitude');
    gl.uniform1f(u_Amplitude, controls.amplitude.value);

    let u_Brightness = gl.getUniformLocation(gl.program, 'u_Brightness');
    locationCheck(u_Brightness, 'u_Brightness');
    gl.uniform1f(u_Brightness, controls.brightness.value);

    let modelMatrix = new Matrix4();
    // modelMatrix.setRotate(tiltAngle, 1, 0, 0);
    // modelMatrix.translate(0, 0, 0);
    modelMatrix.setRotate(rotation, 0, 1, 0);

    draw(gl, canvas, modelMatrix, n, controls);
    
    requestAnimationFrame(animate);
  };
  animate();

};

// =============================================================================

function draw(gl, canvas, model, n, controls) {
    const {cameraX, cameraY, cameraZ} = controls;
    const FOV = 20;
    const ASPECT = canvas.width/canvas.height;
    const NEAR = 1;
    const FAR = 100;
    let u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    let u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    let u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    locationCheck(u_ProjectionMatrix, 'u_ProjectionMatrix');
    locationCheck(u_ViewMatrix, 'u_ViewMatrix');
    locationCheck(u_ViewMatrix, 'u_ModelMatrix');

    let projection = new Matrix4();
    let view = new Matrix4();
    projection.setPerspective(FOV, ASPECT, NEAR, FAR);
    view.lookAt(cameraX.value, cameraY.value, cameraZ.value, 0, 0, 0, 0, 1, 0);
  
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projection.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, view.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, model.elements);

    // Clear screen before drawing 
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLE, 0, n); 
}

function locationCheck(location, name) {
  if (!location) {
    console.log(`failed to get location of ${name}`);
  }
}

function generatePlane (segmentsX, segmentsZ) {
  const positions = []
  const widthX = 1 / segmentsX
  const widthZ = 1 / segmentsZ
  for (let x = 0; x < segmentsX; x++) {
    for (let z = 0; z < segmentsZ; z++) {
      const x0 = x * widthX - 0.5
      const x1 = (x + 1) * widthX - 0.5
      const z0 = z * widthZ - 0.5
      const z1 = (z + 1) * widthZ - 0.5

      // Build 2 triangles
      //
      //       (x0, z1)       (x1, z1)
      //              *-------*
      //              | A   / |
      //              |   /   |
      //              | /   B |
      //              *-------*
      //       (x0, z0)       (x1, z0)

      // Triangle A
      // positions.push([x0, 0, z0])
      // positions.push([x0, 0, z1])
      // positions.push([x1, 0, z1])

      // // Triangle B
      // positions.push([x1, 0, z1])
      // positions.push([x1, 0, z0])
      // positions.push([x0, 0, z0])
      positions.push(x0, 0, z0, x0, 0, z1, x1, 0, z1, x1, 0, z1, x1, 0, z0, x0, 0, z0);
    }
  }
  return positions;
}

function initVertextBuffers (gl) {
  const positions = generatePlane(1000, 1000);
  // const verts = [];
  // positions.map(group => {
  //   group.map(int => verts.push(int));
  // });
  // const vertices = new Float32Array([
  //   -0.5, 0.5, 1.0, 1.0, 0.0, 0.0, // top left
  //   -0.5, -0.5, 1.0, 1.0, 0.0, 0.0, // bottom left
  //   0.5, 0.5, 1.0, 1.0, 0.0, 0.0,  // top right

  //   // -0.5, -0.5, 1.0, 1.0, 0.0, 0.0, // bottom left
  //   // 0.5, -0.5, 1.0, 1.0, 0.0, 0.0, // bottom right
  //   // 0.5, 0.5, 1.0, 1.0, 0.0, 0.0, // top right
  // ]);

 const vertices = new Float32Array(positions);

  const n = vertices.length/6;
  const F_SIZE = vertices.BYTES_PER_ELEMENT;

    // Create buffer object
  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create a buffer object');
    return 1;
  }

  // Bind buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  // write data into buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // 4. Get locations of attribute/uniforms
  let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  let a_Color = gl.getAttribLocation(gl.program, 'a_Color');

  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, F_SIZE*6, 0);
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, F_SIZE*6, F_SIZE*3);

  // Enable assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);
  gl.enableVertexAttribArray(a_Color);

  return n;
}
