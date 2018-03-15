const PLAYER_ONE = 1;
const PLAYER_TWO = 2;
const COLORS = {
    BLACK: '#000000',
    PINK: '#ff99ff',
    BLUE: '#0066ff',
    BROWN: '#663300',
    GREEN: '#006600',
    YELLOW: '#ffcc00'
};

const SCORES = {
    [COLORS.BLACK]: 7,
    [COLORS.PINK]: 6,
    [COLORS.BLUE]: 5,
    [COLORS.BROWN]: 4,
    [COLORS.GREEN]: 3,
    [COLORS.YELLOW]: 2
};

class SnookerPlayer {
    constructor(game, playerNumber) {
        this.game = game;
        this.playerNumber = playerNumber;
        this.totalScore = 0;
    }

    render(ctx) {
        if (this.playerNumber === PLAYER_ONE) {
            this.drawPlayerBar(ctx, 0);
            this.drawPlayerName(ctx, 16, 'left');
            this.drawScore(ctx, 14, 1);
        } else {
            this.drawPlayerBar(ctx, 994);
            this.drawPlayerName(ctx, 984, 'right');
            this.drawScore(ctx, 984, 'right');
        }
    }

    drawPlayerBar(ctx, x) {
        ctx.beginPath();
        if (this.game.players[this.game.currentPlayerIndex] !== this) {
            ctx.fillStyle = 'white';
            ctx.rect(x, -100, 6, 60);
            ctx.fill();
        } else {
            if (this.game.onColors) {
                ctx.fillStyle = '#ffcc00';
                ctx.rect(x, -100, 6, 10);
                ctx.fillStyle = '#006600';
                ctx.rect(x, -90, 6, 10);
                ctx.fillStyle = '#663300';
                ctx.rect(x, -80, 6, 10);
                ctx.fillStyle = '#0066ff';
                ctx.rect(x, -70, 6, 10);
                ctx.fillStyle = '#ff99ff';
                ctx.rect(x, -60, 6, 10);
                ctx.fillStyle = '#2e2e2e';
                ctx.rect(x, -50, 6, 10);
                ctx.fill();
            } else {
                ctx.fillStyle = '#b30000';
                ctx.rect(x, -100, 6, 60);
                ctx.fill();
            }
        }
        ctx.closePath();
    }

    drawPlayerName(ctx, x, alignment) {
        const player = `Player ${this.playerNumber}`;

        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.font = '20px Helvetica';
        ctx.textAlign = alignment;
        ctx.fillText(player, x, -80);
        ctx.closePath();
    }

    drawScore(ctx, x, alignment) {
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.font = '20px Helvetica';
        ctx.textAlign = alignment;
        ctx.fillText(`${this.totalScore}`, x, -50);
        ctx.closePath();
    }
}

class ActivePlayer {
    constructor(snooker) {
        this.snooker = snooker;
    }
    render (ctx) {
        ctx.beginPath();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.font = '48px Helvetica';
        ctx.fillText(`Player ${this.snooker.currentPlayerIndex + 1} – on ${this.snooker.onColors ? 'colours' : 'reds' } ( ${this.snooker.breakScore} )`, 500, -50);
        ctx.closePath();
    }

}

