import * as mat4 from "./lib/gl-matrix/mat4.js";

"use strict";

const vertexShaderSource = `#version 300 es
in vec4 a_position;
in vec4 a_color;
uniform mat4 u_matrix;
out vec4 v_color;
void main() {
  gl_Position = u_matrix * a_position;
  v_color = a_color;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 outColor;
void main() {
  outColor = v_color;
}
`;

//function
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return undefined;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return undefined;
}

function degToRad(d) {
  return d * Math.PI / 180;
}


//main function
function main() {
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) {
    return;
  }
  //create program
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

  //get location
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const colorAttributeLocation = gl.getAttribLocation(program, "a_color");
  const matrixLocation = gl.getUniformLocation(program, "u_matrix");

  //create position buffer, set vao
  const positionBuffer = gl.createBuffer();
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setGeometry(gl);
  {
    const size = 3;
    const type = gl.FLOAT;
    const normalize = false
    const stride = 0;
    const offset = 0;
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
  }

  //create color buffer, set vao
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  setColors(gl);
  gl.enableVertexAttribArray(colorAttributeLocation);
  {
    const size = 3;
    const type = gl.UNSIGNED_BYTE;
    const normalize = true;
    const stride = 0;
    const offset = 0;
    gl.vertexAttribPointer(colorAttributeLocation, size, type, normalize, stride, offset);
  }

  //set init position and rotation
  let rotation = [degToRad(0), degToRad(0)];

  drawScene();

  //show sliderbar value
  function ShowSliderValue() {
    document.getElementById("Longitude_value").innerHTML = document.getElementById("Longitude").value;
    document.getElementById("Latitude_value").innerHTML = document.getElementById("Latitude").value;
  }

  //set sliderbar eventlistener
  document.getElementById("Longitude").onchange = function () { drawScene(); ShowSliderValue(); };
  document.getElementById("Longitude").oninput = function () { drawScene(); ShowSliderValue(); };
  document.getElementById("Latitude").onchange = function () { drawScene(); ShowSliderValue(); };
  document.getElementById("Latitude").oninput = function () { drawScene(); ShowSliderValue(); };

  //set keyboard eventlistener
  document.addEventListener("keydown", dealWithKeyboard, false);
  function dealWithKeyboard(e) {
    const key = e.key;
    if (key === 'ArrowRight') {
      ++document.getElementById("Longitude").value;
      drawScene();
      ShowSliderValue();
    }
    if (key === 'ArrowLeft') {
      --document.getElementById("Longitude").value;
      drawScene();
      ShowSliderValue();
    }
    if (key === 'ArrowUp') {
      ++document.getElementById("Latitude").value;
      drawScene();
      ShowSliderValue();
    }
    if (key === 'ArrowDown') {
      --document.getElementById("Latitude").value;
      drawScene();
      ShowSliderValue();
    }
  }

  //draw function
  function drawScene() {
    //update value
    rotation[1] = degToRad(document.getElementById("Longitude").value) || 0;
    rotation[0] = degToRad(document.getElementById("Latitude").value) || 0;

    //init
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.useProgram(program);
    gl.bindVertexArray(vao);

    //viewport1 - ortho camera
    gl.viewport(0, 0, gl.canvas.width / 2, gl.canvas.height);
    let matrix = mat4.create();
    matrix = mat4.orthoNO(matrix, 0, canvas.width / 40, gl.canvas.height / 20, 0, 15, -15)
    matrix = mat4.translate(matrix, matrix, [13, 10, 0]);
    matrix = mat4.rotateX(matrix, matrix, degToRad(20));
    matrix = mat4.rotateY(matrix, matrix, degToRad(45));
    gl.uniformMatrix4fv(matrixLocation, false, matrix);
    gl.drawArrays(gl.LINE_LOOP, 3 * 2 * 6, 25);
    gl.drawArrays(gl.LINE_STRIP, 3 * 2 * 6 + 25 + 25 + 2, 2);
    gl.drawArrays(gl.LINE_STRIP, 3 * 2 * 6 + 25 + 25 + 2 + 2, 2);
    gl.drawArrays(gl.LINE_STRIP, 3 * 2 * 6 + 25 + 25 + 2 + 2 + 2, 2);
    gl.drawArrays(gl.TRIANGLES, 0, 3 * 2 * 6);

    matrix = mat4.rotateY(matrix, matrix, -rotation[1]);
    matrix = mat4.rotateX(matrix, matrix, -rotation[0]);
    gl.uniformMatrix4fv(matrixLocation, false, matrix);
    gl.drawArrays(gl.LINE_LOOP, 3 * 2 * 6 + 25, 25);
    gl.drawArrays(gl.LINE_STRIP, 3 * 2 * 6 + 25 + 25, 2);

    //viewport2 - perspective camera
    gl.viewport(gl.canvas.width / 2, 0, gl.canvas.width / 2, gl.canvas.height);
    matrix = mat4.create();
    matrix = mat4.perspectiveZO(matrix, 70, 1, 3, -13);
    matrix = mat4.translate(matrix, matrix, [0, 0, -10]);
    matrix = mat4.rotateX(matrix, matrix, degToRad(180));
    matrix = mat4.rotateX(matrix, matrix, rotation[0]);
    matrix = mat4.rotateY(matrix, matrix, rotation[1]);
    gl.uniformMatrix4fv(matrixLocation, false, matrix);
    gl.drawArrays(gl.TRIANGLES, 0, 3 * 2 * 6);
    gl.drawArrays(gl.LINE_STRIP, 3 * 2 * 6 + 25 + 25 + 2, 2);
    gl.drawArrays(gl.LINE_STRIP, 3 * 2 * 6 + 25 + 25 + 2 + 2, 2);
    gl.drawArrays(gl.LINE_STRIP, 3 * 2 * 6 + 25 + 25 + 2 + 2 + 2, 2);
  }
}

