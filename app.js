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

class Ball {
    constructor(color, locationX, locationY, radius, directionX, directionY, speed) {
        this.color = color;
        this.location = { x: locationX, y: locationY };
        this.radius = radius;
        this.direction = { x: directionX, y: directionY };
        this.speed = speed;
    }

    update() {
        this.location.x += this.speed * this.direction.x;
        this.location.y += this.speed * this.direction.y;

        if (this.location.x >= 100) {
            this.color = '#f77fff';
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

        let table = new Rectangle('#30a109', 0, 0, 1000, 500);
        let ball = new Ball('#094ea1', 0, 0, 14, 5, 5, 1);

        this.addChild(table);
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

    setTimeout(() => game.stopTicking(), 5000);
}

main();