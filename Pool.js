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


class Pool {
    constructor(game, events) {
        const colors = ['#b30000', '#ffcc00'];
        const balls = [];

        this.players = [new PoolPlayer(), new PoolPlayer()];
        this.currentPlayerIndex = 0;
        this.events = events;

        for (let i = 0; i < 14; i++) {
            const ball = new GameBall(colors[i % 2], 0, 0, 14, 0, 0, 0);
            balls.push(ball);
            game.addChild(ball);
        }

        balls.sort(() => Math.random() - 0.5);

        this.blackBall = new GameBall('#000000', 0, 0, 14, 0, 0, 0); //black
        game.addChild(this.blackBall);


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
            console.log('foul');
        });

        events.subscribe('pocket', this.onPocket.bind(this));
        events.subscribe('collide', () => {
            console.log('collide');
        });

        events.subscribe('turnStarted', () => {
            console.log('turnStarted');
        });
        events.subscribe('turnEnded', () => {
            this.changePlayer();
            console.log('turnEnded');
        });

        this.balls = [...balls, this.blackBall, game.cueBall];
    }

    changePlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    onPocket(ball) {
        if (ball instanceof CueBall) {
            this.events.trigger('foul');
        } else if (ball === this.blackBall) {
            //game over (check players scores first)
        } else {
            const player = this.players[this.currentPlayerIndex];
            const other = this.players[(this.currentPlayerIndex + 1) % this.players.length];

            if ((player.hasColor() && !player.ownsThisBall(ball)) || other.ownsThisBall(ball)) {
                this.events.trigger('foul');
            } else {
                if (!player.hasColor()) {
                    player.setBallOwnership(ball);
                }

                if (player.ownsThisBall(ball)) {
                    console.log('score');
                    // increment score
                }
            }

        }

    }

    tick() {
        let isMoving = this.balls.some(ball => ball.speed);
        if (this.turnStarted && !isMoving) {
            this.turnStarted = false;
            this.events.trigger('turnEnded');
        } else if (!this.turnStarted && isMoving) {
            this.turnStarted = true;
            this.events.trigger('turnStarted');
        }
    }

}