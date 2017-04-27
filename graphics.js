let VSHADER_SOURCE = 
`attribute vec4 a_Position;
 attribute vec4 a_Color;
 uniform mat4 u_ProjectionMatrix;
 uniform mat4 u_ViewMatrix;
 uniform mat4 u_ModelMatrix;
 uniform float u_Time;
 uniform float u_Frequency;
 uniform float u_Amplitude;
 uniform float u_PosMultiple;
 varying vec4 v_Color;
 varying vec4 v_Position;
 void main() {
    vec4 position2 = a_Position;
    position2.y += u_Amplitude * sin(u_Frequency * u_Time + a_Position.x * u_PosMultiple); 
    position2.y += u_Amplitude * cos(u_Frequency * u_Time + a_Position.z * u_PosMultiple); 
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

function main(x, z, color) {
  const canvas = document.getElementById('webgl');
  const gl = utils.initWebGL(canvas);

  const controls = {
    frequency: document.getElementById('frequency'),
    amplitude: document.getElementById('amplitude'),
    posMultiple: document.getElementById('posMultiple'),
    brightness: document.getElementById('brightness'),
    rotationSpeed: document.getElementById('rotationSpeed'),
    cameraX: document.getElementById('cameraX'),
    cameraY: document.getElementById('cameraY'),
    cameraZ: document.getElementById('cameraZ')
  };

  // Compile shaders
  if(!utils.initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('failed to get rendering context');
    return;
  }

  // Get number of vertices to be rendered
  var n = initVertextBuffers(gl, x, z); 
  if (n < 0) {
    console.log('failed to set position of vertices');
    return;
  }

  const hex = hexToRgbA(color);
  const [r, g, b] = hex;
  gl.clearColor(r/255, g/255, b/255, 1.0);
  gl.enable(gl.DEPTH_TEST);

  let now;
  let then = Date.now() * 0.001;
  let rotation = 0;
  const animate = now => {
    if (!now) now = Date.now(); 
    now *= 0.001; // convert time to seconds
    let deltaTime = now - then;
    then = now;

    rotation += controls.rotationSpeed.value * deltaTime; 

    let time = utils.getULocation(gl, 'u_Time');
    gl.uniform1f(time, now);

    let u_Frequency = utils.getULocation(gl, 'u_Frequency');
    gl.uniform1f(u_Frequency, controls.frequency.value);

    let u_Amplitude = utils.getULocation(gl, 'u_Amplitude');
    gl.uniform1f(u_Amplitude, controls.amplitude.value);

    let u_PosMultiple = utils.getULocation(gl, 'u_PosMultiple');
    gl.uniform1f(u_PosMultiple, controls.posMultiple.value);

    let u_Brightness = utils.getULocation(gl, 'u_Brightness');
    gl.uniform1f(u_Brightness, controls.brightness.value);

    let modelMatrix = new Matrix4();
    modelMatrix.setRotate(rotation, 0, 1, 0);

    draw(gl, canvas, modelMatrix, n, controls);
    
    requestAnimationFrame(animate);
  };
  animate();

};

function draw(gl, canvas, model, n, controls) {
    const {cameraX, cameraY, cameraZ} = controls;
    const FOV = 20;
    const ASPECT = canvas.clientWidth/canvas.clientHeight;
    const NEAR = 1;
    const FAR = 100;
    let u_ProjectionMatrix = utils.getULocation(gl, 'u_ProjectionMatrix');
    let u_ViewMatrix = utils.getULocation(gl, 'u_ViewMatrix');
    let u_ModelMatrix = utils.getULocation(gl, 'u_ModelMatrix');

    let projection = new Matrix4();
    let view = new Matrix4();
    projection.setPerspective(FOV, ASPECT, NEAR, FAR);
    view.lookAt(cameraX.value, cameraY.value, cameraZ.value, 0, 0, 0, 0, 1, 0);
  
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projection.elements);
    gl.uniformMatrix4fv(u_ViewMatrix, false, view.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, model.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLE, 0, n); 
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

      //       (x0, z1)       (x1, z1)
      //              *-------*
      //              | A   / |
      //              |   /   |
      //              | /   B |
      //              *-------*
      //       (x0, z0)       (x1, z0)

      positions.push(x0, 0, z0, x0, 0, z1, x1, 0, z1, x1, 0, z1, x1, 0, z0, x0, 0, z0);
    }
  }
  return positions;
}

function initVertextBuffers (gl, x, z) {
  const positions = generatePlane(x, z);
  const vertices = new Float32Array(positions);

  const n = vertices.length/6;
  const F_SIZE = vertices.BYTES_PER_ELEMENT;

  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create a buffer object');
    return 1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  let a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  let a_Color = gl.getAttribLocation(gl.program, 'a_Color');

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, F_SIZE*6, 0);
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, F_SIZE*6, F_SIZE*3);

  gl.enableVertexAttribArray(a_Position);
  gl.enableVertexAttribArray(a_Color);

  return n;
}

function reloadShaders() {
  const xSegs = document.getElementById('xSegments').value;
  const zSegs = document.getElementById('zSegments').value;
  const backgroundColor = document.getElementById('backgroundColor').value;
  main(xSegs, zSegs, backgroundColor);
}

function hexToRgbA(hex){
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c = hex.substring(1).split('');
        if(c.length == 3){
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x'+c.join('');
        return [(c>>16)&255, (c>>8)&255, c&255, 1];
    }
    throw new Error('Bad Hex');
}