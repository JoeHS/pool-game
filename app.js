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

const POCKET_COLLIDE_ANY = 5;

const BALL_COLLIDE_ANY = 6;
const BALL_COLLIDE_LEGAL = 7;
const BALL_COLLIDE_ILLEGAL = 8; //illegal collisions determined in rules class?

class Pocket {
    constructor(color, locationX, locationY, radius) {
        this.color = color;
        this.location = { x: locationX, y: locationY };
        this.radius = radius;
    }

    getCentre() {
        return { x: this.location.x + this.radius, y: this.location.y + this.radius };
    }

    render(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.location.x, this.location.y, this.radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();
    }
}
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

        //testing
        if (this.speed === 0) {
            this.color = 'red';
        }
    }

    getCentre() {
        return { x: this.location.x + this.radius, y: this.location.y + this.radius };
    }

    isColliding(child) {
        if (child instanceof Rail) {
            if (child.width < child.height) {
                const rightHandSide = this.location.x + this.radius;
                const leftHandSide = this.location.x - this.radius;

                if (rightHandSide >= child.x && rightHandSide <= child.x + child.width) {
                    return [RAIL_COLLIDE_RIGHT];
                }

                if (leftHandSide <= child.x + child.width && leftHandSide >= child.x) {
                    return [RAIL_COLLIDE_LEFT];
                }
            } else {
                const upperSide = this.location.y + this.radius;
                const lowerSide = this.location.y - this.radius;

                if (upperSide >= child.y && upperSide <= child.y + child.height) {
                    return [RAIL_COLLIDE_BOTTOM];
                }

                if (lowerSide <= child.y + child.height && lowerSide >= child.y) {
                    return [RAIL_COLLIDE_TOP];
                }
            }
        }
        else if (child instanceof Pocket) {
            // @todo store child (the ball) in array of pocketed ball
            //simple pythagoras
            //this should work when i work out how to access the array
            //use mid-points not x,y locations.
            const centre = this.getCentre();
            const pocketCentre = child.getCentre();
            // @todo Optimisation
            const distance = Math.sqrt(
                Math.pow((pocketCentre.x-centre.x), 2) + Math.pow((pocketCentre.y-centre.y), 2)
            );

            if (distance <= child.radius) {
                return [POCKET_COLLIDE_ANY];
            }

        }

        else if (child instanceof Ball) {

            const centre = this.getCentre();
            const otherCentre = child.getCentre();

            const distance = Math.sqrt(
                Math.pow((otherCentre.x - centre.x), 2) + Math.pow((otherCentre.y - centre.y), 2)
            );

            if (distance <= child.radius + this.radius) {
                return [BALL_COLLIDE_ANY, distance];
            }
        }
    }

    collisionResponse(child, collisionType, data) {
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
        else if (child instanceof Pocket) {

            switch (collisionType) {
                case POCKET_COLLIDE_ANY:
                    this.speed = 0;
                    this.direction.x = 0;
                    this.direction.y = 0;

                    //testing
                    this.location.x = 20;
                    this.location.y = 20;
            }
        }

        else if (child instanceof Ball) {
            switch (collisionType) {
                case BALL_COLLIDE_ANY:
                    //REF: https://channel9.msdn.com/Series/Sketchbooktutorial/Simple-Collision-Detection-and-Response
                    const dist = data[0];
                    const dx = this.getCentre().x - child.getCentre().x;
                    const dy = this.getCentre().y - child.getCentre().y;
                    const normalX = dx / dist;
                    const normalY = dy / dist;
                    //const midpointX = (this.getCentre().x + child.getCentre().x) / 2;
                    //const midpointY = (this.getCentre().y + child.getCentre().y) / 2;
                    const dVector = ((this.direction.x - child.direction.x) * normalX)
                        + ((this.direction.y - child.direction.y) * normalY);
                    const dvx = dVector * normalX;
                    const dvy = dVector * normalY;
/*
                    this.x = midpointX - normalX * this.radius;
                    this.y = midpointY - normalY * this.radius;
                    child.x = midpointX + normalX * child.radius;
                    child.y = midpointY + normalY * child.radius;
*/
                    //child.speed *= 0.7; //simple simulation of transfer of energy

                    this.direction.x -= dvx;
                    this.direction.y -= dvy;
                    child.direction.x += dvx;
                    child.direction.y += dvy;
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

        //color, x, y, radius
        const POCKET_SIZE = 20;
        const pocket1 = new Pocket('#2e2e2e', RAIL_SIZE, RAIL_SIZE, POCKET_SIZE);
        const pocket2 = new Pocket('#2e2e2e', (width/2)-RAIL_SIZE, RAIL_SIZE, POCKET_SIZE);
        const pocket3 = new Pocket('#2e2e2e', width-RAIL_SIZE, RAIL_SIZE, POCKET_SIZE);
        const pocket4 = new Pocket('#2e2e2e', RAIL_SIZE, height-RAIL_SIZE, POCKET_SIZE);
        const pocket5 = new Pocket('#2e2e2e', (width/2)-RAIL_SIZE, height-RAIL_SIZE, POCKET_SIZE);
        const pocket6 = new Pocket('#2e2e2e', width-RAIL_SIZE, height-RAIL_SIZE, POCKET_SIZE);
        //middle pockets not aligned to centre?
        const pockets = [];
        pockets.push(pocket1, pocket2, pocket3, pocket4, pocket5, pocket6);

        //const ball = new Ball('#094ea1', width / 2, height / 2, 14, 1, 1, 5);

        this.addChild(table);
        this.addChild(rail1);
        this.addChild(rail2);
        this.addChild(rail3);
        this.addChild(rail4);

        this.addChild(pocket1);
        this.addChild(pocket2);
        this.addChild(pocket3);
        this.addChild(pocket4);
        this.addChild(pocket5);
        this.addChild(pocket6);

        //this.addChild(ball);

        //const ball2 = new Ball('#61380b', (width / 2) - 14, height / 2, 14, 0, 1, 5);
        // const ball2 = new Ball('#094ea1', (width / 2) - 14, height / 2, 14, 0, 0, 5);
        // this.addChild(ball2);
        // const ball3 = new Ball('#094ea1', (width / 2) - 14 + 200, height / 2 + 20, 14, -1, 0, 5);
        // this.addChild(ball3);
        //
        // const ball4 = new Ball('#094ea1', (width / 2) - 14, height / 2 - 120, 14, 0, -1, 5);
        // this.addChild(ball4);
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
                    const [collisionType, ...data] = child.isColliding(child2) || [];
                    if (collisionType && child.collisionResponse) {
                        child.collisionResponse(child2, collisionType, data);
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

function getRandomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function collisionSandbox(game) {
    for (let i = 0; i < 10; i++) {
        let locX = getRandomRange(100, 900);
        let locY = getRandomRange(100, 400);
        let dirX = getRandomRange(-1, 1);
        let dirY = getRandomRange(-1, 1);
        let speed = getRandomRange(4, 12);

        const ball = new Ball('#ffbf00', locX, locY, 14, dirX, dirY, speed);
        game.addChild(ball);
    }
}

function main() {
    const canvas = new Canvas(document.querySelector('#game'));
    const game = new Game(canvas, 1000, 500);
    game.startTicking();

    collisionSandbox(game);
}

main();