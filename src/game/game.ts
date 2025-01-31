import { Asteroid, Bullet, Explosion, FlatingScore } from './types';

function calculateScore(size: number) {
  const baseScore = 100; // Базовое количество очков
  return Math.ceil(baseScore / size); // Чем меньше размер, тем больше очков
}
export class Game {
  root: HTMLElement;
  energy = 100; // Энергия (100 - полная, 0 - game over)
  lives = 3; // Количество жизней
  points = 0;
  canvasElem: HTMLCanvasElement;
  constructor(root?: HTMLElement | null) {
    if (!root) {
      throw new Error('Root element not found');
    }
    this.root = root;
    this.canvasElem = document.createElement('canvas');

    this.initGame();
  }
  reloadGame() {
    this.energy = 100; // Энергия (100 - полная, 0 - game over)
    this.lives = 3; // Количество жизней
    this.points = 0;
    this.initGame();
  }
  renderEndGame() {
    this.root.innerHTML = '';
    this.root.innerHTML = `
      <div>
      <h1>Game Over</h1>
      <div>
        Ваш счет: ${this.points}
      </div>
      <button class="reload-button">Начать заново</button>
      </div>
    `;

    const btnReload = this.root.querySelector('.reload-button');
    if (btnReload) {
      btnReload.addEventListener('click', () => {
        this.reloadGame();
      });
    }
  }

