import { checkIntersection } from 'line-intersect';

import Pool from './Pool';
import Snooker from './Snooker';
import Sandbox from './Sandbox';
import DemoPool from './DemoPool';
import DemoSnooker1 from './DemoSnooker1';
import DemoSnooker2 from './DemoSnooker2';

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

export const calculateDistance = (a, b) => Math.sqrt(
    Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2)
);

const CUE_MAX_X = 250;

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
const RAIL_SIZE = 36;

const POCKET_COLLIDE_ANY = 5;

const BALL_COLLIDE_ANY = 6;

const CUE_COLLIDE = 7;

class Pocket {
    constructor(color, locationX, locationY, radius) {
        this.color = color;
        this.location = { x: locationX, y: locationY };
        this.radius = radius;
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
            this.direction.x = 0;
            this.direction.y = 0;
        }
        else {
            this.speed *= 0.985;
        }
        this.location.x += this.speed * this.direction.x;
        this.location.y += this.speed * this.direction.y;
    }

    isColliding(child) {
        if (child instanceof Pocket) {
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

            this.speed = 0;
            this.direction.x = 0;
            this.direction.y = 0;

            //element has to be removed, not moved off-screen as this registers as a collision with the rails
            this.onPocket(game);
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
                    const dVector = ((this.direction.x - child.direction.x) * normalX)
                        + ((this.direction.y - child.direction.y) * normalY);
                    const dvx = dVector * normalX;
                    const dvy = dVector * normalY;

                    this.direction.x -= dvx;
                    this.direction.y -= dvy;
                    child.direction.x += dvx;
                    child.direction.y += dvy;

                    const childSpeed = child.speed;
                    const thisSpeed = this.speed;

                    //simple simulation of transfer of energy
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

export class GameBall extends Ball {
    onPocket(game) {
        game.removeChild(this);
    }
}

export class CueBall extends Ball {
    constructor(...args) {
        super('white', ...args);
        this.toBePlaced = true;
    }

    onPocket() {
        this.toBePlaced = true;
        this.mouseMove(...this.cursorPosition);
    }

    mouseMove(x, y) {
        this.cursorPosition = [x, y];
        if (this.toBePlaced) {
            this.previousLocation = { ...this.location };
            this.location.x = Math.max(0, Math.min(CUE_MAX_X, x));
            this.location.y = Math.max(0, y);
        }
    }

    mouseUp() {
        setTimeout(() => {
            this.toBePlaced = false;
        });
    }

    collisionResponse(...args) {
        if (!this.toBePlaced) {
            return super.collisionResponse(...args);
        } else {
            this.location = this.previousLocation;
        }
    }

}

class Cue {
    constructor(cueBall, game) {
        this.cueBall = cueBall;
        this.direction = {};
        this.length = 400;
        this.show = false;
        this.active = true;
        this.game = game;
    }

    setActive() {
        this.active = true;
    }

    setInactive() {
        this.active = false;
        this.show = false;
    }

    render(ctx) {
        ctx.beginPath();

        // REF https://gist.github.com/conorbuck/2606166
        // REF https://stackoverflow.com/questions/23598547/draw-a-line-from-x-y-with-a-given-angle-and-length
        //cue itself
        ctx.moveTo(this.cueBall.location.x, this.cueBall.location.y);
        ctx.lineTo(
            this.cueBall.location.x + this.length * this.direction.x,
            this.cueBall.location.y + this.length * this.direction.y
        );
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.closePath();

        this.renderGuide(ctx);
    }

    mouseMove(x, y) {
        this.x = x;
        this.y = y;
        this.setDirection();
        this.calculateColor(x, y);
    }

    calculateColor(x, y) {
        const brightness = 255 - Math.floor(255 * Math.min(1, this.calculateStrength(x, y)));
        this.color = `rgb(255, ${brightness}, ${brightness})`;
    }

    mouseDown(x, y) {
        if (this.isActive()) {
            this.show = true;
            this.calculateColor(x, y);
        }
    }

    isActive() {
        return this.active && !this.cueBall.toBePlaced;
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
        if (this.isActive() && this.show) {
            this.show = false;

            const strength = this.calculateStrength(x, y) * 30;

            this.x = x;
            this.y = y;
            this.setDirection();

            this.cueBall.direction.x = -this.direction.x;
            this.cueBall.direction.y = -this.direction.y;
            this.cueBall.speed = strength;
        }
    }

    calculateStrength(x, y) {
        return calculateDistance({x, y}, this.cueBall.location) / this.length;
    }
    //draws aiming guide
    renderGuide(ctx) {
        const [collision] = this.game.getCollisions(this) || [];
        const destination = collision ? collision[1] : this.getGuideDestination();

        ctx.beginPath();
        ctx.moveTo(this.cueBall.location.x, this.cueBall.location.y);
        ctx.lineTo(
            destination.x,
            destination.y
        );
        ctx.setLineDash([2,3]);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        ctx.setLineDash([]);

    }

    isColliding(child) {
        if (this.show) {
            const destination = this.getGuideDestination();
            const location = { ...this.cueBall.location };


            if (child instanceof Rail) {
                const line = [location.x, location.y, destination.x, destination.y];
                let collisionLine;
                switch (child.type) {
                    case RAIL_TOP:
                        collisionLine = [child.x, child.y + child.height, child.x + child.width, child.y + child.height];
                        break;
                    case RAIL_BOTTOM:
                        collisionLine = [child.x, child.y, child.x + child.width, child.y];
                        break;
                    case RAIL_LEFT:
                        collisionLine = [child.x + child.width, child.y, child.x + child.width, child.y + child.height];
                        break;
                    case RAIL_RIGHT:
                        collisionLine = [child.x, child.y, child.x, child.y + child.height];
                        break;
                }
                const intersection = checkIntersection(...line, ...collisionLine);
                if (intersection.type === 'intersecting') {
                    return [CUE_COLLIDE, intersection.point];
                }
            }

        }
    }

    getGuideDestination() {
        return {
            x: this.cueBall.location.x + this.length * 3 * -this.direction.x,
            y: this.cueBall.location.y + this.length * 3 * -this.direction.y
        };
    }
}

class Game {
    constructor(canvas, width, height, GameType) {
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
        this.addChild(new Rectangle('white', CUE_MAX_X, RAIL_SIZE, 2, height - (RAIL_SIZE * 2)));

        this.addChild(new Rail(0, 0, width, RAIL_SIZE, RAIL_TOP));
        this.addChild(new Rail(0, height - RAIL_SIZE, width, RAIL_SIZE, RAIL_BOTTOM));
        this.addChild(new Rail(0, 0, RAIL_SIZE, height, RAIL_LEFT));
        this.addChild(new Rail(width - RAIL_SIZE, 0, RAIL_SIZE, height, RAIL_RIGHT));

        const POCKET_SIZE = 32;
        this.addChild(new Pocket('#2e2e2e', RAIL_SIZE, RAIL_SIZE, POCKET_SIZE));
        this.addChild(new Pocket('#2e2e2e', (width / 2), RAIL_SIZE, POCKET_SIZE));
        this.addChild(new Pocket('#2e2e2e', width - RAIL_SIZE, RAIL_SIZE, POCKET_SIZE));
        this.addChild(new Pocket('#2e2e2e', RAIL_SIZE, height - RAIL_SIZE, POCKET_SIZE));
        this.addChild(new Pocket('#2e2e2e', (width / 2), height - RAIL_SIZE, POCKET_SIZE));
        this.addChild(new Pocket('#2e2e2e', width - RAIL_SIZE, height - RAIL_SIZE, POCKET_SIZE));

        this.emitter = new EventEmitter();

        this.cueBall = new CueBall(width * 0.25, height * 0.5, 12, 0, 0, 0);
        this.cue = new Cue(this.cueBall, this);

        this.rules = new GameType(this, this.emitter);

        this.addChild(this.cue);
        this.addChild(this.cueBall);
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
        if (typeof this.rules.tick === 'function') {
            this.rules.tick();
        }
    }

    getCollisions(child) {
        const collisions = [];
        for (let child2 of this.children) {
            if (child === child2) {
                continue;
            }
            if (child.isColliding) {
                const collision = child.isColliding(child2);
                if (collision) {
                    collisions.push(collision);
                }
            }
        }
        return collisions;
    }
}

const modes = {
    pool: Pool,
    snooker: Snooker,
    sandbox: Sandbox,
    demopool: DemoPool,
    demosnooker1: DemoSnooker1,
    demosnooker2: DemoSnooker2
};

const canvas = new Canvas(document.querySelector('#game'));
const list = Array.from(document.querySelectorAll('#menu li'));

for (let item of list) {
    item.addEventListener('click', e => {
        e.preventDefault();
        const mode = modes[e.currentTarget.dataset.option];
        e.currentTarget.parentNode.parentNode.removeChild(e.currentTarget.parentNode);

        const game = new Game(canvas, 1000, 500, mode);

        game.startTicking();
    })
}