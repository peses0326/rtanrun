/** 캔버스 설정 */
const canvas = document.getElementById("canvas"); // 캔버스 요소 가져오기
canvas.width = 800; // 캔버스 너비 설정
canvas.height = 500; // 캔버스 높이 설정
const ctx = canvas.getContext("2d"); // 2D 렌더링 컨텍스트 가져오기

/** 게임 상태 변수 */
let gameStarted = false; // 게임 시작 여부
const BG_MOVING_SPEED = 5; // 배경 이동 속도
let bgX = 0; // 배경 X 좌표
let scoreText = document.getElementById("score"); // 점수 표시 요소
let score = 0; // 현재 점수

/** 게임 변수 */
let timer = 0; // 장애물 생성 시간
let obstacleArray = []; // 장애물 배열
let gameOver = false; // 게임 종료 여부
let jump = false; // 점프 여부

/** 르탄이 설정 */
const RTAN_WIDTH = 100; // 르탄이 가로 너비
const RTAN_HEIGHT = 100; // 르탄이 세로 높이
const RTAN_INITIAL_X_POSITION = 10; // 르탄이의 초기 X 좌표
const RTAN_INITIAL_Y_POSITION = 400; // 르탄이의 초기 Y 좌표

/** 장애물 설정 */
const OBSTACLE_WIDTH = 30; // 장애물 너비
const OBSTACLE_HEIGHT = 30; // 장애물 높이
const OBSTACLE_FREQUENCY = 50; // 장애물 생성 빈도
const OBSTACLE_SPEED = 7; // 장애물 이동 속도

/** 오디오 객체 생성 및 설정 */
const jumpSound = new Audio(); // 점프 소리
jumpSound.src = "./sounds/jump.mp3";
const bgmSound = new Audio(); // 배경 음악
bgmSound.src = "./sounds/bgm.mp3";
const scoreSound = new Audio(); // 점수 획득 소리
scoreSound.src = "./sounds/score.mp3";
const defeatSound = new Audio(); // 게임 오버 소리
defeatSound.src = "./sounds/defeat1.mp3";

/** 이미지 객체 생성 및 설정 */
// (1) 배경
const bgImage = new Image();
bgImage.src = "./images/background.png";
// (2) 게임 시작
const startImage = new Image();
startImage.src = "./images/gamestart.png";
// (3) 게임 오버
const gameoverImage = new Image();
gameoverImage.src = "./images/gameover.png";
// (4) 게임 재시작
const restartImage = new Image();
restartImage.src = "./images/restart.png";
// (5) 달리는 르탄이 A
const rtanAImage = new Image();
rtanAImage.src = "./images/rtan_running_a.png";
// (6) 달리는 르탄이 B
const rtanBImage = new Image();
rtanBImage.src = "./images/rtan_running_b.png";
// (7) 게임 오버 르탄이
const rtanCrashImage = new Image();
rtanCrashImage.src = "./images/rtan_crash.png";
// (8) 장애물
const obstacle = new Image();
obstacle.src = "./images/obstacle2.png";

/**
 * 게임 시작 화면을 그리는 함수
 */
function drawStartScreen() {
  // 배경 이미지 그리기
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  // 시작 이미지 그리기
  const imageWidth = 473;
  const imageHeight = 316;
  const imageX = canvas.width / 2 - imageWidth / 2;
  const imageY = canvas.height / 2 - imageHeight / 2;
  ctx.drawImage(startImage, imageX, imageY, imageWidth, imageHeight);
}

/**
 * 이미지 로딩 완료 시 게임 시작 화면 그리기
 */
let bgImageLoaded = new Promise((resolve) => {
  bgImage.onload = resolve;
});

let startImageLoaded = new Promise((resolve) => {
  startImage.onload = resolve;
});

Promise.all([bgImageLoaded, startImageLoaded]).then(drawStartScreen);

/** 르탄이 객체 정의 */
const rtan = {
  x: RTAN_INITIAL_X_POSITION,
  y: RTAN_INITIAL_Y_POSITION,
  width: RTAN_WIDTH,
  height: RTAN_HEIGHT,
  draw() {
    if (gameOver) {
      // 게임 오버 시 충돌 이미지 그리기
      ctx.drawImage(rtanCrashImage, this.x, this.y, this.width, this.height);
    } else {
      // 달리는 애니메이션 구현
      if (timer % 20 > 10) {
        ctx.drawImage(rtanAImage, this.x, this.y, this.width, this.height);
      } else {
        ctx.drawImage(rtanBImage, this.x, this.y, this.width, this.height);
      }
    }
  },
};

/** 장애물 클래스 정의 */
class Obstacle {
  constructor() {
    this.x = canvas.width;
    this.y = Math.floor(Math.random() * (canvas.height - OBSTACLE_HEIGHT - 20)) + 20; // 장애물이 canvas의 상단과 하단에서 20px 이내에 생성되지 않도록 조정
    this.width = OBSTACLE_WIDTH;
    this.height = OBSTACLE_HEIGHT;
  }
  draw() {
    ctx.drawImage(obstacle, this.x, this.y, this.width, this.height); // 장애물 이미지 그리기
  }
}

/**
 * 마우스 클릭 이벤트 처리
 */
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 게임 시작 조건 확인
  if (
    !gameStarted &&
    x >= 0 &&
    x <= canvas.width &&
    y >= 0 &&
    y <= canvas.height
  ) {
    gameStarted = true;
    animate();
  }
});