  initGame() {
    this.root.innerHTML = '';
    this.canvasElem.innerHTML = '';
    this.root.appendChild(this.canvasElem);
    const canvas = this.canvasElem as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 800;
    canvas.height = 600;

    const explosions: Explosion[] = []; // Массив частиц взрыва

    const spaceship = {
      x: canvas.width / 2,
      y: canvas.height - 70,
      speed: 5,
      bullets: [] as Bullet[],
    };
    function createExplosion(x: number, y: number, color: string) {
      const numParticles = 20; // Количество частиц в одном взрыве
      for (let i = 0; i < numParticles; i++) {
        explosions.push({
          x,
          y,
          size: Math.random() * 5 + 2, // Размер частиц
          speedX: (Math.random() - 0.5) * 4, // Скорость по X
          speedY: (Math.random() - 0.5) * 4, // Скорость по Y
          color,
          life: Math.random() * 30 + 30, // Продолжительность жизни частицы
        });
      }
    }
    const drawHUD = () => {
      // Полоса энергии
      ctx.fillStyle = 'red';
      ctx.fillRect(10, canvas.height - 20, 200, 10);
      ctx.fillStyle = 'green';
      ctx.fillRect(10, canvas.height - 20, (this.energy / 100) * 200, 10);

      // Жизни
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText(`Lives: ${this.lives}`, canvas.width - 100, 30);

      // Счет
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${this.points}`, 10, 30);
    };

    function drawExplosions() {
      explosions.forEach((particle) => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
      });
    }

    function updateExplosions() {
      explosions.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.size *= 0.95; // Уменьшаем размер с каждым кадром
        particle.life -= 1;

        // Удаляем частицы, если их жизнь закончилась
        if (particle.life <= 0 || particle.size <= 0.5) {
          explosions.splice(index, 1);
        }
      });
    }

    const spaceshipShape = [
      [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 0, 3, 0, 1, 2, 1, 0, 3, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 2, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 4, 3, 4, 0, 0, 0, 4, 3, 4, 0, 0],
      [0, 0, 4, 3, 4, 0, 0, 0, 4, 3, 4, 0, 0],
      [0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];
    const pixelSize = 7;

    const stars = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 1,
    }));

    const asteroids: Asteroid[] = [];
    const bulletSpeed = 7;
    const asteroidSpeed = 2;
    let gameRunning = true;

    function drawBackground() {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'white';
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.fillRect(star.x, star.y, 2, 2);
        ctx.fill();
      });
    }

    function moveStars() {
      stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });
    }
    // Массив для всплывающих очков
    const floatingScores: FlatingScore[] = [];

    // Функция для создания всплывающего текста
    function createFloatingScore(x: number, y: number, score: number) {
      floatingScores.push({
        x,
        y,
        score,
        opacity: 1, // Начальная непрозрачность
        duration: 120, // Количество кадров, на которые будет отображаться (1 секунда при 60 FPS)
      });
    }

    const spaceshipImage = new Image();
    spaceshipImage.src = '/cartoonship.png'; // Путь к изображению
    const drawSpaceship = () => {
      ctx.drawImage(spaceshipImage, spaceship.x, spaceship.y, 70, 70);
    };

    function drawBullets() {
      ctx.fillStyle = 'red';
      spaceship.bullets.forEach((bullet) => {
        ctx.fillRect(bullet.x, bullet.y, 4, 10);
      });
    }

    function drawAsteroids() {
      asteroids.forEach((asteroid) => {
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y); // Перенос точки отрисовки к центру астероида

        ctx.beginPath();
        const numPoints = Math.floor(Math.random() * 5) + 5; // Количество вершин (от 5 до 10)
        const angleStep = (Math.PI * 2) / numPoints; // Угол между вершинами

        for (let i = 0; i < numPoints; i++) {
          const angle = i * angleStep; // Текущий угол
          const radius = asteroid.size; // Случайный радиус для "неровностей"
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath(); // Замыкаем контур
        ctx.fillStyle = 'gray'; // Цвет астероида
        ctx.fill();
        ctx.strokeStyle = 'black'; // Цвет обводки
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      });
    }

    function moveSpaceship() {
      if (keys['ArrowLeft'] && spaceship.x > 0) {
        spaceship.x -= spaceship.speed;
      }
      if (keys['ArrowRight'] && spaceship.x < canvas.width - 10 * pixelSize) {
        spaceship.x += spaceship.speed;
      }
    }

    function moveBullets() {
      spaceship.bullets = spaceship.bullets.filter((bullet) => bullet.y > 0);
      spaceship.bullets.forEach((bullet) => (bullet.y -= bulletSpeed));
    }

    const moveAsteroids = () => {
      asteroids.forEach((asteroid) => {
        asteroid.y += asteroid.speed;
        if (asteroid.y > canvas.height) {
          asteroids.splice(asteroids.indexOf(asteroid), 1);
          this.energy -= 20; // Уменьшаем энергию
          if (this.energy <= 0) {
            gameRunning = false; // Если энергия на нуле, конец игры
          }
        }
      });
    };

    function spawnAsteroid() {
      const size = Math.random() * 20 + 10;
      const x = Math.random() * (canvas.width - size * 2) + size;
      asteroids.push({
        x,
        y: -size,
        size,
        speed: Math.random() * 1.5 + asteroidSpeed,
      });
    }

    const detectCollisions = () => {
      asteroids.forEach((asteroid, aIndex) => {
        spaceship.bullets.forEach((bullet, bIndex) => {
          const dist = Math.hypot(asteroid.x - bullet.x, asteroid.y - bullet.y);
          if (dist < asteroid.size) {
            console.log(asteroid.size);

            // Создаем эффект взрыва
            createExplosion(asteroid.x, asteroid.y, 'white');
            const score = calculateScore(asteroid.size);
            this.points += score;
            // Создаем всплывающее сообщение
            createFloatingScore(asteroid.x, asteroid.y, score);
            // Удаляем астероид и пулю
            asteroids.splice(aIndex, 1);
            spaceship.bullets.splice(bIndex, 1);
            this.energy = Math.min(this.energy + 7, 100); // Увеличиваем энергию
          }
        });
      });

      asteroids.forEach((asteroid, aIndex) => {
        const dist = Math.hypot(
          asteroid.x -
            (spaceship.x + (spaceshipShape[0].length * pixelSize) / 2),
          asteroid.y - spaceship.y
        );
        if (dist < asteroid.size + (spaceshipShape.length * pixelSize) / 6) {
          createExplosion(asteroid.x, asteroid.y, 'orange');
          asteroids.splice(aIndex, 1);
          // Игра заканчивается при столкновении корабля с астероидом
          // gameRunning = false;
          this.lives--; // Минусуем жизнь
          if (this.lives <= 0) {
            gameRunning = false; // Если жизней 0, конец игры
          }
        }
      });
    };
    // Функция для отрисовки всплывающих очков
    function drawFloatingScores() {
      floatingScores.forEach((floatingScore, index) => {
        ctx.save();
        ctx.globalAlpha = floatingScore.opacity; // Устанавливаем прозрачность
        ctx.fillStyle = '#09e814'; // Цвет текста
        ctx.font = '20px Arial';
        ctx.fillText(
          `+${floatingScore.score}`,
          floatingScore.x,
          floatingScore.y
        );

        // Анимация: сдвигаем текст вверх и уменьшаем прозрачность
        floatingScore.y -= 1;
        floatingScore.opacity -= 1 / floatingScore.duration;

        // Удаляем текст, если его время истекло
        if (floatingScore.opacity <= 0) {
          floatingScores.splice(index, 1);
        }

        ctx.restore();
      });
    }

    function shoot() {
      spaceship.bullets.push({
        x: spaceship.x + (spaceshipShape[0].length / 1.9) * pixelSize - 2,
        y: spaceship.y,
      });
      spaceship.bullets.push({
        x: spaceship.x + (spaceshipShape[0].length / 3.9) * pixelSize - 2,
        y: spaceship.y,
      });
    }

    const keys: { [key: string]: boolean } = {};
    document.addEventListener('keydown', (e) => {
      keys[e.key] = true;
      if (e.key === ' ') shoot();
    });
    document.addEventListener('keyup', (e) => (keys[e.key] = false));

    const gameLoop = () => {
      if (!gameRunning) {
        // ctx.fillStyle = 'black';
        // ctx.fillRect(0, 0, canvas.width, canvas.height);
        // ctx.fillStyle = 'white';
        // ctx.font = '30px Arial';
        // ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
        // ctx.fillText(
        //   `Ваш счет: ${this.points}`,
        //   canvas.width / 2 - 80,
        //   canvas.height / 2 + 50
        // );
        this.renderEndGame();

        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Отрисовка и логика
      drawBackground();
      drawHUD();
      moveStars();
      drawSpaceship();
      drawBullets();
      drawAsteroids();
      drawExplosions(); // Рисуем частицы
      // Отрисовка всплывающих очков
      drawFloatingScores();
      moveSpaceship();
      moveBullets();
      moveAsteroids();
      updateExplosions(); // Обновляем частицы
      detectCollisions();

      requestAnimationFrame(gameLoop);
    };

    setInterval(spawnAsteroid, 1500);
    gameLoop();
  }
}
