const utils = (() => {
  function createProgram(gl, vshader, fshader) {
    let vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
    let fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    let linked = gl.getProgramParameter(program, gl.LINK_STATUS);
  
    return program;
  }

  function loadShader(gl, type, source) {
    let shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

    return shader;
  }

  function destroyShader(gl, vshader, fshader) {
    let vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader);
    let fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);

    let program = gl.createProgram();

    gl.deleteProgram(program);
    gl.deleteShader(fragmentShader);
    gl.deleteShader(vertexShader);
  }

  function initWebGL(canvas) {
    let gl = null;

    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) alert('Unable to initialize WebGL. Your browser may not support it.');

    return gl;
  }

  function initShaders(gl, vshader, fshader) {
    let program = createProgram(gl, vshader, fshader);

    gl.useProgram(program);
    gl.program = program;

    return true;
  }

  function getULocation(gl, name) {
    const location = gl.getUniformLocation(gl.program, name);
    if (!location) {
      console.log(`failed to get location of ${name}`);
      return;
    }
    return location;
  }

  function perfTest(fn, args, count) {
    let times = [];
    let trials = count || 10;

    for (let i = 0; i < trials; i++) {

      var t0 = performance.now();
      var result = fn.apply(this, args);
      var t1 = performance.now();

      times.push(+(t1 - t0).toFixed(4));
    }

    let maxTime = Math.max.apply(Math, times);
    let avgTime = times.reduce((a,b) => a+b)/ times.length;

    console.log(`Avg. execution time: ${avgTime} ms`);
    console.log(`Max execution time: ${maxTime} ms`);
  }

  function hexToRgbA(hex) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split('');
      if (c.length == 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      return [(c >> 16) & 255, (c >> 8) & 255, c & 255, 1];
    }
    throw new Error('Bad Hex');
  }

  function initEventHandlers(canvas, currentAngle, mouse) {
    let dragging = false;
    let lastX = -1;
    let lastY = -1;

    canvas.addEventListener('mousedown', e => {
      let x = e.clientX;
      let y = e.clientY;
      let rect = e.target.getBoundingClientRect();
      if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
        lastX = x;
        lastY = y;
        dragging = true;
      }

    });

    canvas.addEventListener('mouseup', e => {
      dragging = false;
    });

    canvas.addEventListener('mousemove', e => {
      canvas.style.cursor = "move";
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      if (dragging) {
        let rotationRatio = 100 / canvas.clientHeight;
        let dx = rotationRatio * (mouse.x - lastX);
        let dy = rotationRatio * (mouse.y - lastY);

        // contstrain rotation to -90 and 90 degree
        currentAngle[0] = currentAngle[0] + dy;
        currentAngle[1] = currentAngle[1] + dx;
      }

      lastX = mouse.x;
      lastY = mouse.y;
    });
  }

  return {
    initWebGL: initWebGL,
    initShaders: initShaders,
    initEventHandlers: initEventHandlers,
    perfTest: perfTest,
    hexToRgbA: hexToRgbA,
    getULocation: getULocation,
    destroyShader: destroyShader
  };

})();