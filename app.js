class EventEmitter {
    constructor() {
        this.subscriptions = [];
    }

    subscribe(eventName, handler) {
        const subscription = [eventName, handler];

        this.subscriptions.push(subscription);

        return () => {
            this.subscriptions.splice(this.subscriptions.indexOf(subscription), 1);
        };
    }

    trigger(eventName, ...data) {
        for (let [theirEventName, handler] of this.subscriptions) {
            if (theirEventName === eventName) {
                handler(...data);
            }
        }
    }
}

class Canvas {
    constructor(container) {
        const canvas = document.createElement('canvas');

        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');

        this.canvas = canvas;
        this.ctx = ctx;
        this.children = [];
        this.translation = { x: 0, y: 0 };
        this.size = { width: 0, height: 0 };

        window.addEventListener('resize', () => this.syncToBrowser());
        this.syncToBrowser();
    }

    syncToBrowser() {
        this.canvasSize = {
            width: document.body.offsetWidth,
            height: document.body.offsetHeight
        };

        this.canvas.width = this.canvasSize.width;
        this.canvas.height = this.canvasSize.height;

        this.translate((this.canvasSize.width - this.size.width) / 2, (this.canvasSize.height - this.size.height) / 2);
    }

    setSize(width, height) {
        this.size = { width, height };
        this.syncToBrowser();
    }

    translate(x, y) {
        this.translation = { x, y };
        this.ctx.translate(x, y);
        this.render();
    }

    attach(eventName, handler) {
        this.canvas.addEventListener(
            eventName,
            e => handler(e.offsetX - this.translation.x, e.offsetY - this.translation.y)
        );
    }

    attachMouseMoveListener(fn) {
        this.attach('mousemove', fn);
    }

    attachMouseUpListener(fn) {
        this.attach('mouseup', fn);
    }

    attachMouseDownListener(fn) {
        this.attach('mousedown', fn);
    }

    clear() {
        this.ctx.clearRect(
            -this.translation.x, -this.translation.y,
            this.canvasSize.width + this.translation.x, this.canvasSize.height + this.translation.y
        );
    }

    addChild(child) {
        this.children.push(child);
    }

    removeChild(child) {
        this.children.splice(this.children.indexOf(child), 1);
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

    setLocation(x, y) {
        this.location = { x, y };
    }

    update() {
        if (this.speed < 0.3) {
            this.speed = 0;
        }
        else {
            this.speed *= 0.985;
        }
        this.location.x += this.speed * this.direction.x;
        this.location.y += this.speed * this.direction.y;
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

    collisionResponse(game, child, collisionType, data) {
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

            game.emitter.trigger('pocket', this);

            switch (collisionType) {
                case POCKET_COLLIDE_ANY:
                    this.speed = 0;
                    this.direction.x = 0;
                    this.direction.y = 0;

                    //element has to be removed, not moved off-screen as this registers as a collision with the rails
                    this.onPocket(game);

                    // //testing
                    // this.location.x = -200;
                    // this.location.y = -200;
            }
        }

        else if (child instanceof Ball) {

            game.emitter.trigger('collide', this, child);

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

    onPocket() {

    }

    render(ctx) {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.location.x, this.location.y, this.radius, 0, Math.PI * 2, false);
        ctx.fill();
        ctx.closePath();
    }
}

class GameBall extends Ball {
    onPocket(game) {
        game.removeChild(this);
    }
}

class CueBall extends Ball {
    constructor(...args) {
        super('white', ...args);
    }

    onPocket() {
        this.location.x = 250;
        this.location.y = 250;
    }

}

class Cue {
    constructor(cueBall) {
        this.cueBall = cueBall;
        this.direction = {};
        this.length = 400;
        this.show = false;
        this.active = true;
    }

    toggleActive() {
        this.active = !this.active;

        if (!this.active) {
            this.show = false;
        }
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
        if (this.active) {
            this.show = true;
        }
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
        if (this.active) {
            this.show = false;

            const dist = calculateDistance({x, y}, this.cueBall.location);
            const strength = (dist / this.length) * 30;

            this.x = x;
            this.y = y;
            this.setDirection();

            this.cueBall.direction.x = -this.direction.x;
            this.cueBall.direction.y = -this.direction.y;
            this.cueBall.speed = strength;
        }
    }

}

class Game {
    constructor(canvas, width, height) {
        this.width = width;
        this.height = height;

        this.children = [];
        this.canvas = canvas;
        this.loop = this.loop.bind(this);

        canvas.setSize(width, height);
        canvas.attachMouseMoveListener(this.mouseMove.bind(this));
        canvas.attachMouseUpListener(this.mouseUp.bind(this));
        canvas.attachMouseDownListener(this.mouseDown.bind(this));

        const table = new Rectangle('#30a109', 0, 0, width, height);
        this.addChild(table);

        // @todo Consider how to move this into the Rail class
        const RAIL_SIZE = 28;
        this.addChild(new Rail(0, 0, width, RAIL_SIZE, RAIL_TOP));
        this.addChild(new Rail(0, height-RAIL_SIZE, width, RAIL_SIZE, RAIL_BOTTOM));
        this.addChild(new Rail(0, 0, RAIL_SIZE, height, RAIL_LEFT));
        this.addChild(new Rail(width-RAIL_SIZE, 0, RAIL_SIZE, height, RAIL_RIGHT));

        const POCKET_SIZE = 24;
        this.addChild(new Pocket('#2e2e2e', RAIL_SIZE, RAIL_SIZE, POCKET_SIZE));
        this.addChild(new Pocket('#2e2e2e', (width / 2), RAIL_SIZE, POCKET_SIZE));
        this.addChild(new Pocket('#2e2e2e', width - RAIL_SIZE, RAIL_SIZE, POCKET_SIZE));
        this.addChild(new Pocket('#2e2e2e', RAIL_SIZE, height - RAIL_SIZE, POCKET_SIZE));
        this.addChild(new Pocket('#2e2e2e', (width / 2), height - RAIL_SIZE, POCKET_SIZE));
        this.addChild(new Pocket('#2e2e2e', width - RAIL_SIZE, height - RAIL_SIZE, POCKET_SIZE));

        this.emitter = new EventEmitter();

        this.cueBall = new CueBall(width*0.25, height*0.5, 12, 0, 0, 0);
        this.cue = new Cue(this.cueBall);

        this.addChild(this.cueBall);
        this.addChild(this.cue);

        this.rules = new Pool(this, this.emitter);
    }

    //add to end of array
    addChild(child) {
        this.canvas.addChild(child);
        this.children.push(child);
    }

    //remove specific element
    removeChild(child) {
        this.canvas.removeChild(child);
        this.children.splice(this.children.indexOf(child), 1);
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
                        child.collisionResponse(this, child2, collisionType, data);
                    }
                }
            }
        }
        this.canvas.render();
        this.rules.tick();
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

    // collisionSandbox(game);

    game.startTicking();
}

main();