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

    attachMouseMoveListener(fn) {
        this.canvas.addEventListener('mousemove', e => fn(e.offsetX, e.offsetY));
    }

    attachMouseUpListener(fn) {
        this.canvas.addEventListener('mouseup', e => fn(e.offsetX, e.offsetY));
    }

    attachMouseDownListener(fn) {
        this.canvas.addEventListener('mousedown', e => fn(e.offsetX, e.offsetY));
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
            if (child.show !== false) {
                child.render(this.ctx);
            }
        }
    }
}

const calculateDistance = (a, b) => Math.sqrt(
    Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2)
);

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
    constructor(x, y, width, height, type) {
        super('#61380b', x, y, width, height);
        this.type = type;
    }
}

const RAIL_COLLIDE_RIGHT = 1;
const RAIL_COLLIDE_LEFT = 2;
const RAIL_COLLIDE_TOP = 3;
const RAIL_COLLIDE_BOTTOM = 4;
const RAIL_TOP = 1;
const RAIL_BOTTOM = 2;
const RAIL_LEFT = 3;
const RAIL_RIGHT = 4;

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
    }

    getCentre() {
        return { x: this.location.x + this.radius, y: this.location.y + this.radius };
    }

    isColliding(child) {
        if (child instanceof Pocket) {
            // @todo store child (the ball) in array of pocketed ball
            //simple pythagoras
            //this should work when i work out how to access the array
            //use mid-points not x,y locations.
            //const centre = this.getCentre();
            // @todo Optimisation
            const distance = calculateDistance(child.location, this.location);

            if (distance <= child.radius) {
                return [POCKET_COLLIDE_ANY];
            }
        }
        else if (child instanceof Rail) {
            const rightHandSide = this.location.x + this.radius;
            const leftHandSide = this.location.x - this.radius;
            const upperSide = this.location.y + this.radius;
            const lowerSide = this.location.y - this.radius;

            switch (child.type) {
                case RAIL_TOP:
                    if (lowerSide <= child.y + child.height) {
                        return [RAIL_COLLIDE_TOP];
                    }
                    break;

                case RAIL_BOTTOM:
                    if (upperSide >= child.y) {
                        return [RAIL_COLLIDE_BOTTOM];
                    }
                    break;

                case RAIL_LEFT:
                    if (leftHandSide <= child.x + child.width) {
                        return [RAIL_COLLIDE_LEFT];
                    }
                    break;

                case RAIL_RIGHT:
                    if (rightHandSide >= child.x) {
                        return [RAIL_COLLIDE_RIGHT];
                    }
                    break;
            }
        }
        else if (child instanceof Ball) {
            const centre = this.location;
            const otherCentre = child.location;

            const distance = calculateDistance(otherCentre, centre);

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
                    //OLD REF: https://gamedevelopment.tutsplus.com/tutorials/when-worlds-collide-simulating-circle-circle-collisions--gamedev-769
                    //NEW REF: https://channel9.msdn.com/Series/Sketchbooktutorial/Simple-Collision-Detection-and-Response
                    this.location.x += this.speed * -this.direction.x;
                    this.location.y += this.speed * -this.direction.y;
                    const dist = calculateDistance(this.location, child.location);

                    const dx = this.location.x - child.location.x;
                    const dy = this.location.y - child.location.y;
                    const normalX = dx / dist;
                    const normalY = dy / dist;
                    //const midpointX = (this.getCentre().x + child.getCentre().x) / 2;
                    //const midpointY = (this.getCentre().y + child.getCentre().y) / 2;
                    const dVector = ((this.direction.x - child.direction.x) * normalX)
                        + ((this.direction.y - child.direction.y) * normalY);
                    const dvx = dVector * normalX;
                    const dvy = dVector * normalY;

                    // if (dvx > 1 || dvy > 1) {
                    //     debugger;
                    // }
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

                    const childSpeed = child.speed;
                    const thisSpeed = this.speed;

                    this.speed = Math.max(childSpeed, thisSpeed * 0.7);
                    child.speed = Math.max(thisSpeed, childSpeed * 0.7);
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
class CueBall extends Ball {
    constructor(...args) {
        super('white', ...args);
    }

}

class Cue {
    constructor(cueBall) {
        this.cueBall = cueBall;
        this.direction = {};
        this.length = 400;
        this.show = false;
    }
    render(ctx) {
        ctx.beginPath();

        // REF https://gist.github.com/conorbuck/2606166
        // REF https://stackoverflow.com/questions/23598547/draw-a-line-from-x-y-with-a-given-angle-and-length

        ctx.moveTo(this.cueBall.location.x, this.cueBall.location.y);
        ctx.lineTo(
            this.cueBall.location.x + this.length * this.direction.x,
            this.cueBall.location.y + this.length * this.direction.y
        );
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 8;
        ctx.stroke();
    }

    mouseMove(x, y) {
        this.x = x;
        this.y = y;
        this.setDirection();
    }

    mouseDown() {
        this.show = true;
    }

    update() {
        this.setDirection();
    }

    setDirection() {
        const theta = Math.atan2(this.y - this.cueBall.location.y, this.x - this.cueBall.location.x);
        this.direction = {
            x: Math.cos(theta),
            y: Math.sin(theta)
        };
    }

    mouseUp(x, y) {
        this.show = false;

        const dist = calculateDistance({ x, y}, this.cueBall.location);
        const strength = (dist / this.length) * 30;

        this.x = x;
        this.y = y;
        this.setDirection();

        this.cueBall.direction.x = -this.direction.x;
        this.cueBall.direction.y = -this.direction.y;
        this.cueBall.speed = strength;
    }

}

class Game {
    constructor(canvas, width, height) {
        canvas.setSize(width, height);
        canvas.attachMouseMoveListener(this.mouseMove.bind(this));
        canvas.attachMouseUpListener(this.mouseUp.bind(this));
        canvas.attachMouseDownListener(this.mouseDown.bind(this));

        this.children = [];
        this.canvas = canvas;
        this.loop = this.loop.bind(this);

        const table = new Rectangle('#30a109', 0, 0, width, height);

        // @todo Consider how to move this into the Rail class
        const RAIL_SIZE = 20;
        const rail1 = new Rail(0, 0, width, RAIL_SIZE, RAIL_TOP);
        const rail2 = new Rail(0, height-RAIL_SIZE, width, RAIL_SIZE, RAIL_BOTTOM);
        const rail3 = new Rail(0, 0, RAIL_SIZE, height, RAIL_LEFT);
        const rail4 = new Rail(width-RAIL_SIZE, 0, RAIL_SIZE, height, RAIL_RIGHT);

        //color, x, y, radius
        const POCKET_SIZE = 24;
        const pocket1 = new Pocket('#2e2e2e', RAIL_SIZE, RAIL_SIZE, POCKET_SIZE);
        const pocket2 = new Pocket('#2e2e2e', (width/2), RAIL_SIZE, POCKET_SIZE);
        const pocket3 = new Pocket('#2e2e2e', width-RAIL_SIZE, RAIL_SIZE, POCKET_SIZE);
        const pocket4 = new Pocket('#2e2e2e', RAIL_SIZE, height-RAIL_SIZE, POCKET_SIZE);
        const pocket5 = new Pocket('#2e2e2e', (width/2), height-RAIL_SIZE, POCKET_SIZE);
        const pocket6 = new Pocket('#2e2e2e', width-RAIL_SIZE, height-RAIL_SIZE, POCKET_SIZE);
        //middle pockets not aligned to centre?
        const pockets = [];
        pockets.push(pocket1, pocket2, pocket3, pocket4, pocket5, pocket6);

        // const ball = new Ball('#094ea1', width / 2, height / 2, 14, 1, 1, 5);
        const cueBall = new CueBall(240, 240, 12, 1, 1, 5);
        const cue = new Cue(cueBall);

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

        this.addChild(cueBall);
        this.addChild(cue);

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

    mouseMove(x, y) {
        for (let child of this.children) {
            if (child.mouseMove) {
                child.mouseMove(x, y);
            }
        }
    }

    mouseDown(x, y) {
        for (let child of this.children) {
            if (child.mouseDown) {
                child.mouseDown(x, y);
            }
        }
    }

    mouseUp(x, y) {
        for (let child of this.children) {
            if (child.mouseUp) {
                child.mouseUp(x, y);
            }
        }
    }

    tick() {
        for (let child of this.children) {
            if (child.update) {
                child.update();
            }
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
        }
        this.canvas.render();
    }
}

function getRandomRange(min, max) {
    return Math.random() * (max - min) + min;
}

function collisionSandbox(game) {
    const locations = [];
    for (let i = 0; i < 10; i++) {
        const locX = getRandomRange(100, 900);
        const locY = getRandomRange(100, 400);

        if (locations.find(loc => calculateDistance(loc, { x: locX, y: locY }) <= 28)) {
            i--;
            continue;
        }

        locations.push({ x: locX, y: locY });

        const dirX = getRandomRange(-1, 1);
        const dirY = getRandomRange(-1, 1);
        const speed = getRandomRange(1, 6);

        const ball = new Ball('#ffbf00', locX, locY, 14, dirX, dirY, speed);
        game.addChild(ball);
    }
}

function main() {
    const canvas = new Canvas(document.querySelector('#game'));
    const game = new Game(canvas, 1000, 500);

    collisionSandbox(game);

    game.startTicking();
}

main();