class Snooker {
    constructor(game, events) {

        this.game = game;
        this.players = [new SnookerPlayer(this, PLAYER_ONE), new SnookerPlayer(this, PLAYER_TWO)];

        this.currentPlayerIndex = 0;
        this.events = events;
        this.breakScore = 0;

        this.onColors = false;
        this.numReds = 15;

        for (let player of this.players) {
            game.addChild(player);
        }
        game.addChild(new ActivePlayer(this));

        const balls = [];
        const redBalls = [];
        const colouredBalls = [
            this.placeYellow(),
            this.placeGreen(),
            this.placeBrown(),
            this.placeBlue(),
            this.placePink(),
            this.placeBlack(),
        ];

        //generate reds
        for (let i = 0; i < 15; i++) {
            const ball = new GameBall('#b30000', 0, 0, 12, 0, 0, 0);
            redBalls.push(ball);
            game.addChild(ball);
        }
        //position reds
        const CentrePosition = {x: game.width * 0.75, y: game.height * 0.5};
        const ballDiameter = 12 * 2;
        const buffer = ballDiameter + 1;

        redBalls[0].setLocation(CentrePosition.x - buffer * 2, CentrePosition.y);

        redBalls[1].setLocation(CentrePosition.x - buffer, CentrePosition.y + buffer * 0.5);
        redBalls[2].setLocation(CentrePosition.x - buffer, CentrePosition.y - buffer * 0.5);

        redBalls[3].setLocation(CentrePosition.x, CentrePosition.y + buffer);
        redBalls[4].setLocation(CentrePosition.x, CentrePosition.y);
        redBalls[5].setLocation(CentrePosition.x, CentrePosition.y - buffer);

        redBalls[6].setLocation(CentrePosition.x + buffer, CentrePosition.y + buffer * 1.5);
        redBalls[7].setLocation(CentrePosition.x + buffer, CentrePosition.y + buffer * 0.5);
        redBalls[8].setLocation(CentrePosition.x + buffer, CentrePosition.y - buffer * 0.5);
        redBalls[9].setLocation(CentrePosition.x + buffer, CentrePosition.y - buffer * 1.5);

        redBalls[10].setLocation(CentrePosition.x + buffer * 2, CentrePosition.y + buffer * 2);
        redBalls[11].setLocation(CentrePosition.x + buffer * 2, CentrePosition.y + buffer);
        redBalls[12].setLocation(CentrePosition.x + buffer * 2, CentrePosition.y);
        redBalls[13].setLocation(CentrePosition.x + buffer * 2, CentrePosition.y - buffer);
        redBalls[14].setLocation(CentrePosition.x + buffer * 2, CentrePosition.y - buffer * 2);

        //generate/position colours for initial setup
        //extracted to methods as they must be replaced

        //events
        events.subscribe('breakStarted', () => {
            console.log('breakStarted');
            this.breakScore = 0;
            this.onColors = false;
        });
        events.subscribe('breakEnded', () => {
            console.log('breakEnded');
            this.players[this.currentPlayerIndex].totalScore += this.breakScore;
            this.breakScore = 0;
            this.changePlayer();
        }); //break events

        events.subscribe('shotStarted', () => {
            console.log('shotStarted');
            this.hasHitBall = false;
            game.cue.setInactive();
        });
        events.subscribe('shotEnded', () => {
            console.log('shotEnded');
            this.replaceColors();
            game.cue.setActive();

        }); //shot events

        events.subscribe('legalPot', ballValue => {
            // console.log('legalPot');
            this.breakScore += ballValue;
            this.changeTargetBall();
            this.hasPotted = true;
        });

        events.subscribe('legalNonPotShot', () => {
            console.log('legalNonPotShot');

            events.trigger('shotEnded');
            events.trigger('breakEnded');
        });

        events.subscribe('foul', ball => {
            this.hasFouled = true;
            this.foulBall = ball;
            console.log('foul');
        });

        const MIN_FOUL = 4;
        //defaults to 4 if passed value <4 or null
        events.subscribe('foulShot', (ballValue = MIN_FOUL) => {
            const foulValue = Math.max(MIN_FOUL, ballValue);
            this.players[this.getNextPlayerIndex()].totalScore += foulValue;
            console.log(`foulShot, value ${foulValue}`);

            events.trigger('shotEnded');
            events.trigger('breakEnded');
        });

        events.subscribe('pocket', this.onPocket.bind(this));
        events.subscribe('collide', this.onCollision.bind(this));

        events.subscribe('gameWon', winningPlayer => {
            console.log('Game Over', winningPlayer);
        });

        this.balls = [...redBalls, ...colouredBalls, game.cueBall];
        this.pocketedColours = [];
        this.redBalls = redBalls;
        this.colouredBalls = colouredBalls;
    } //constructor

    onPocket(ball) {
        const player = this.players[this.currentPlayerIndex];
        const nextPlayer = this.players[this.getNextPlayerIndex()];

        if (ball instanceof CueBall) {
            this.events.trigger('foul');
        } else if (!this.onColors) {
            if (this.redBalls.includes(ball)) {
                this.numReds--;
                this.events.trigger('legalPot', 1);
            } else if (this.colouredBalls.includes(ball)) {
                const foulValue = SCORES[ball.color];
                this.pocketedColours.push(ball);
                this.events.trigger('foul', foulValue);
            }
        } else {
            if (this.redBalls.includes(ball)) {
                this.numReds--;
                this.events.trigger('foul', 1);
            } else if (this.colouredBalls.includes(ball)) {
                const scoreValue = SCORES[ball.color];
                this.pocketedColours.push(ball);
                this.events.trigger('legalPot', scoreValue);
            }
        }
    }

