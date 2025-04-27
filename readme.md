# Computer Graphics Practice
이 프로젝트는 Three.js(proj1)와 WebGL(proj2, proj3)를 이용한 컴퓨터그래픽스 실습입니다.
총 3가지의 프로젝트로 구성되어있습니다.

## Proj3
### 사용기술
- WebGL
- Express.js
- HTML5
### 설명
- 쉐이더 코드를 직접 작성하고 컴파일합니다.
- 주어진 평면 .png 파일에서 음영값을 seed 값으로, 지형의 높낮이를 결정해 지형을 랜더링합니다.
- 키보드에서 키값을 입력받아 큐브를 조작할 수 있습니다.
- rotate, transformation을 사용해 큐브를 움직일 수 있습니다.
- scaling을 이용해 화면을 확대 및 축소할 수 있습니다.
- bullet을 구현합니다. bullet은 발사되어 중력가속도에 이끌려 지면에 충돌합니다. 지면에 충돌시 사라집니다.
### 시연영상
![proj3](https://github.com/user-attachments/assets/409c796d-0dc3-4101-893a-37aab5dbe44d)
[소스코드](https://github.com/hyeongcheolkim/ComputerGraphicsPractice/blob/main/resource/proj3/src/proj3.js)

## Proj2
### 사용기술
- WebGL
- Express.js
- HTML5
### 설명
- 쉐이더 코드를 직접 작성하고 컴파일합니다.
- 컴파일된 쉐이더를 프로그램에 링크합니다.
- rotate를 직접 구현합니다.
### 시연영상
![proj2](https://github.com/user-attachments/assets/b7242e5d-0269-4915-a9da-f15664657009)
[소스코드](https://github.com/hyeongcheolkim/ComputerGraphicsPractice/blob/main/resource/proj2/proj2.js)

## Proj1
### 사용기술
- Three.js
- Express.js
- HTML5
### 설명
- 3D공간에 배치된 사물을 카메라로 촬영합니다.
- 빛과 사물의 상호작용을 구현합니다.
- 사물에 움직임을 줄 수 있습니다.
### 시연영상
![proj1](https://github.com/user-attachments/assets/8cbb23a1-329e-4b4b-86f7-a6ed1ed59631)
[소스코드](https://github.com/hyeongcheolkim/ComputerGraphicsPractice/blob/main/resource/proj1/proj1/proj1.js)

## 빌드 및 실행 방법
1. [Node.js](https://nodejs.org/)가 설치되어 있어야 합니다.
2. 커맨드창을 열고 이 프로젝트의 root폴더로 이동해 'npm install'을 입력합니다.
3. 'node app.js'을 입력합니다.
4. 3000포트로 접속합니다.
