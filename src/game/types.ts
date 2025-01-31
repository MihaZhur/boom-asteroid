export interface Explosion {
  x: number;
  y: number;
  size: number; // Размер частиц
  speedX: number; // Скорость по X
  speedY: number; // Скорость по Y
  color: string;
  life: number;
}

export interface Asteroid {
  x: number;
  y: number;
  size: number;
  speed: number;
}
export interface Bullet {
  x: number;
  y: number;
}
export interface FlatingScore {
  x: number;
  y: number;
  score: number;
  opacity: number; // Начальная непрозрачность
  duration: number;
}
