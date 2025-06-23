export default class Collision {
  static checkCollision(object1, object2) {
    return object1.x < object2.x + 32 &&
        object1.x + 32 > object2.x &&
        object1.y < object2.y + 32 &&
        object1.y + 32 > object2.y;
  }

  static checkObstacleCollision(rect1, rect2, margin = 0) {
    // Créer une hitbox ajustée avec la marge si spécifiée
    const adjustedRect = {
      x: rect1.x + margin,
      y: rect1.y + margin,
      width: rect1.width - 2 * margin,
      height: rect1.height - 2 * margin
    };

    return !(
        adjustedRect.x + adjustedRect.width <= rect2.x ||
        adjustedRect.x >= rect2.x + rect2.width ||
        adjustedRect.y + adjustedRect.height <= rect2.y ||
        adjustedRect.y >= rect2.y + rect2.height
    );
  }

  static checkMapBoundaries(position, elementSize, mapSize) {
    return {
      x: Math.max(0, Math.min(position.x, mapSize.width - elementSize.width)),
      y: Math.max(0, Math.min(position.y, mapSize.height - elementSize.height))
    };
  }

  static getCollisionWithObstacles(newPosition, size, obstacles, margin = 0) {
    const movementRect = {
      x: newPosition.x,
      y: newPosition.y,
      width: size.width,
      height: size.height
    };

    for (const obstacle of obstacles) {
      const obstacleRect = {
        x: obstacle.offsetLeft,
        y: obstacle.offsetTop,
        width: obstacle.offsetWidth,
        height: obstacle.offsetHeight
      };

      if (this.checkObstacleCollision(movementRect, obstacleRect, margin)) {
        return true;
      }
    }

    return false;
  }
}