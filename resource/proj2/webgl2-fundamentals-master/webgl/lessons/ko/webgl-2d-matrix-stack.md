Title: WebGL2 행렬 스택 구현
Description: WebGL에서 Canvas 2D의 translate/rotate/scale 함수를 구현하는 방법
TOC: 2D - 행렬 스택


이 글은 [WebGL 2D DrawImage](webgl-2d-drawimage.html)에서 이어집니다.
아직 읽지 않았다면 [해당 글](webgl-2d-drawimage.html)부터 읽으시는것을 추천드립니다.

지난 글에서 우리는 source rectangle과 destination rectangle을 모두 지정하는 기능을 포함하여 Canvas 2D의 `drawImage` 함수와 동일한 기능을 WebGL로 구현했습니다.

임의의 지점에서 회전 및 크기 조정하는 기능은 아직 구현하지 않았습니다.
더 많은 매개변수를 추가하여 이를 수행할 수 있으며, 최소한 중심점과 rotation 그리고 x와 y의 scale을 지정해야 합니다.
다행히 더 일반적이고 유용한 방법이 있습니다.
Canvas 2D API는 행렬 스택을 사용하여 이를 수행합니다.
Canvas 2D API의 행렬 스택 함수는 `save`, `restore`, `translate`, `rotate`, `scale`이 있습니다.

행렬 스택의 구현은 매우 간단합니다.
우선 행렬의 스택을 만듭니다.
그리고 [이전에 만들었던 함수들](webgl-2d-matrices.html)을 이용하여 translation, rotation, scale 행렬로 스택의 최상단 행렬을 곱하는 함수를 만듭니다.

다음은 구현입니다.

먼저 생성자와 `save` 그리고 `restore` 함수입니다.

```
function MatrixStack() {
  this.stack = [];

  // 스택이 비어있기 때문에 초기 행렬을 넣습니다.
  this.restore();
}

// pop을 통해 이전에 저장된 행렬을 복원합니다.
MatrixStack.prototype.restore = function() {
  this.stack.pop();
  // 스택이 완전히 비어 있으면 안됩니다.
  if (this.stack.length < 1) {
    this.stack[0] = m4.identity();
  }
};

// 현재 행렬의 복사본을 스택에 push합니다.
MatrixStack.prototype.save = function() {
  this.stack.push(this.getCurrentMatrix());
};
```

또한 최상단 행렬의 get과 set을 위한 함수가 필요합니다.

```
// 현재 행렬(스택의 최상단)의 복사본 get
MatrixStack.prototype.getCurrentMatrix = function() {
  return this.stack[this.stack.length - 1].slice();
};

// 현재 행렬 set
MatrixStack.prototype.setCurrentMatrix = function(m) {
  return this.stack[this.stack.length - 1] = m;
};
```

마지막으로 이전의 행렬 함수를 이용하여`translate`, `rotate`, `scale`을 구현해야 합니다.

```
// 현재 행렬을 이동
MatrixStack.prototype.translate = function(x, y, z) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.translate(m, x, y, z));
};

// 현재 행렬을 Z를 중심으로 회전
MatrixStack.prototype.rotateZ = function(angleInRadians) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.zRotate(m, angleInRadians));
};

// 현재 행렬을 크기 조정
MatrixStack.prototype.scale = function(x, y, z) {
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.scale(m, x, y, z));
};
```

3D 행렬 수학 함수를 사용하고 있다는 것에 주의하세요.
Translation의 `z`에 `0`을 사용하고 scale의 `z`에 `1`을 적용해도 되지만, 저같은 경우 Canvas 2D의 2D 함수 사용에 너무 익숙해서 종종 `z`에 대한 지정을 잊어버려 코드가 제대로 동작하지 않는 경우가 있었습니다. 그러니 `z`값의 입력은 선택적으로 만들어봅시다.

