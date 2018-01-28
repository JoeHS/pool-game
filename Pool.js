class PoolPlayer {
    //Pool rules
    constructor(game, colour) {
        this.balls = [];
        for (let i = 0; i < 7; i++) {
            const ball = new Ball(colour, 0, 0, 14, 0, 0, 0);
            this.balls.push(ball);
            game.addChild(ball);
        }
    }
}

class Pool {
    constructor(game, events) {
        //players and coloured balls
        const player1 = new PoolPlayer(game, '#b30000'); //red
        const player2 = new PoolPlayer(game, '#ffcc00'); //yellow
        const blackBall = new Ball('#000000', 0, 0, 14, 0, 0, 0); //black
        game.addChild(blackBall);

        const balls = ([ ...player1.balls, ...player2.balls ]).sort(() => Math.random() - 0.5);

        //defines starting positions of balls
        const CentrePosition = { x: game.width*0.75, y: game.height*0.5 };
        const ballDiameter = 14*2;
        const buffer = ballDiameter + 1;

        balls[0].setLocation(CentrePosition.x - buffer*2, CentrePosition.y);

        balls[1].setLocation(CentrePosition.x - buffer, CentrePosition.y + buffer*0.5);
        balls[2].setLocation(CentrePosition.x - buffer, CentrePosition.y - buffer*0.5);

        balls[3].setLocation(CentrePosition.x, CentrePosition.y + buffer);
        blackBall.setLocation(CentrePosition.x, CentrePosition.y);
        balls[4].setLocation(CentrePosition.x, CentrePosition.y - buffer);

        balls[5].setLocation(CentrePosition.x + buffer, CentrePosition.y + buffer*1.5);
        balls[6].setLocation(CentrePosition.x + buffer, CentrePosition.y + buffer*0.5);
        balls[7].setLocation(CentrePosition.x + buffer, CentrePosition.y - buffer*0.5);
        balls[8].setLocation(CentrePosition.x + buffer, CentrePosition.y - buffer*1.5);

        balls[9].setLocation(CentrePosition.x + buffer*2, CentrePosition.y + buffer*2);
        balls[10].setLocation(CentrePosition.x + buffer*2, CentrePosition.y + buffer);
        balls[11].setLocation(CentrePosition.x + buffer*2, CentrePosition.y);
        balls[12].setLocation(CentrePosition.x + buffer*2, CentrePosition.y - buffer);
        balls[13].setLocation(CentrePosition.x + buffer*2, CentrePosition.y - buffer*2);

        //events
        events.subscribe('breakStart', () => { console.log('breakStart'); });
        events.subscribe('breakEnd', () => { console.log('breakEnd'); });
        events.subscribe('foul', () => { console.log('foul'); });
        events.subscribe('pocket', () => { console.log('pocket'); });
        events.subscribe('collide', () => { console.log('collide'); });
    }
}