//set position
function setGeometry(gl) {
  const cubeSize = 1;
  const circleSize = 10;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      //cube
      cubeSize, cubeSize, -cubeSize,
      cubeSize, -cubeSize, -cubeSize,
      -cubeSize, cubeSize, -cubeSize,
      cubeSize, -cubeSize, -cubeSize,
      -cubeSize, -cubeSize, -cubeSize,
      -cubeSize, cubeSize, -cubeSize,

      cubeSize, cubeSize, cubeSize,
      cubeSize, -cubeSize, cubeSize,
      cubeSize, -cubeSize, -cubeSize,
      cubeSize, cubeSize, cubeSize,
      cubeSize, -cubeSize, -cubeSize,
      cubeSize, cubeSize, -cubeSize,

      -cubeSize, cubeSize, -cubeSize,
      -cubeSize, -cubeSize, -cubeSize,
      -cubeSize, cubeSize, cubeSize,
      -cubeSize, -cubeSize, -cubeSize,
      -cubeSize, -cubeSize, cubeSize,
      -cubeSize, cubeSize, cubeSize,

      cubeSize, cubeSize, cubeSize,
      -cubeSize, -cubeSize, cubeSize,
      cubeSize, -cubeSize, cubeSize,
      -cubeSize, -cubeSize, cubeSize,
      cubeSize, cubeSize, cubeSize,
      -cubeSize, cubeSize, cubeSize,

      cubeSize, -cubeSize, cubeSize,
      -cubeSize, -cubeSize, cubeSize,
      cubeSize, -cubeSize, -cubeSize,
      -cubeSize, -cubeSize, cubeSize,
      -cubeSize, -cubeSize, -cubeSize,
      cubeSize, -cubeSize, -cubeSize,

      -cubeSize, cubeSize, cubeSize,
      cubeSize, cubeSize, cubeSize,
      cubeSize, cubeSize, -cubeSize,
      -cubeSize, cubeSize, cubeSize,
      cubeSize, cubeSize, -cubeSize,
      -cubeSize, cubeSize, -cubeSize,

      //orbit1
      circleSize * Math.cos(degToRad(360 / 24 * 0)), 0, circleSize * Math.sin(degToRad(360 / 24 * 0)),
      circleSize * Math.cos(degToRad(360 / 24 * 1)), 0, circleSize * Math.sin(degToRad(360 / 24 * 1)),
      circleSize * Math.cos(degToRad(360 / 24 * 2)), 0, circleSize * Math.sin(degToRad(360 / 24 * 2)),
      circleSize * Math.cos(degToRad(360 / 24 * 3)), 0, circleSize * Math.sin(degToRad(360 / 24 * 3)),
      circleSize * Math.cos(degToRad(360 / 24 * 4)), 0, circleSize * Math.sin(degToRad(360 / 24 * 4)),
      circleSize * Math.cos(degToRad(360 / 24 * 5)), 0, circleSize * Math.sin(degToRad(360 / 24 * 5)),
      circleSize * Math.cos(degToRad(360 / 24 * 6)), 0, circleSize * Math.sin(degToRad(360 / 24 * 6)),
      circleSize * Math.cos(degToRad(360 / 24 * 7)), 0, circleSize * Math.sin(degToRad(360 / 24 * 7)),
      circleSize * Math.cos(degToRad(360 / 24 * 8)), 0, circleSize * Math.sin(degToRad(360 / 24 * 8)),
      circleSize * Math.cos(degToRad(360 / 24 * 9)), 0, circleSize * Math.sin(degToRad(360 / 24 * 9)),
      circleSize * Math.cos(degToRad(360 / 24 * 10)), 0, circleSize * Math.sin(degToRad(360 / 24 * 10)),
      circleSize * Math.cos(degToRad(360 / 24 * 11)), 0, circleSize * Math.sin(degToRad(360 / 24 * 11)),
      circleSize * Math.cos(degToRad(360 / 24 * 12)), 0, circleSize * Math.sin(degToRad(360 / 24 * 12)),
      circleSize * Math.cos(degToRad(360 / 24 * 13)), 0, circleSize * Math.sin(degToRad(360 / 24 * 13)),
      circleSize * Math.cos(degToRad(360 / 24 * 14)), 0, circleSize * Math.sin(degToRad(360 / 24 * 14)),
      circleSize * Math.cos(degToRad(360 / 24 * 15)), 0, circleSize * Math.sin(degToRad(360 / 24 * 15)),
      circleSize * Math.cos(degToRad(360 / 24 * 16)), 0, circleSize * Math.sin(degToRad(360 / 24 * 16)),
      circleSize * Math.cos(degToRad(360 / 24 * 17)), 0, circleSize * Math.sin(degToRad(360 / 24 * 17)),
      circleSize * Math.cos(degToRad(360 / 24 * 18)), 0, circleSize * Math.sin(degToRad(360 / 24 * 18)),
      circleSize * Math.cos(degToRad(360 / 24 * 19)), 0, circleSize * Math.sin(degToRad(360 / 24 * 19)),
      circleSize * Math.cos(degToRad(360 / 24 * 20)), 0, circleSize * Math.sin(degToRad(360 / 24 * 20)),
      circleSize * Math.cos(degToRad(360 / 24 * 21)), 0, circleSize * Math.sin(degToRad(360 / 24 * 21)),
      circleSize * Math.cos(degToRad(360 / 24 * 22)), 0, circleSize * Math.sin(degToRad(360 / 24 * 22)),
      circleSize * Math.cos(degToRad(360 / 24 * 23)), 0, circleSize * Math.sin(degToRad(360 / 24 * 23)),
      circleSize * Math.cos(degToRad(360 / 24 * 24)), 0, circleSize * Math.sin(degToRad(360 / 24 * 24)),

      //orbit2
      0, circleSize * Math.cos(degToRad(360 / 24 * 0)), circleSize * Math.sin(degToRad(360 / 24 * 0)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 1)), circleSize * Math.sin(degToRad(360 / 24 * 1)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 2)), circleSize * Math.sin(degToRad(360 / 24 * 2)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 3)), circleSize * Math.sin(degToRad(360 / 24 * 3)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 4)), circleSize * Math.sin(degToRad(360 / 24 * 4)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 5)), circleSize * Math.sin(degToRad(360 / 24 * 5)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 6)), circleSize * Math.sin(degToRad(360 / 24 * 6)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 7)), circleSize * Math.sin(degToRad(360 / 24 * 7)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 8)), circleSize * Math.sin(degToRad(360 / 24 * 8)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 9)), circleSize * Math.sin(degToRad(360 / 24 * 9)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 10)), circleSize * Math.sin(degToRad(360 / 24 * 10)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 11)), circleSize * Math.sin(degToRad(360 / 24 * 11)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 12)), circleSize * Math.sin(degToRad(360 / 24 * 12)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 13)), circleSize * Math.sin(degToRad(360 / 24 * 13)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 14)), circleSize * Math.sin(degToRad(360 / 24 * 14)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 15)), circleSize * Math.sin(degToRad(360 / 24 * 15)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 16)), circleSize * Math.sin(degToRad(360 / 24 * 16)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 17)), circleSize * Math.sin(degToRad(360 / 24 * 17)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 18)), circleSize * Math.sin(degToRad(360 / 24 * 18)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 19)), circleSize * Math.sin(degToRad(360 / 24 * 19)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 20)), circleSize * Math.sin(degToRad(360 / 24 * 20)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 21)), circleSize * Math.sin(degToRad(360 / 24 * 21)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 22)), circleSize * Math.sin(degToRad(360 / 24 * 22)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 23)), circleSize * Math.sin(degToRad(360 / 24 * 23)),
      0, circleSize * Math.cos(degToRad(360 / 24 * 24)), circleSize * Math.sin(degToRad(360 / 24 * 24)),

      //look
      0, 0, -circleSize,
      0, 0, 0,

      //line1
      0, 0, -circleSize,
      0, 0, 0,

      //line2
      0, -circleSize, 0,
      0, 0, 0,

      //line3
      circleSize, 0, 0,
      0, 0, 0,

    ]),
    gl.STATIC_DRAW);
}

//set color
function setColors(gl) {
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Uint8Array([
      //cube
      100, 120, 160,
      100, 120, 160,
      100, 120, 160,
      100, 120, 160,
      100, 120, 160,
      100, 120, 160,

      150, 170, 80,
      150, 170, 80,
      150, 170, 80,
      150, 170, 80,
      150, 170, 80,
      150, 170, 80,

      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,

      80, 120, 200,
      80, 120, 200,
      80, 120, 200,
      80, 120, 200,
      80, 120, 200,
      80, 120, 200,

      80, 70, 100,
      80, 70, 100,
      80, 70, 100,
      80, 70, 100,
      80, 70, 100,
      80, 70, 100,

      30, 70, 150,
      30, 70, 150,
      30, 70, 150,
      30, 70, 150,
      30, 70, 150,
      30, 70, 150,

      //orbit1
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,

      //orbit2
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0,

      //look
      0, 0, 0,
      0, 0, 0,

      //line1
      0, 0, 255,
      0, 0, 255,

      //line2
      0, 255, 0,
      0, 255, 0,

      //line3
      255, 0, 0,
      255, 0, 0,
    ]),
    gl.STATIC_DRAW);
}
main();