let tileSize = 32;
let rows = 16;
let columns = 16;

let board;
let boardWidth = tileSize * columns;
let boardHeight = tileSize * rows;
let context;

// Ship
let shipWidth = tileSize * 2;
let shipHeight = tileSize;
let shipX = (tileSize * columns) / 2 - tileSize;
let shipY = tileSize * rows - tileSize * 2;

let ship = {
  x: shipX,
  y: shipY,
  width: shipWidth,
  height: shipHeight,
};

let shipImg;
let shipVelocityX = tileSize;

// Aliens
let alienArray = [];
let alienWidth = tileSize * 2;
let alienHeight = tileSize;
let alienImg;

let alienRows = 2;
let alienColumns = 3;
let alienCount = 0; // Number of alive aliens
let alienVelocityX = 1; // Alien moving speed
let level = 1; // Current level

// Bullets
let bulletArray = [];
let bulletVelocityY = -10; // Bullet moving speed

// Alien bullets
let alienBulletArray = [];
let alienBulletVelocityY = 5; // Velocity of alien bullets

let score = 0;
let gameOver = false;

window.onload = function () {
  board = document.getElementById("board");
  board.width = boardWidth;
  board.height = boardHeight;
  context = board.getContext("2d");

  // Load images
  shipImg = new Image();
  shipImg.src = "./ship.png"; // Ensure the path is correct
  shipImg.onload = function () {
    context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
  };

  alienImg = new Image();
  alienImg.src = "./alien.png"; // Ensure the path is correct

  createAliens();
  requestAnimationFrame(update);
  document.addEventListener("keydown", moveShip);
  document.addEventListener("keyup", shoot);
};

function update() {
  // Clear the canvas for the next frame
  requestAnimationFrame(update);

  if (gameOver) {
    context.fillStyle = "red";
    context.font = "36px Courier";
    context.fillText("Game Over!", boardWidth / 2 - 80, boardHeight / 2);
    return;
  }

  context.clearRect(0, 0, board.width, board.height);

  // Draw ship
  context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);

  // Update and draw aliens
  for (let i = 0; i < alienArray.length; i++) {
    let alien = alienArray[i];
    if (alien.alive) {
      context.drawImage(alienImg, alien.x, alien.y, alien.width, alien.height);
      // Move the alien
      alien.x += alienVelocityX;

      // Border collision
      if (alien.x + alien.width >= board.width || alien.x <= 0) {
        alienVelocityX *= -1;
        alien.x += alienVelocityX * 2; // Ensure the aliens don’t overlap the borders

        // Move all aliens downwards
        for (let j = 0; j < alienArray.length; j++) {
          alienArray[j].y += alienHeight;
        }
      }

      // Check if alien reaches the ship
      if (alien.y >= ship.y) {
        gameOver = true; // End the game if an alien reaches the bottom
      }

      // Randomly allow aliens to shoot
      if (Math.random() < 0.0002) {
        // A 2% chance per frame for each alien to shoot
        shootAlienBullet(alien);
      }
    }
  }

  // Update and draw bullets
  for (let i = 0; i < bulletArray.length; i++) {
    let bullet = bulletArray[i];
    bullet.y += bulletVelocityY;

    // Check for bullet collision with aliens
    for (let j = 0; j < alienArray.length; j++) {
      let alien = alienArray[j];
      if (!bullet.used && alien.alive && detectCollision(bullet, alien)) {
        bullet.used = true; // Mark the bullet as used
        alien.alive = false; // Mark the alien as defeated
        alienCount--; // Decrease the alien count
        score += 100; // Increase score
      }
    }

    if (bullet.used || bullet.y < 0) {
      bulletArray.splice(i, 1); // Remove bullet if used or off-screen
      i--; // Adjust index after removal
    } else {
      context.fillStyle = "white";
      context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height); // Draw bullet
    }
  }

  // Update and draw alien bullets
  for (let i = 0; i < alienBulletArray.length; i++) {
    let alienBullet = alienBulletArray[i];
    alienBullet.y += alienBulletVelocityY;

    // Check for collision with the ship
    if (detectCollision(alienBullet, ship)) {
      gameOver = true; // End game if alien bullet hits the ship
    }

    if (alienBullet.y > boardHeight) {
      alienBulletArray.splice(i, 1); // Remove bullet if off-screen
      i--; // Adjust index after removal
    } else {
      context.fillStyle = "red"; // Use red color for alien bullets
      context.fillRect(
        alienBullet.x,
        alienBullet.y,
        alienBullet.width,
        alienBullet.height
      ); // Draw alien bullet
    }
  }

  // Check for next level condition
  if (alienCount === 0) {
    level++;
    alienColumns = Math.min(alienColumns + 1, columns / 2 - 2); // Maximum limit adjustment
    alienRows = Math.min(alienRows + 1, rows - 4); // Maximum limit adjustment
    alienVelocityX += 0.2; // Increase alien speed
    resetEnemies(); // Create a new set of aliens for the next level
  }

  // Update score display
  context.fillStyle = "white";
  context.font = "16px Courier";
  context.fillText("Score: " + score, 5, 20);
  context.fillText("Level: " + level, boardWidth - 90, 20); // Show current level
}

// Function to shoot bullets for the player
function shoot(e) {
  if (gameOver) {
    return;
  }
  if (e.code == "Space") {
    // Shoot a bullet
    let bullet = {
      x: ship.x + (shipWidth * 15) / 32,
      y: ship.y,
      width: tileSize / 8,
      height: tileSize / 2,
      used: false,
    };
    bulletArray.push(bullet);
  }
}

// Function for aliens to shoot bullets
function shootAlienBullet(alien) {
  let alienBullet = {
    x: alien.x + alienWidth / 2 - tileSize / 16, // Center the bullet under the alien
    y: alien.y + alienHeight,
    width: tileSize / 16,
    height: tileSize / 4,
  };
  alienBulletArray.push(alienBullet);
}

// Move the ship with arrow keys
function moveShip(e) {
  if (gameOver) {
    return;
  }
  if (e.code == "ArrowLeft" && ship.x - shipVelocityX >= 0) {
    ship.x -= shipVelocityX; // Move left
  } else if (
    e.code == "ArrowRight" &&
    ship.x + shipVelocityX + ship.width <= board.width
  ) {
    ship.x += shipVelocityX; // Move right
  }
}

// Create aliens
function createAliens() {
  alienArray = []; // Clear previous aliens
  for (let c = 0; c < alienColumns; c++) {
    for (let r = 0; r < alienRows; r++) {
      let alien = {
        img: alienImg,
        x: c * alienWidth,
        y: r * alienHeight,
        width: alienWidth,
        height: alienHeight,
        alive: true,
      };
      alienArray.push(alien);
    }
  }
  alienCount = alienArray.length; // Reset alien count
}

// Reset aliens for next level
function resetEnemies() {
  bulletArray = []; // Clear existing bullets
  createAliens(); // Create new aliens
}

// Detect collision between two rectangles
function detectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