/**
 * 게임 애니메이션 함수
 */
function animate() {
  if (gameOver) {
    return;
  }

  // 배경 음악 재생
  bgmSound.play();

  // 캔버스 클리어
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 배경 이미지 그리기 (무한 스크롤 효과)
  ctx.drawImage(bgImage, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, bgX + canvas.width, 0, canvas.width, canvas.height);
  bgX -= BG_MOVING_SPEED;
  if (bgX < -canvas.width) bgX = 0;

  // 장애물 생성 및 업데이트
  if (timer % OBSTACLE_FREQUENCY === 0) {
    const obstacle = new Obstacle();
    obstacleArray.push(obstacle);
  }

  // 장애물 처리
  obstacleArray.forEach((a) => {
    a.x -= OBSTACLE_SPEED; // 한 프레임이 지날 때마다 장애물을 왼쪽으로 일정량 이동

    // 화면 밖으로 나간 장애물 제거 및 점수 증가
    if (a.x < -OBSTACLE_WIDTH) {
      obstacleArray.shift();
      score += 10;
      scoreText.innerHTML = "현재점수: " + score;
      scoreSound.pause(); // 현재 재생 중인 점수 소리 중지
      scoreSound.currentTime = 0; // 소리 재생 위치를 시작으로 초기화
      scoreSound.play(); // 점수 획득 소리 재생
    }

    // 충돌 검사
    if (collision(rtan, a)) {
      timer = 0;
      gameOver = true;
      jump = false;
      bgmSound.pause();
      defeatSound.play();
    } else {
      a.draw();
    }
  });

  // 르탄이 그리기
  rtan.draw();

  // 게임 오버 화면 표시
  if (gameOver) {
    // 게임 오버 이미지 그리기  
    ctx.drawImage(gameoverImage,canvas.width / 2 - 100, canvas.height / 2 - 50, 200, 100);
    ctx.drawImage(restartImage, canvas.width / 2 - 50, canvas.height / 2 + 50, 100, 50);
    // 게임 오버 시 르탄이 위치 초기화
    rtan.x = 10;
    rtan.y = 400;
  }

  // 타이머 증가 및 다음 프레임 요청
  timer++;
  requestAnimationFrame(animate);

  // 점프 처리
  if (jump) {
    rtan.y -= 3; // 스페이스바를 누르고 있으면 rtan의 y값 감소
    if (rtan.y < 20) rtan.y = 20; // rtan이 canvas 상단을 넘지 않도록 조정
  } else {
    if (rtan.y < RTAN_INITIAL_Y_POSITION) {
      rtan.y += 3; // 스페이스바를 떼면 rtan의 y값 증가
      if (rtan.y > RTAN_INITIAL_Y_POSITION) rtan.y = RTAN_INITIAL_Y_POSITION; // rtan이 초기 위치 아래로 내려가지 않도록 조정
    }
  }
}

/**
 * 키보드 이벤트 처리 (스페이스바 점프)
 */
document.addEventListener("keydown", function (e) {
  if (e.code === "Space" && !jump) { // 점프 중복 재생 방지
    jump = true; // 스페이스바를 누르고 있을 때 점프 상태 유지
    jumpSound.play(); // 점프 소리 재생
  }
});

document.addEventListener("keyup", function (e) {
  if (e.code === "Space") {
    jump = false; // 스페이스바를 떼면 점프 상태 해제
  }
});

/**
 * 충돌 체크 함수
 */
function collision(first, second) {
  return !(
    first.x > second.x + second.width ||
    first.x + first.width < second.x ||
    first.y > second.y + second.height ||
    first.y + first.height < second.y
  );
}

/**
 * 게임 재시작 함수
 */
function restartGame() {
  gameOver = false;
  obstacleArray = [];
  timer = 0;
  score = 0;
  scoreText.innerHTML = "현재점수: " + score;
  animate();
}

/**
 * 마우스 클릭 이벤트 처리 (게임 시작 및 재시작)
 */
canvas.addEventListener("click", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 게임 시작 조건 확인
  if (
    !gameStarted &&
    x >= 0 &&
    x <= canvas.width &&
    y >= 0 &&
    y <= canvas.height
  ) {
    gameStarted = true;
    animate();
  }

  // 게임 재시작 버튼 클릭 확인
  if (
    gameOver &&
    x >= canvas.width / 2 - 50 &&
    x <= canvas.width / 2 + 50 &&
    y >= canvas.height / 2 + 50 &&
    y <= canvas.height / 2 + 100
  ) {
    restartGame();
  }
});

/**
 * 마우스 이동 이벤트 처리 (커서 스타일 변경)
 */
canvas.addEventListener("mousemove", function (e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 게임오버 상태에서 재시작 버튼 위에 있을 때
  if (
    gameOver &&
    x >= canvas.width / 2 - 50 &&
    x <= canvas.width / 2 + 50 &&
    y >= canvas.height / 2 + 50 &&
    y <= canvas.height / 2 + 100
  ) {
    canvas.style.cursor = "pointer";
  }
  // 게임 시작 전 캔버스 위에 있을 때
  else if (
    !gameStarted &&
    x >= 0 &&
    x <= canvas.width &&
    y >= 0 &&
    y <= canvas.height
  ) {
    canvas.style.cursor = "pointer";
  }
  // 그 외의 경우
  else {
    canvas.style.cursor = "default";
  }
});