```
// 현재 행렬을 이동
MatrixStack.prototype.translate = function(x, y, z) {
+  if (z === undefined) {
+    z = 0;
+  }
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.translate(m, x, y, z));
};

...

// 현재 행렬을 크기 조정
MatrixStack.prototype.scale = function(x, y, z) {
+  if (z === undefined) {
+    z = 1;
+  }
  var m = this.getCurrentMatrix();
  this.setCurrentMatrix(m4.scale(m, x, y, z));
};
```

이전 강의인 [`drawImage`](webgl-2d-drawimage.html)에 이런 코드들이 있었습니다.

```
// 이 행렬은 픽셀 공간에서 클립 공간으로의 변환에 사용됩니다.
var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

// 이 행렬은 쿼드를 dstX, dstY만큼 이동시킵니다.
matrix = m4.translate(matrix, dstX, dstY, 0);

// 이 행렬은 크기 1짜리 쿼드를 
// dstWidth, dstHeight 크기로 변환합니다.
matrix = m4.scale(matrix, dstWidth, dstHeight, 1);
```

이제는 행렬 스택을 생성하기만 하면 됩니다.

```
var matrixStack = new MatrixStack();
```

그리고 스택의 최상단 행렬에 곱합니다.

```
// 이 행렬은 픽셀 공간에서 클립 공간으로의 변환에 사용됩니다.
var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

+// 행렬 스택은 픽셀 공간을 기준으로 되어 있으므로
+// 클립 공간에서 픽셀 골간으로 변환하는 투영행렬 뒤에 와야 합니다.
+matrix = m4.multiply(matrix, matrixStack.getCurrentMatrix());

// 이 행렬은 쿼드를 dstX, dstY만큼 이동시킵니다.
matrix = m4.translate(matrix, dstX, dstY, 0);

// 이 행렬은 크기 1짜리 쿼드를 
// dstWidth, dstHeight 크기로 변환합니다.
matrix = m4.scale(matrix, dstWidth, dstHeight, 1);
```

이제 Canvas 2D API를 사용하는 것과 동일한 방법으로 사용할 수 있습니다.

행렬 스택을 사용하는 방법에 대해 잘 이해가 안되신다면,
캔버스의 원점을 이동하고 회전하는 것과 같다고 생각하시면 됩니다.
예를 들어 기본적으로 2D Canvas에서 원점(0,0)은 왼쪽 상단 모서리입니다.

만약 원점을 캔버스의 중앙으로 옮기고 0,0에 이미지를 그리면 캔버스의 중앙부터 그려집니다.

[이전 예제](webgl-2d-drawimage.html)를 가져와서 이미지 하나를 그려봅시다.

```
var textureInfo = loadImageAndCreateTextureInfo('resources/star.jpg');

function draw(time) {
  gl.clear(gl.COLOR_BUFFER_BIT);

  matrixStack.save();
  matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
  matrixStack.rotateZ(time);

  drawImage(
    textureInfo.texture,
    textureInfo.width,
    textureInfo.height,
    0, 0);

  matrixStack.restore();
}
```

결과는 아래와 같습니다.

{{{example url="../webgl-2d-matrixstack-01.html" }}}

`drawImage`에 `0, 0`을 전달해도 `matrixStack.translate`를 사용하여 원점을 캔버스의 중앙으로 옮겼기 때문에 이미지가 해당 중심을 기준으로 그려지고 회전하는 것을 볼 수 있습니다.

회전 중심을 이미지의 중앙으로 옮겨봅시다.

```
matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
matrixStack.rotateZ(time);
+matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
```

이제 캔버스 중앙에 있는 이미지의 중심을 기준으로 회전합니다.

{{{example url="../webgl-2d-matrixstack-02.html" }}}

각 모서리에서 회전하는 동일한 이미지를 그려봅시다.

