class PoolPlayer {
    ownsThisBall(ball) {
        return ball.color === this.color;
    }

    setBallOwnership(ball) {
        this.color = ball.color;
    }

    hasColor() {
        return this.color !== undefined;
    }

}

class ActivePlayer {
    constructor(pool) {
        this.pool = pool;
    }
    render (ctx) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.font = '48px serif';
        ctx.fillText(`Player ${this.pool.currentPlayerIndex + 1}`, 500, -50);
    }

}

class Pool {
    constructor(game, events) {
        const colors = ['#b30000', '#ffcc00'];
        const balls = [];

        this.game = game;
        this.players = [new PoolPlayer(), new PoolPlayer()];
        this.currentPlayerIndex = 0;
        this.events = events;
        this.shotsLeft = 1;

        for (let i = 0; i < 14; i++) {
            const ball = new GameBall(colors[i % 2], 0, 0, 14, 0, 0, 0);
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
        if (ball instanceof CueBall) {
            this.events.trigger('foul');
        } else if (ball === this.blackBall) {
            //game over (check players scores first)
        } else {
            if (!this.currentPlayerOwnsBall(ball)) {
                this.events.trigger('foul');
            } else {
                const player = this.players[this.currentPlayerIndex];
                if (!player.hasColor()) {
                    player.setBallOwnership(ball);
                }

                if (player.ownsThisBall(ball)) {
                    this.events.trigger('score');
                    console.log('score');
                }
            }
        }
    }

    currentPlayerOwnsBall(ball) {
        const player = this.players[this.currentPlayerIndex];
        const other = this.players[this.getNextPlayerIndex()];

        return (!player.hasColor() || player.ownsThisBall(ball)) && !other.ownsThisBall(ball)
    }

    onCollision(ballA, ballB) {
        if (ballA === this.game.cueBall) {
            this.onCueBallCollision(ballB);
        } else if (ballB === this.game.cueBall) {
            this.onCueBallCollision(ballA);
        }
    }

    onCueBallCollision(ball) {
        if (!this.hasHitBall) {
            if (!this.currentPlayerOwnsBall(ball)) {
                this.events.trigger('foul');
            }
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