const PLAYER_ONE = 1;
const PLAYER_TWO = 2;
const BALL_COLORS = ['#b30000', '#ffcc00'];

class PoolPlayer {
    constructor(game, playerNumber) {
        this.game = game;
        this.playerNumber = playerNumber;
    }

    ownsThisBall(ball) {
        return ball.color === this.color;
    }

    setColor(color) {
        this.color = color;
    }

    hasColor() {
        return this.color !== undefined;
    }

    render(ctx) {
        if (this.playerNumber === PLAYER_ONE) {
            this.drawPlayerBar(ctx, 0);
            this.drawPlayerName(ctx, 16, 'left');
            this.drawScore(ctx, 14, 1);
        } else {
            this.drawPlayerBar(ctx, 994);
            this.drawPlayerName(ctx, 984, 'right');
            this.drawScore(ctx, 986, -1);
        }
    }

    drawScore(ctx, beginX, direction) {
        const score = this.game.getPocketedBallsOfColor(this.color).length;
        for (let i = 0; i < score; i++){
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(beginX + (direction * (10 + (i * 28))), -56, 10, 0, Math.PI * 2, false);
            ctx.fill();
            ctx.closePath();
        }
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

    drawPlayerBar(ctx, x) {
        ctx.beginPath();
        ctx.fillStyle = this.color || 'white';
        ctx.rect(x, -100, 6, 60);
        ctx.fill();
        ctx.closePath();
    }
}

class ActivePlayer {
    constructor(pool) {
        this.pool = pool;
    }
    render (ctx) {
        ctx.beginPath();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.font = '48px Helvetica';
        ctx.fillText(`Player ${this.pool.currentPlayerIndex + 1}`, 500, -50);
        ctx.closePath();
    }

}

class Pool {
    constructor(game, events) {
        const balls = [];

        this.game = game;
        this.players = [new PoolPlayer(this, PLAYER_ONE), new PoolPlayer(this, PLAYER_TWO)];
        this.currentPlayerIndex = 0;
        this.events = events;
        this.shotsLeft = 1;

        for (let player of this.players) {
            game.addChild(player);
        }

        for (let i = 0; i < 14; i++) {
            const ball = new GameBall(BALL_COLORS[i % 2], 0, 0, 14, 0, 0, 0);
            balls.push(ball);
            game.addChild(ball);
        }

        balls.sort(() => Math.random() - 0.5);

        this.blackBall = new GameBall('#000000', 0, 0, 14, 0, 0, 0); //black
        game.addChild(this.blackBall);

        game.addChild(new ActivePlayer(this));

        //defines starting positions of balls
        const CentrePosition = {x: game.width * 0.75, y: game.height * 0.5};
        const ballDiameter = 14 * 2;
        const buffer = ballDiameter + 1;

        balls[0].setLocation(CentrePosition.x - buffer * 2, CentrePosition.y);

        balls[1].setLocation(CentrePosition.x - buffer, CentrePosition.y + buffer * 0.5);
        balls[2].setLocation(CentrePosition.x - buffer, CentrePosition.y - buffer * 0.5);

        balls[3].setLocation(CentrePosition.x, CentrePosition.y + buffer);
        this.blackBall.setLocation(CentrePosition.x, CentrePosition.y);
        balls[4].setLocation(CentrePosition.x, CentrePosition.y - buffer);

        balls[5].setLocation(CentrePosition.x + buffer, CentrePosition.y + buffer * 1.5);
        balls[6].setLocation(CentrePosition.x + buffer, CentrePosition.y + buffer * 0.5);
        balls[7].setLocation(CentrePosition.x + buffer, CentrePosition.y - buffer * 0.5);
        balls[8].setLocation(CentrePosition.x + buffer, CentrePosition.y - buffer * 1.5);

        balls[9].setLocation(CentrePosition.x + buffer * 2, CentrePosition.y + buffer * 2);
        balls[10].setLocation(CentrePosition.x + buffer * 2, CentrePosition.y + buffer);
        balls[11].setLocation(CentrePosition.x + buffer * 2, CentrePosition.y);
        balls[12].setLocation(CentrePosition.x + buffer * 2, CentrePosition.y - buffer);
        balls[13].setLocation(CentrePosition.x + buffer * 2, CentrePosition.y - buffer * 2);

        //events
        events.subscribe('breakStart', () => {
            console.log('breakStart');
        });
        events.subscribe('breakEnd', () => {
            console.log('breakEnd');
        });
        events.subscribe('foul', () => {
            this.hasFouled = true;
            console.log('foul');
        });
        events.subscribe('shotFouled', () => {
            console.log('shotFouled');

            this.changePlayer();
            this.shotsLeft = 2;

            events.trigger('shotEnded');
        });

        events.subscribe('score', () => {
            this.shotsLeft = 1;
        });

        events.subscribe('pocket', this.onPocket.bind(this));

        events.subscribe('collide', this.onCollision.bind(this));

        events.subscribe('shotStarted', () => {
            console.log('shotStarted');

            this.hasHitBall = false;
            this.shotsLeft -= 1;

            game.cue.setInactive();
        });
        events.subscribe('shotLegal', () => {
            console.log('shotLegal');

            if (!this.hasHitBall) {
                events.trigger('foul');
            } else if (this.shotsLeft <= 0) {
                this.changePlayer();
            }

            events.trigger('shotEnded');
        });

        events.subscribe('shotEnded', () => {
            console.log('shotEnded');
            game.cue.setActive();
        });

        events.subscribe('gameWon', winningPlayer => {
            console.log('Game Over', winningPlayer);
        });

        this.balls = [...balls, this.blackBall, game.cueBall];
    }

