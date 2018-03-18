import Pool, { BALL_COLORS } from './Pool';

export default class DemoPool extends Pool {
    constructor(...args) {
        super(...args);

        for (let i = 0; i < 13; i++) {
            this.balls[i].setLocation(0, 0);
        }
        //set player colours manually
        const player = this.players[this.currentPlayerIndex];
        const nextPlayer = this.players[this.getNextPlayerIndex()];
        player.setColor(this.balls[13].color);
        nextPlayer.setColor(BALL_COLORS.find(c => c !== this.balls[13].color));
        //overrides foul handling
        this.shotsLeft = 1;
        //lines up balls for potting
        this.balls[13].setLocation(920, 80);
        this.blackBall.setLocation(920, 420);
    }
}
