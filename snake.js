"use strict";

/** Multiplayer Snake game. */

const WIDTH = 30;
const HEIGHT = 30;

// translate game board size to pixels
const SCALE = 20;

const GAME_DELAY_MS = 400;


// One-time setup to HTML canvas element: make it the right size (given settings
// above) and center it on the screen.
const canvas = document.getElementById("board");
canvas.setAttribute("height", `${HEIGHT * SCALE}`);
canvas.style.marginTop = `${(HEIGHT * SCALE) / -2}px`;
canvas.setAttribute("width", `${WIDTH * SCALE}`);
canvas.style.marginLeft = `${(WIDTH * SCALE) / -2}px`;

// This is the "drawing context" for the HTML canvas library: essentially, it's
// the object where drawing commands happen. The "2d" is because we are drawing
// on a two dimensional canvas, rather than a 3d one.
const ctx = canvas.getContext("2d");


/** Point: a single element on the game board.
 *
 * This is used to draw a circle on the game board at x,y. It is used by both
 * the food Pellet class (which has one point), and by the Snake class (which
 * has a point for each link in the snake).
 *
 * x - x coord (0 is left)
 * y - y coord (0 is top)
 *
 * */

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /** Make a point at a random x,y and return it. */

  static newRandom() {
    const randRange = (low, hi) =>
      low + Math.floor((Math.random() * (hi - low)));
    return new Point(randRange(1, WIDTH), randRange(1, HEIGHT));
  }

  /** Draw the point in the provided color.
   *
   * @param color - CSS color
   *
   * This uses SCALE to translate the x,y of the point to where that should
   * appear and the size of the circle on the canvas.
   */
  draw(color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(
      this.x * SCALE,
      this.y * SCALE,
      SCALE / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  /** Return t/f if this point is outside of the game board coords. */

  isOutOfBound() {
    return (this.x <= 0 || this.x >= WIDTH || this.y <= 0 || this.y >= HEIGHT);
  }
}


/** Food pellet. When the snake eats these, it will grow. */

class Pellet {
  constructor(x, y) {
    this.pt = new Point(x, y);
  }

  /** Make a new pellet at a random location and return it. */

  static newRandom() {
    let pt = Point.newRandom();
    while (game.snake.parts.some(me => me.x === pt.x && me.y === pt.y)) {
      pt = Point.newRandom();
    }
    return new Pellet(pt.x, pt.y);
  }

  /** Draw pellet on board. */

  draw() {
    this.pt.draw("green");
  }
}


/** Snake. Central actor in game: moves, eats pellets, and grows.
 *
 * @param color - CSS color of this snake
 * @param keymap - mapping of keys to directions, eg
 *    { w: "up", a: "left", s: "right", z: "down" }
 * @param start - starting Point for snake
 * @param dir - direction snake moves: "up", "left", "right", "down"
 *
 **/

class Snake {
  constructor(keymap, start, dir, color) {
    this.keymap = keymap;
    this.parts = [start]; // list of Points in snake body
    this.dir = dir;       // direction currently moving
    this.nextDir = dir;   // direction we'll start moving on next tick
    this.growBy = 0; // how many to grow by (goes up after eating)
    this.crashIntoSelf = false;
    this.color = color;
    //this.checkCrashIntoSelf=this.checkCrashIntoSelf.bind(this);
  }

  /** Draw the body of the snake in its color. */

  draw() {
    for (const p of this.parts) p.draw(this.color);
  }

  /** Does the snake body contain this Point? t/f */

  contains(pt) {
    return this.parts.some(me => me.x === pt.x && me.y === pt.y);
  }

  /** Head (first Point) of the snake. */

  head() {
    return this.parts[0];
  }

  /** Did the snake crash into a border wall? t/f */

  checkCrashIntoWall() {
    return (this.head().isOutOfBound());
  }
  // /**  Did the snake crash into itself? t/f */
  // checkCrashIntoSelf (){
  //   return this.parts.slice(1).some(me => me.x===this.head.x && me.y===this.head.y);
  // }
  /** Move snake one move in its current direction. */

  move() {
    const { x, y } = this.head();

    // Calculate where the new head will be, and add that point to front of body
    let pt;
    // prevent 180 turn 
    if ((this.nextDir === "right" && this.dir === "left") ||
      (this.nextDir === "left" && this.dir === "right") ||
      (this.nextDir === "up" && this.dir === "down") ||
      (this.nextDir === "down" && this.dir === "up")) { this.nextDir = this.dir };
    this.dir = this.nextDir;
    if (this.dir === "left") pt = new Point(x - 1, y);
    if (this.dir === "right") pt = new Point(x + 1, y);
    if (this.dir === "up") pt = new Point(x, y - 1);
    if (this.dir === "down") pt = new Point(x, y + 1);

    if (this.contains(pt)) { game.tick(true) };

    this.parts.unshift(pt);

    // If we're not growing (didn't recently eat a pellet), remove the tail of
    // the snake body, so it moves and doesn't grow. If we're growing, decrement
    // growth so we're closer to not-growing-any-more.
    if (this.growBy === 0) this.parts.pop();
    else this.growBy--;
  }

  /** If a valid key was used, change direction to that. */

  handleKey(key) {
    if (this.keymap[key] !== undefined) this.changeDir(this.keymap[key]);
  }

  /** Change direction:
   *
   * @param dir - new direction
   *
   */

  changeDir(dir) {
    this.nextDir = dir;
  }

  /** Handle potentially eating a food pellet:
   *
   * - if head is currently on pellet: start growing snake, and return pellet.
   * - otherwise, returns undefined.
   *
   * @param food - list of Pellet on board.
   */

  eats(food) {
    const head = this.head();
    const pellet = food.find(f => f.pt.x === head.x && f.pt.y === head.y);
    console.log("eats pellet=", pellet);
    if (pellet) this.growBy += 2;
    return pellet;
  }
}


/** Overall game.
 *
 * @param snake - Snake instance playing
 * @param numFood - how much food should always be on board?
 */

class Game {
  constructor(snake, numFood = 3) {
    this.snake = snake;

    // array of Pellet instances on board
    this.food = [];
    this.numFood = numFood;

    this.timerId = null;
    this.keyListener = this.keyListener.bind(this);
  }

  /** Start game: add keyboard listener and start timer. */

  start() {
    document.addEventListener("keydown", this.keyListener);
    this.timerId = window.setInterval(this.tick.bind(this), GAME_DELAY_MS);
  }

  /** Refill board with food (don't allow food to be on same spot as snake). */

  refillFood() {
    while (this.food.length < this.numFood) {
      this.food.push(Pellet.newRandom());
    }
  }

  /** Let snake try to handle the keystroke. */

  keyListener(evt) {
    this.snake.handleKey(evt.key);
  }

  /** Remove Pellet from board. */

  removeFood(pellet) {
    this.food = this.food.filter(
      f => f.pt.x !== pellet.pt.x && f.pt.y !== pellet.pt.y);
  }

  /** A "tick" of the game: called by interval timer.
   *
   * - check if snake has crashed into something & if so, end game
   * - move snakes forward
   * - check if snake has eaten a pellet and if so, remove it
   * - refill food, if needed
   */

  tick(crashIntoSelf = false) {
    console.log("tick");

    const isDead = this.snake.checkCrashIntoWall();


    if (isDead || crashIntoSelf) {
      window.clearInterval(this.timerId);
      window.removeEventListener("keydown", this.keyListener);
      return;
    }

    ctx.clearRect(0, 0, SCALE * WIDTH, SCALE * HEIGHT);
    for (const f of this.food) {
      f.draw();
    }

    this.snake.move();
    this.snake.draw();

    const pellet = this.snake.eats(this.food);
    if (pellet) this.removeFood(pellet);

    this.refillFood();
  }
}

class GrowthSnake extends Snake {
  constructor(keymap, dir, start, color, growthRate) {
    super(keymap, dir, start, color);
    this.parts = [start]; // list of Points in snake body     
    this.nextDir = dir;   // direction we'll start moving on next tick
    this.growBy = 0; // how many to grow by (goes up after eating)
    this.crashIntoSelf = false;
    this.growthRate = growthRate
  }
  eats(food) {
    const head = this.head();
    const pellet = food.find(f => f.pt.x === head.x && f.pt.y === head.y);
    console.log("eats pellet=", pellet);
    if (pellet) this.growBy += this.growthRate;
    return pellet;
  }
}


/// Set up snakes, game, and start game

const snake1 = new Snake(
  {
    ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
  },
  new Point(20, 20),
  "right",
  "red",
);

const snake2 = new Snake(
  {
    w: "up", a: "left", s: "right", z: "down",
  },
  new Point(10, 10),
  "right",
  "blue",
);

const snake3 = new GrowthSnake(
  {
    ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
  },
  "right",
  new Point(20, 20),
  "red",
  5,
)

const game = new Game(snake3);
game.start();