    onCollision(ballA, ballB) {
        if (ballA === this.game.cueBall) {
            this.onCueBallCollision(ballB);
        } else if (ballB === this.game.cueBall) {
            this.onCueBallCollision(ballA);
        }
    }

    onCueBallCollision(ball) {
        if (this.onColors && this.colouredBalls.includes(ball)) {
            //legal, unknown if potted yet
        } else if (!this.onColors && this.redBalls.includes(ball)) {
            //legal, unknown if potted yet
        } else {
            this.events.trigger('foul', SCORES[ball.color]);
        }
        this.hasHitBall = true;
    }

    replaceColors() {

        if (this.numReds > 0) {
            this.toBeReplaced = this.colouredBalls.filter(ball => this.pocketedColours.includes(ball));
        }
        if (this.toBeReplaced.includes(this.yellowBall)) {
            this.placeYellow();
        }
        if (this.toBeReplaced.includes(this.greenBall)) {
            this.placeGreen();
        }
        if (this.toBeReplaced.includes(this.brownBall)) {
            this.placeBrown();
        }
        if (this.toBeReplaced.includes(this.blueBall)) {
            this.placeBlue();
        }
        if (this.toBeReplaced.includes(this.pinkBall)) {
            this.placePink();
        }
        if (this.toBeReplaced.includes(this.blackBall)) {
            this.placeBlack();
        }

        this.toBeReplaced = []; //clear
    }

    placeBlack() {
        this.blackBall = new GameBall(COLORS.BLACK, 850, 250, 14, 0, 0, 0);
        this.game.addChild(this.blackBall);
        return this.blackBall;
    }

    placePink() {
        this.pinkBall = new GameBall(COLORS.PINK, 650, 250, 14, 0, 0, 0);
        this.game.addChild(this.pinkBall);
        return this.pinkBall;
    }

    placeBlue() {
        this.blueBall = new GameBall(COLORS.BLUE, 500, 250, 14, 0, 0, 0);
        this.game.addChild(this.blueBall);
        return this.blueBall;
    }

    placeBrown() {
        this.brownBall = new GameBall(COLORS.BROWN, 200, 250, 14, 0, 0, 0);
        this.game.addChild(this.brownBall);
        return this.brownBall;
    }

    placeGreen() {
        this.greenBall = new GameBall(COLORS.GREEN, 200, 150, 14, 0, 0, 0);
        this.game.addChild(this.greenBall);
        return this.greenBall;
    }

    placeYellow() {
        this.yellowBall = new GameBall(COLORS.YELLOW, 200, 350, 14, 0, 0, 0);
        this.game.addChild(this.yellowBall);
        return this.yellowBall;
    }

    changePlayer() {
        this.currentPlayerIndex = this.getNextPlayerIndex();
        this.onColors = false;
    }

    getNextPlayerIndex() {
        return (this.currentPlayerIndex + 1) % this.players.length;
    }

    changeTargetBall() {
        this.onColors = !this.onColors;
    }

    tick() {
        let isMoving = this.balls.some(ball => ball.speed);

        if (this.gameEnded) {
            return;
        }

        if (!isMoving) {
            if (this.hasFouled || (this.shotStarted && !this.hasHitBall)) { //?
                this.hasFouled = false;
                this.events.trigger('foulShot', this.foulBall);
            } else if (this.shotStarted) {
                if (this.hasPotted) {
                    this.events.trigger('shotEnded');
                } else {
                    this.events.trigger('legalNonPotShot');
                }
                this.hasPotted = false;
            }
            this.shotStarted = false;
        } else if (!this.shotStarted) {
            this.shotStarted = true;
            this.events.trigger('shotStarted');
        }
    }

    gameOver(winningPlayer)  {
        this.game.cue.setInactive();
        this.gameEnded = true;
        this.winningPlayer = winningPlayer;
        console.log('Game Over', winningPlayer);
    }
} //class Snooker