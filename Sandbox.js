import { GameBall} from './app';

export default class Sandbox {
    constructor(game) {
        const locations = [];
        const balls = [];
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

            balls[i] = new GameBall('#ffbf00', locX, locY, 14, dirX, dirY, speed);
            game.addChild(balls[i]);

            game.cue.setActive();

            this.balls = [...balls, game.cueBall];
        }
    }
}

function getRandomRange(min, max) {
    return Math.random() * (max - min) + min;
}

const calculateDistance = (a, b) => Math.sqrt(
    Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2)
);
