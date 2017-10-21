class Canvas {
    constructor(container) {
        const canvas = document.createElement('canvas');

        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        this.canvas = canvas;
        this.ctx = ctx;
        this.children = [];
    }

    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.size = { width, height };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.size.width, this.size.height);
    }

    addChild(child) {
        this.children.push(child);
    }

    render() {
        this.clear();
        for (let child of this.children) {
            child.render(this.ctx);
        }
    }
}

class Rectangle {
    constructor(color, x, y, width, height) {
        this.color = color;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    render(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.lineWidth = '1';
        ctx.strokeStyle = 'black';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.stroke();
    }
}

class Rail extends Rectangle {
    constructor(x, y, width, height) {
        super('#61380b', x, y, width, height);
    }
}


const RAIL_COLLIDE_RIGHT = 1;
const RAIL_COLLIDE_LEFT = 2;
const RAIL_COLLIDE_TOP = 3;
const RAIL_COLLIDE_BOTTOM = 4;

class Ball {
    constructor(color, locationX, locationY, radius, directionX, directionY, speed) {
        this.color = color;
        this.location = { x: locationX, y: locationY };
        this.radius = radius;
        this.direction = { x: directionX, y: directionY };
        this.speed = speed;
    }

    update() {
        if (this.speed < 0.2) {
            this.speed = 0;
        }
        else {
            this.speed *= 0.993;
        }
        this.location.x += this.speed * this.direction.x;
        this.location.y += this.speed * this.direction.y;
    }

    isColliding(child) {
        if (child instanceof Rail) {
            if (child.width < child.height) {
                const rightHandSide = this.location.x + this.radius;
                const leftHandSide = this.location.x - this.radius;

                if (rightHandSide >= child.x && rightHandSide <= child.x + child.width) {
                    return RAIL_COLLIDE_RIGHT;
                }

                if (leftHandSide <= child.x + child.width && leftHandSide >= child.x) {
                    return RAIL_COLLIDE_LEFT;
                }
            } else {
                const upperSide = this.location.y + this.radius;
                const lowerSide = this.location.y - this.radius;

                if (upperSide >= child.y && upperSide <= child.y + child.height) {
                    return RAIL_COLLIDE_BOTTOM;
                }

                if (lowerSide <= child.y + child.height && lowerSide >= child.y) {
                    return RAIL_COLLIDE_TOP;
                }
            }
        }
        return false;
    }

    collisionResponse(child, collisionType) {
        if (child instanceof Rail) {
            this.speed *= 0.7;

            switch (collisionType) {
                case RAIL_COLLIDE_RIGHT:
                    this.direction.x *= -1;
                    this.location.x = child.x - this.radius;
                    break;

                case RAIL_COLLIDE_LEFT:
                    this.direction.x *= -1;
                    this.location.x = child.x + this.radius + child.width;
                    break;

                case RAIL_COLLIDE_TOP:
                    this.direction.y *= -1;
                    this.location.y = child.y + this.radius + child.height;
                    break;

                case RAIL_COLLIDE_BOTTOM:
                    this.direction.y *= -1;
                    this.location.y = child.y - this.radius;
                    break;
            }

        }
    }

    render(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.location.x, this.location.y, this.radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();
    }
}

class Game {
    constructor(canvas, width, height) {
        canvas.setSize(width, height);

        this.children = [];
        this.canvas = canvas;
        this.loop = this.loop.bind(this);

        const table = new Rectangle('#30a109', 0, 0, width, height);

        // @todo Consider how to move this into the Rail class
        const RAIL_SIZE = 20;
        const rail1 = new Rail(0, 0, width, RAIL_SIZE);
        const rail2 = new Rail(0, height-RAIL_SIZE, width, RAIL_SIZE);
        const rail3 = new Rail(0, 0, RAIL_SIZE, height);
        const rail4 = new Rail(width-RAIL_SIZE, 0, RAIL_SIZE, height);

        const ball = new Ball('#094ea1', width / 2, height / 2, 14, 1, 1, 5);

        this.addChild(table);
        this.addChild(rail1);
        this.addChild(rail2);
        this.addChild(rail3);
        this.addChild(rail4);
        this.addChild(ball);
    }

    addChild(child) {
        this.canvas.addChild(child);
        this.children.push(child);
    }

    startTicking() {
        this.shouldKeepTicking = true;
        this.loop();
    }

    loop() {
        if (this.shouldKeepTicking) {
            this.tick();
            requestAnimationFrame(this.loop);
        }
    }

    stopTicking() {
        this.shouldKeepTicking = false;
    }

    tick() {
        for (let child of this.children) {
            // @todo Optimisation
            for (let child2 of this.children) {
                if (child === child2) {
                    continue;
                }
                if (child.isColliding) {
                    const collisionType = child.isColliding(child2);
                    if (collisionType && child.collisionResponse) {
                        child.collisionResponse(child2, collisionType);
                    }
                }
            }
            if (child.update) {
                child.update();
            }
        }
        this.canvas.render();
    }
}

function main() {
    const canvas = new Canvas(document.querySelector('#game'));
    const game = new Game(canvas, 1000, 500);
    game.startTicking();
}

main();