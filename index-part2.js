
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/ellipsoids.json"; // ellipsoids file loc

function getJSONFile(url,descr) {
  try {
    if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
    throw "getJSONFile: parameter not a string";
    else {
      var httpReq = new XMLHttpRequest(); // a new http request
      httpReq.open("GET",url,false); // init the request
      httpReq.send(null); // send the request
      var startTime = Date.now();
      while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
        if ((Date.now()-startTime) > 3000)
        break;
      } // until its loaded or we time out after three seconds
      if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
      throw "Unable to open "+descr+" file!";
      else
      return JSON.parse(httpReq.response);
    } // end if good params
  } // end try

  catch(e) {
    console.log(e);
    return(String.null);
  }
} // end get json file

var triangles = getJSONFile(INPUT_TRIANGLES_URL,"triangles");
var spheres = getJSONFile(INPUT_TRIANGLES_URL,"spheres");
var lights = [{x: 2, y: 4, z: -0.5, "ambient": [1,1,1], "diffuse": [1,1,1], "specular": [1,1,1]}];
var gl;

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {
  }
  if (!gl) {
    alert("Could not initialise WebGL, sorry :-(");
  }
}


function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}


var shaderProgram;

function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

  shaderProgram.lightLocation = gl.getUniformLocation(shaderProgram, "light.position");
  shaderProgram.lightAmbient = gl.getUniformLocation(shaderProgram, "light.ambient");
  shaderProgram.lightDiffuse = gl.getUniformLocation(shaderProgram, "light.diffuse");
  shaderProgram.lightSpecular = gl.getUniformLocation(shaderProgram, "light.specular");

  shaderProgram.materialShininess = gl.getUniformLocation(shaderProgram, "material.shininess");
  shaderProgram.materialAmbient = gl.getUniformLocation(shaderProgram, "material.ambient");
  shaderProgram.materialDiffuse = gl.getUniformLocation(shaderProgram, "material.diffuse");
  shaderProgram.materialSpecular = gl.getUniformLocation(shaderProgram, "material.specular");
}


var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
  var copy = mat4.create();
  mat4.set(mvMatrix, copy);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

  var normalMatrix = mat3.create();
  mat3.fromMat4(normalMatrix,mvMatrix);
  mat3.invert(normalMatrix,normalMatrix);
  mat3.transpose(normalMatrix,normalMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);

  console.log(mvMatrix);
}