```
matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
matrixStack.rotateZ(time);

+matrixStack.save();
+{
+  matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // 중앙 이미지의 중심에서 왼쪽 상단 모서리로 이동합니다.
+  matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
+  matrixStack.rotateZ(Math.sin(time * 2.2));
+  matrixStack.scale(0.2, 0.2);
+  // 이제 그리려는 이미지의 오른쪽 하단 모서리가 필요합니다.
+  matrixStack.translate(-textureInfo.width, -textureInfo.height);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // 중앙 이미지의 중심에서 오른쪽 상단 모서리로 이동합니다.
+  matrixStack.translate(textureInfo.width / 2, textureInfo.height / -2);
+  matrixStack.rotateZ(Math.sin(time * 2.3));
+  matrixStack.scale(0.2, 0.2);
+  // 이제 그리려는 이미지의 왼쪽 하단 모서리가 필요합니다.
+  matrixStack.translate(0, -textureInfo.height);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // 중앙 이미지의 중심에서 왼쪽 하단 모서리로 이동합니다.
+  matrixStack.translate(textureInfo.width / -2, textureInfo.height / 2);
+  matrixStack.rotateZ(Math.sin(time * 2.4));
+  matrixStack.scale(0.2, 0.2);
+  // 이제 그리려는 이미지의 오른쪽 상단 모서리가 필요합니다.
+  matrixStack.translate(-textureInfo.width, 0);
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
+
+matrixStack.save();
+{
+  // 중앙 이미지의 중심에서 오른쪽 하단 모서리로 이동합니다.
+  matrixStack.translate(textureInfo.width / 2, textureInfo.height / 2);
+  matrixStack.rotateZ(Math.sin(time * 2.5));
+  matrixStack.scale(0.2, 0.2);
+  // 이제 그리려는 이미지의 왼쪽 상단 모서리가 필요합니다.
+  matrixStack.translate(0, 0);  // 0,0은 이 라인이 실제로는 아무것도 하지 않음을 의미
+
+  drawImage(
+    textureInfo.texture,
+    textureInfo.width,
+    textureInfo.height,
+    0, 0);
+
+}
+matrixStack.restore();
```

아래는 그 결과입니다.

{{{example url="../webgl-2d-matrixstack-03.html" }}}

`translate`, `rotateZ`, `scale` 등의 다양한 행렬 스택 함수를 원점 이동으로 생각하면, 저는 이런 방식으로 회전의 중심을 설정합니다. *drawImage를 호출할 때 이미지의 특정 부분이 **이전 원점에 있도록** 하기 위해 원점을 어디로 이동해야 할까?*

400x300 캔버스에서 `matrixStack.translate(210, 150)`를 호출한다고 해봅시다.
이 시점에서 원점은 `210, 150`이고 모든 그리기는 해당 지점에 상대적이 됩니다.
`drawImage`를 `0, 0`으로 호출했을 때 이미지가 거기에 그려지게 됩니다.

<img class="webgl_center" width="400" src="resources/matrixstack-before.svg" />

오른쪽 하단이 회전의 중심이 되길 원한다고 가정해봅시다.
이런 경우 `drawImage`를 호출할 때 회전의 중심이 되고 싶은 지점이 현재 원점이 되려면 어디로 원점을 옮겨야 할까요?
텍스처의 우측 하단 `-textureWidth, -textureHeight`이므로 이제 `drawImage`를 `0,0`으로 호출하면 텍스처는 아래와 같이 그려지는데 오른쪽 하단이 이전 원점에 위치하게 됩니다.

<img class="webgl_center" width="400" src="resources/matrixstack-after.svg" />

어느 시점이든 이전에 행렬 스택에 했던 작업은 중요하지 않습니다.
원점을 움직이거나 크기 조정하거나 회전하기 위한 여러 작업을 수행했지만 `drawImage`를 호출하기 전이라면 원점이 어디든 상관없습니다.
우리는 새로운 텍스처가 그려질 위치에 상대적으로 새로운 원점을 이동시키기만 하면 됩니다.

행렬 스택이 이전에 다뤘던 [장면 그래프](webgl-scene-graph.html)와 굉장히 비슷하다는 것을 알아채셨을 겁니다.
장면 그래프는 노드 트리가 있으며 트리를 탐색하면서 각 노드를 부모 노드와 곱했습니다.
행렬 스택은 사실상 동일한 작업을 다른 버전으로 구현한 것입니다.
