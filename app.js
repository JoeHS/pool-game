class Canvas {
    constructor(container, size) {
        const canvas = document.createElement('canvas');

        canvas.width = canvas.height = size;

        container.appendChild(canvas);

        this.canvas = canvas;
        this.size = size;
        this.ctx = this.canvas.getContext('2d');
    }

    render() {
        this.ctx.clearRect(0, 0, this.size, this.size);

        const colours = ['#FFEFD5', '#DB7093', '#75DBCD', '#403F4C', '#D64550'];
        const colour = colours[Math.floor(Math.random() * colours.length)];

        this.ctx.beginPath();
        this.ctx.fillStyle = colour;
        this.ctx.arc(150, 150, 100, 0, Math.PI * 2, false);
        this.ctx.fill();
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.loop = this.loop.bind(this);
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
        console.log('Tick!');
        this.canvas.render();
    }
}

function main() {
    const canvas = new Canvas(document.querySelector('#game'), 500);
    const game = new Game(canvas);
    game.startTicking();

    setTimeout(() => game.stopTicking(), 5000);
}

main();