import { GameBall, CueBall } from './app';

const PLAYER_ONE = 1;
const PLAYER_TWO = 2;
const BALL_COLORS = ['#b30000', '#ffcc00'];

//stores properties of players
class PoolPlayer {
    constructor(game, playerNumber) {
        this.game = game;
        this.playerNumber = playerNumber;
    }
    //getter function for ball ownership
    ownsThisBall(ball) {
        return ball.color === this.color;
    }
    //setter function, as above
    setColor(color) {
        this.color = color;
    }
    //undefined if no colour set, allows for setting both player's colours at once
    hasColor() {
        return this.color !== undefined;
    }

    //draws relevant features for player 1 & 2
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

    //draws graphic of pocketed balls
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

    //draws player names in corners
    drawPlayerName(ctx, x, alignment) {
        const player = `Player ${this.playerNumber}`;

        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.font = '20px Helvetica';
        ctx.textAlign = alignment;
        ctx.fillText(player, x, -80);
        ctx.closePath();
    }
    //draws corner graphic, indicates ball assignment
    drawPlayerBar(ctx, x) {
        ctx.beginPath();
        ctx.fillStyle = this.color || 'white';
        ctx.rect(x, -100, 6, 60);
        ctx.fill();
        ctx.closePath();
    }
}

//allows rendering of current player, plus shots remaining
class ActivePlayer {
    constructor(pool, game) {
        this.pool = pool;
        this.game = game;
    }
    render (ctx) {
        //end state case
        if (this.pool.gameEnded) {
            return this.renderWinningPlayer(ctx);
        } else {
            //normal game-play display
            ctx.beginPath();
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.font = '32px Helvetica';
            ctx.fillText(`Player ${this.pool.currentPlayerIndex + 1} – ${this.pool.shotsLeft} shot(s) remaining`, 500, -50);
            ctx.closePath();
        }
    }
    //draws end state case, displays winning player
    renderWinningPlayer(ctx) {
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.font = '32px Helvetica';
        ctx.fillText(`Game Over! – Player ${this.pool.winningPlayer.playerNumber} wins!`, 500, -50);
        ctx.closePath();
    }
}
//rules for Pool game
export default class Pool {
    //set up init game state
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
        //creates ball objects
        for (let i = 0; i < 14; i++) {
            const ball = new GameBall(BALL_COLORS[i % 2], 0, 0, 14, 0, 0, 0);
            balls.push(ball);
            game.addChild(ball);
        }
        //randomise array for random layout
        balls.sort(() => Math.random() - 0.5);
        //creates black ball
        this.blackBall = new GameBall('#000000', 0, 0, 14, 0, 0, 0); //black
        game.addChild(this.blackBall);

        game.addChild(new ActivePlayer(this, game));

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

        /***/
        //gets game to near end state (one random colour, plus the black ball remain)
        for (let i = 0; i < 13; i++) {
            balls[i].setLocation(0, 0);
        }
        //set player colours manually
        const player = this.players[this.currentPlayerIndex];
        const nextPlayer = this.players[this.getNextPlayerIndex()];
        player.setColor(balls[13].color);
        nextPlayer.setColor(BALL_COLORS.find(c => c !== balls[13].color));
        //overrides foul handling
        this.shotsLeft = 1;
        //lines up balls for potting
        balls[13].setLocation(920, 80);
        this.blackBall.setLocation(920, 420);
        /***/

        //event subscriptions
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

        events.subscribe('gameWon', this.gameOver.bind(this));

        this.balls = [...balls, this.blackBall, game.cueBall];
    }
    //setter
    changePlayer() {
        this.currentPlayerIndex = this.getNextPlayerIndex();
        this.shotsLeft = 1;
    }
    //getter
    getNextPlayerIndex() {
        return (this.currentPlayerIndex + 1) % this.players.length;
    }
    //pocketing event logic
    onPocket(ball) {
        const player = this.players[this.currentPlayerIndex];
        const nextPlayer = this.players[this.getNextPlayerIndex()];

        if (ball instanceof CueBall) {
            this.events.trigger('foul');
        } else if (ball === this.blackBall) {
            //game ends, either a win – or loss for current player, if they foul
            if (this.hasPottedAllOwnBalls()) {
                this.events.trigger('gameWon', player);
            } else {
                this.events.trigger('gameWon', nextPlayer);
            }

        } else {
            //record this object as pocketed
            ball.pocketed = true;
            //if this is a foul
            if (!this.currentPlayerOwnsBall(ball) && (ball !== this.blackBall || !this.hasPottedAllOwnBalls())) {
                this.events.trigger('foul');
            } else {
                if (!player.hasColor()) {
                    //if unset, sets colours on first pocket of the game
                    player.setColor(ball.color);
                    nextPlayer.setColor(BALL_COLORS.find(c => c !== ball.color));
                }
                //finally if legal pot
                if (player.ownsThisBall(ball)) {
                    this.events.trigger('score');
                    console.log('score');
                }
            }
        }
    }
    //used to determine legality of potting black
    hasPottedAllOwnBalls() {
        return this.getPocketedBallsOfColor(this.players[this.currentPlayerIndex].color).length === 7;
    }
    //gets pocketed balls of colour x
    getPocketedBallsOfColor(color) {
        return this.balls.filter(ball => ball.pocketed && ball.color === color);
    }
    //true when player owns ball object passed as argument
    currentPlayerOwnsBall(ball) {
        const player = this.players[this.currentPlayerIndex];

        return !player.hasColor() || player.ownsThisBall(ball);
    }
    //for all collisions, filters to only collisions with the cue ball
    onCollision(ballA, ballB) {
        if (ballA === this.game.cueBall) {
            this.onCueBallCollision(ballB);
        } else if (ballB === this.game.cueBall) {
            this.onCueBallCollision(ballA);
        }
    }
    //on cue ball collisions, trigger foul event IFF first contact, and is an illegal contact.
    onCueBallCollision(ball) {
        if (!this.hasHitBall && !this.currentPlayerOwnsBall(ball) && (ball !== this.blackBall || !this.hasPottedAllOwnBalls())) {
            this.events.trigger('foul');
        }

        this.hasHitBall = true;
    }
    //controls game clock
    tick() {
        let isMoving = this.balls.some(ball => ball.speed);

        if (this.gameEnded) {
            return;
        }
        //when no object is moving...
        if (!isMoving) {
            //trigger either legal or foul shot events based on flags set during motion
            if (this.hasFouled || (this.shotStarted && !this.hasHitBall)) {
                this.hasFouled = false;
                this.events.trigger('shotFouled');
            } else if (this.shotStarted) {
                this.events.trigger('shotLegal');
            }
            this.shotStarted = false;
        } else if (!this.shotStarted) {
            //restart shot cycle once movement begins and shot has not yet been recorded as started
            this.shotStarted = true;
            this.events.trigger('shotStarted');
        }
    }
    //disable input in end state
    gameOver(winningPlayer)  {
        this.game.cue.setInactive();
        this.gameEnded = true;
        this.winningPlayer = winningPlayer;
        console.log('Game Over', winningPlayer);
    }

}