    changePlayer() {
        this.currentPlayerIndex = this.getNextPlayerIndex();
        this.shotsLeft = 1;
    }

    getNextPlayerIndex() {
        return (this.currentPlayerIndex + 1) % this.players.length;
    }

    onPocket(ball) {
        const player = this.players[this.currentPlayerIndex];
        const nextPlayer = this.players[this.getNextPlayerIndex()];

        if (ball instanceof CueBall) {
            this.events.trigger('foul');
        } else if (ball === this.blackBall) {
            //game over

            if (this.getPocketedBallsOfColor(player.color).length === 7) {
                this.events.trigger('gameWon', player);
            } else {
                this.events.trigger('gameWon', nextPlayer);
            }

        } else {
            ball.pocketed = true;
            if (!this.currentPlayerOwnsBall(ball)) {
                this.events.trigger('foul');
            } else {
                if (!player.hasColor()) {
                    player.setColor(ball.color);
                    nextPlayer.setColor(BALL_COLORS.find(c => c !== ball.color));
                }

                if (player.ownsThisBall(ball)) {
                    this.events.trigger('score');
                    console.log('score');
                }
            }
        }
    }

    getPocketedBallsOfColor(color) {
        return this.balls.filter(ball => ball.pocketed && ball.color === color);
    }

    currentPlayerOwnsBall(ball) {
        const player = this.players[this.currentPlayerIndex];

        return !player.hasColor() || player.ownsThisBall(ball);
    }

    onCollision(ballA, ballB) {
        if (ballA === this.game.cueBall) {
            this.onCueBallCollision(ballB);
        } else if (ballB === this.game.cueBall) {
            this.onCueBallCollision(ballA);
        }
    }

    onCueBallCollision(ball) {
        if (!this.hasHitBall && (ball === this.blackBall || !this.currentPlayerOwnsBall(ball))) {
            this.events.trigger('foul');
        }
        this.hasHitBall = true;
    }

    tick() {
        let isMoving = this.balls.some(ball => ball.speed);

        if (!isMoving) {
            if (this.hasFouled) {
                this.hasFouled = false;
                this.events.trigger('shotFouled');
            } else if (this.shotStarted) {
                this.events.trigger('shotLegal');
            }
            this.shotStarted = false;
        } else if (!this.shotStarted) {
            this.shotStarted = true;
            this.events.trigger('shotStarted');
        }
    }

}