function setColorUniforms(material){
  gl.uniform4fv(shaderProgram.lightLocation,[lights[0].x,lights[0].y,lights[0].z,0.0]);
  gl.uniform4fv(shaderProgram.lightDiffuse,[lights[0].diffuse[0],lights[0].diffuse[1],lights[0].diffuse[2],0.0]);
  gl.uniform4fv(shaderProgram.lightAmbient,[lights[0].ambient[0],lights[0].ambient[1],lights[0].ambient[2],0.0]);
  gl.uniform4fv(shaderProgram.lightSpecular,[lights[0].specular[0],lights[0].specular[1],lights[0].specular[2],0.0]);

  gl.uniform1f(shaderProgram.materialShininess,material.n);
  gl.uniform4fv(shaderProgram.materialDiffuse,[material.diffuse[0],material.diffuse[1],material.diffuse[2],0.0]);
  gl.uniform4fv(shaderProgram.materialAmbient,[material.ambient[0],material.ambient[1],material.ambient[2],0.0]);
  gl.uniform4fv(shaderProgram.materialSpecular,[material.specular[0],material.specular[1],material.specular[2],0.0]);
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

var triangleVertexPositionBuffer;
var triangleVertexColorBuffer;
var triangleVertexIndexBuffer;
var triangleVertexNormalBuffer;

var squareVertexPositionBuffer;
var squareVertexColorBuffer;
var squareVertexIndexBuffer;
var squareVertexNormalBuffer;

var sphereVertexPositionBuffer=[];
var sphereVertexNormalBuffer=[];
var sphereVertexIndexBuffer=[];
var sphereVertexColorBuffer=[];

function drawTriangle(){
  //position

  triangleVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
  var vertices = [];
  for(var i=0;i<triangles[0].vertices.length;i++){
    for(var j=0;j<triangles[0].vertices[i].length;j++){
      vertices.push(triangles[0].vertices[i][j]);
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  triangleVertexPositionBuffer.itemSize = 3;
  triangleVertexPositionBuffer.numItems = 3;

  //index
  var indexData=[];
  for(var i=0;i<triangles[0].triangles.length;i++){
    for(var j=0;j<triangles[0].triangles[i].length;j++){
      indexData.push(triangles[0].triangles[i][j]);
    }
  }
  triangleVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
  triangleVertexIndexBuffer.itemSize = 1;
  triangleVertexIndexBuffer.numItems = indexData.length;

  //color
  triangleVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
  var colors = [
    0.6, 0.4, 0.4, 1.0,
    0.6, 0.4, 0.4, 1.0,
    0.6, 0.4, 0.4, 1.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  triangleVertexColorBuffer.itemSize = 4;
  triangleVertexColorBuffer.numItems = 3;

  //normal
  var normalData=[];
  for(var i=0;i<triangles[0].normals.length;i++){
    for(var j=0;j<triangles[0].normals[i].length;j++){
      normalData.push(triangles[0].normals[i][j]);
    }
  }
  triangleVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
  triangleVertexNormalBuffer.itemSize = 3;
  triangleVertexNormalBuffer.numItems = normalData.length / 3;
}

function drawSquare(){
  //position
  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  var vertices = [];
  for(var i=0;i<triangles[1].vertices.length;i++){
    for(var j=0;j<triangles[1].vertices[i].length;j++){
      vertices.push(triangles[1].vertices[i][j]);
    }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 3;
  squareVertexPositionBuffer.numItems = 4;

  //index
  var indexData=[];
  for(var i=0;i<triangles[1].triangles.length;i++){
    for(var j=0;j<triangles[1].triangles[i].length;j++){
      indexData.push(triangles[1].triangles[i][j]);
    }
  }
  squareVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
  squareVertexIndexBuffer.itemSize = 1;
  squareVertexIndexBuffer.numItems = indexData.length;

  //color
  squareVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
  colors = [];
  for (var i=0; i < 4; i++) {
    colors = colors.concat([0.6, 0.6, 0.4, 1.0]);
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  squareVertexColorBuffer.itemSize = 4;
  squareVertexColorBuffer.numItems = 4;

  //normal
  var normalData=[];
  for(var i=0;i<triangles[1].normals.length;i++){
    for(var j=0;j<triangles[1].normals[i].length;j++){
      normalData.push(triangles[1].normals[i][j]);
    }
  }
  squareVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
  squareVertexNormalBuffer.itemSize = 3;
  squareVertexNormalBuffer.numItems = normalData.length / 3;
}


function drawSphere(colorsArray,a,b,c,centerX,centerY,centerZ){

  var moonVertexPositionBuffer;
  var moonVertexNormalBuffer;
  var moonVertexIndexBuffer;
  var moonVertexColorBuffer;

  var latitudeBands = 30;
  var longitudeBands = 30;
  var radius = 0.2;

  var vertexPositionData = [];
  var normalData = [];

  for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
    var theta = latNumber * Math.PI / latitudeBands;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);

    for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
      var phi = longNumber * 2 * Math.PI / longitudeBands;
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);

      var x = cosPhi * sinTheta;
      var y = cosTheta;
      var z = sinPhi * sinTheta;
      var u = 1 - (longNumber / longitudeBands);
      var v = 1 - (latNumber / latitudeBands);

      normalData.push(x);
      normalData.push(y);
      normalData.push(z);

      vertexPositionData.push(centerX+(a * x));
      vertexPositionData.push(centerY+(b * y));
      vertexPositionData.push(centerZ+(c * z));
    }
  }

  var indexData = [];
  for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
    for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
      var first = (latNumber * (longitudeBands + 1)) + longNumber;
      var second = first + longitudeBands + 1;
      indexData.push(first);
      indexData.push(second);
      indexData.push(first + 1);

      indexData.push(second);
      indexData.push(second + 1);
      indexData.push(first + 1);
    }
  }

  moonVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
  moonVertexNormalBuffer.itemSize = 3;
  moonVertexNormalBuffer.numItems = normalData.length / 3;

  moonVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
  moonVertexPositionBuffer.itemSize = 3;
  moonVertexPositionBuffer.numItems = vertexPositionData.length / 3;

  moonVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
  moonVertexIndexBuffer.itemSize = 1;
  moonVertexIndexBuffer.numItems = indexData.length;

  moonVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,moonVertexColorBuffer);
  var colors =[];
  for(var i=0;i<moonVertexNormalBuffer.numItems;i++){
    colors=colors.concat(colorsArray);
  }
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(colors),gl.STATIC_DRAW);
  moonVertexColorBuffer.itemSize = 4;
  moonVertexColorBuffer.numItems = moonVertexNormalBuffer.numItems;


  sphereVertexPositionBuffer.push(moonVertexPositionBuffer);
  sphereVertexNormalBuffer.push(moonVertexNormalBuffer);
  sphereVertexIndexBuffer.push(moonVertexIndexBuffer);
  sphereVertexColorBuffer.push(moonVertexColorBuffer);

}

function initBuffers() {
  drawTriangle();
  drawSquare();
  drawSphere([0.0,0.0,0.6,1.0],0.2,0.2,0.1,0.75,0.75,0.5);//top colors,a,b,c,centerX,centerY,centerZ
  drawSphere([0.6,0.6,0.0,1.0],0.15,0.25,0.1,0.5,0.5,0.5);//middle
  drawSphere([0.6,0.0,0.6,1.0],0.2,0.15,0.1,0.75,0.25,0.5);//bottom
}



function drawScene() {


  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //perspective setup
  mat4.perspective(pMatrix ,Math.PI/2, gl.viewportWidth / gl.viewportHeight, 0.1, 1000.0);
  console.log(pMatrix);

  //camera setup
  mat4.lookAt(mvMatrix,[0.5,0.5,-0.5],[0.5,0.5,0],[0,1,0]);

  //triangle
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleVertexIndexBuffer);
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, triangleVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  //square
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareVertexIndexBuffer);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, squareVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, squareVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  //sphere 1
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer[0]);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer[0].itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer[0]);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sphereVertexNormalBuffer[0].itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer[0]);
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer[0]);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, sphereVertexColorBuffer[0].itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, sphereVertexIndexBuffer[0].numItems, gl.UNSIGNED_SHORT, 0);

  //sphere 2
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer[1]);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer[1].itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer[1]);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sphereVertexNormalBuffer[1].itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer[1]);
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer[1]);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, sphereVertexColorBuffer[1].itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, sphereVertexIndexBuffer[1].numItems, gl.UNSIGNED_SHORT, 0);

  //sphere 3
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer[2]);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer[2].itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer[2]);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sphereVertexNormalBuffer[2].itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer[2]);
  gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexColorBuffer[2]);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, sphereVertexColorBuffer[2].itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, sphereVertexIndexBuffer[2].numItems, gl.UNSIGNED_SHORT, 0);

}



function webGLStart() {
  var canvas = document.getElementById("webgl-canvas");
  initGL(canvas);
  initShaders();
  initBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  drawScene();
}
