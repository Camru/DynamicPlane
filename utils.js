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

  function locationCheck(location, name) {
   
  }

  function getULocation (gl, name) {
     const location = gl.getUniformLocation(gl.program, name);
     if (!location) {
       console.log(`failed to get location of ${name}`);
       return;
     }
     return location;
  }

  return {
    initWebGL: initWebGL,
    initShaders: initShaders, 
    getULocation: getULocation
  };

})();