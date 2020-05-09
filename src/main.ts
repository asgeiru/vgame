/**
 * This is the first try of making a simple game in Phaser.
 * I followed partially (mainly the game logic, how snake is stored and drawn) https://tutorialzine.com/2015/06/making-your-first-html5-game-with-phaser tutorial how to make snake in Phaser 2
 * but since I am using Phaser 3 and decided to also use TypeScript I had to modify it a bit.
 * I also added elements on top of the original tutorial such as making snake change color based on what food he ate,
 * added more food types, locally stored highscore list and feedback when player eats food.
 */
import 'phaser';

/** 
 * The first scene of the game, to show the title screen and wait for user to start.
 */
export class Main extends Phaser.Scene
{
    /** Since we wait for spacebar down to start the game */
    space: Phaser.Input.Keyboard.Key;
    constructor ()
    {
        super('Main');
    }

    preload ()
    {
        this.load.image('main', 'assets/images/main.png');
    }

    create ()
    {
        const main = this.add.sprite(400, 300, 'main');
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update ()
    {
        /** If user pressed space then take them over to the game. */
        if(Phaser.Input.Keyboard.JustDown(this.space))
        {
            this.scene.start('Game');
        }
    }
}

/** 
 * Main "game" scene, here all the game takes place.
 */
export class Game extends Phaser.Scene
{
    /** Main game data */
    snake: Phaser.GameObjects.Sprite[] = [];
    food: Phaser.GameObjects.Sprite[] = [];
    /** Score keeping and displaying information to player */
    score: number = 0;
    level: number = 0;
    scoreText: Phaser.GameObjects.Text;
    levelText: Phaser.GameObjects.Text;
    scoring: Phaser.GameObjects.Text;
    /** Variables that control how the game plays */
    gridSize: number = 20;
    scorePerLevel: number = 3;
    updateDelay: number = 0;
    originalSnakeLength: number = 5;
    /** Variables controlling how and what to draw */
    direction: string;
    newDirection: string = '';
    addNew: boolean = false;
    showEating: boolean = false;
    showEatingTimer: number = 0;
    newColor: number;
    /** Variables used for managing snake */
    oldSnakeTailX: number;
    oldSnakeTailY: number;
    snakeHead: Phaser.GameObjects.Sprite;
    snakeTail: Phaser.GameObjects.Sprite;
    /** Movement */
    controls: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.image('snake', './assets/images/snake.png');
        this.load.image('apple', './assets/images/apple.png');
        this.load.image('banana', './assets/images/banan.png');
    }

    create ()
    {
        this.cameras.main.backgroundColor = Phaser.Display.Color.HexStringToColor("#7394bc");;
        this.controls = this.input.keyboard.createCursorKeys();
        this.direction = 'right';

        /** Creating the starting snake of length this.originalSnakeLength */
        for(let i = 0; i < this.originalSnakeLength; i++){
            let nextBox = i * this.gridSize;
            this.snake[i] = this.add.sprite(310 + nextBox, 310, 'snake');
        }
        this.snakeHead = this.snake[this.snake.length-1];
        this.snakeTail = this.snake[0];
        this.oldSnakeTailX = this.snakeTail.x;
        this.oldSnakeTailY = this.snakeTail.y;

        this.add.text(30, 20, 'Score:');
        this.scoreText = this.add.text(95, 20, this.score.toString());

        this.add.text(690, 20, 'Level:');
        this.levelText = this.add.text(755, 20, this.level.toString());

        /** Generate first food on playing field. */
        this.createFood();
    }

    update ()
    {
        this.getMovingDirection();

        /** Can only get to level 10 */
        this.level = Math.min(Math.floor(this.score/this.scorePerLevel), 10);
        this.levelText.text = this.level.toString();
        /** Delay for the update */
        this.updateDelay++;
        
        /** Phaser runs around 60 FPS so need to scale back the updates, using the scale to control level speed */
        /** The higher level we get to the faster the snake moves */
        if(this.updateDelay % (11 - this.level) == 0)
        {
            this.redrawSnake();

            if(this.addNew)
            {
                this.snake.unshift(this.add.sprite(this.oldSnakeTailX, this.oldSnakeTailY, 'snake').setTint(this.newColor));
                this.addNew = false;
            }
            if(this.showEating)
            {
                this.scoring = this.add.text(350, 280, 'Good Job!');
                this.showEatingTimer = 5;
                this.showEating = false;
            }
            else
            {
                if(this.showEatingTimer === 0)
                {
                    if(this.scoring)
                    {
                        this.scoring.destroy();
                    }
                }
                else
                {
                    this.showEatingTimer--;
                }
            }

            this.checkCollision();
        }
    }

    /**
     * Function that creates new food item on the playing field at random.
     * @param bonus Not used right now, leaving this as a reminder what I want to update.
     */
    createFood (bonus?: boolean)
    {
        let foodTypeString: string,
            xColumnCount: number = 39,
            yColumnCount: number = 29,
            x: number = Math.floor(Math.random() * xColumnCount) * this.gridSize + this.gridSize/2,
            y: number = Math.floor(Math.random() * yColumnCount) * this.gridSize + this.gridSize/2,
            foodType: number = Math.floor(Math.random() * 2);

        switch(foodType)
        {
            case 0:
            {
                foodTypeString = 'apple';
                break;
            }
            case 1:
            {
                foodTypeString = 'banana';
                break;
            }
        }

        if(!this.checkFoodLocation(x,y))
        {
            this.food[0] = this.add.sprite(x, y, foodTypeString);
        }
        else
        {
            this.food[0].destroy();
            this.createFood();
        }
    }

    /**
     * Function that checks if food is created in same spot as any part of the snake is at
     * @param x 
     *          The x location of the food item
     * @param y 
     *          The y location of the food item
     * @return boolean
     *          Boolean telling wether food was created in same place as part of snake or not.
     */
    checkFoodLocation (x: number, y: number)
    {
        for(let i = 0; i < this.snake.length-1; i++)
        {
            if(x == this.snake[i].x && y == this.snake[i].y)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Function that checks what direction snake is moving to and what button is pressed.
     */
    getMovingDirection ()
    {
        /** Want to check what button is pressed and see if that gives allowed direction (can not turn 180° on the spot) */
        if(this.controls.down.isDown && this.direction != 'up')
        {
            this.newDirection = 'down';
        }
        else if(this.controls.up.isDown && this.direction != 'down')
        {
            this.newDirection = 'up';
        }
        else if(this.controls.left.isDown && this.direction != 'right')
        {
            this.newDirection = 'left';
        }
        else if(this.controls.right.isDown && this.direction != 'left')
        {
            this.newDirection = 'right';
        }
    }

    /** 
     * Function that moves the snake
     * Snake is moved by taking first item in snake array and move it to the last place and set the x,y location according to expected location and direction.
     */
    redrawSnake ()
    {
        this.snakeHead = this.snake[this.snake.length-1];
        this.snakeTail = this.snake.shift();

        this.oldSnakeTailX = this.snakeTail.x,
        this.oldSnakeTailY = this.snakeTail.y;
    
        if(this.newDirection.length > 0)
        {
            this.direction = this.newDirection;
            this.newDirection = '';
        }

        switch (this.direction)
        {
            case 'right':
            {
                this.snakeTail.x = this.snakeHead.x + this.gridSize;
                this.snakeTail.y = this.snakeHead.y;
                break;
            }
            case 'left':
            {
                this.snakeTail.x = this.snakeHead.x - this.gridSize;
                this.snakeTail.y = this.snakeHead.y;
                break;
            }
            case 'up':
            {
                this.snakeTail.x = this.snakeHead.x;
                this.snakeTail.y = this.snakeHead.y - this.gridSize;
                break;
            }
            case 'down':
            {
                this.snakeTail.x = this.snakeHead.x;
                this.snakeTail.y = this.snakeHead.y + this.gridSize;
                break;
            }
        }

        this.snake.push(this.snakeTail);
        this.snakeHead = this.snakeTail;
    }

    /**
     * Function that checks if snake has colided with food, self or walls.
     */
    checkCollision ()
    {
        this.checkFoodCollision();
        this.checkSnakeCollision();
        this.checkWallCollision();
    }

    /** 
     * Function that checks if snake head and food are in same cell.
     */
    checkFoodCollision ()
    {
        if(this.snakeHead.x == this.food[0].x && this.snakeHead.y == this.food[0].y)
        {
            if(this.food[0].texture.key === 'banana')
            {
                this.newColor = 0xffff00;
                
            }
            else if(this.food[0].texture.key === 'apple')
            {
                this.newColor = 0xff0000;
            }
            for(let i = 0; i < this.snake.length-1; i++)
            {
                this.snake[i].setTint(this.newColor);
                this.snakeHead.setTint(this.newColor);
                this.snakeTail.setTint(this.newColor);
            }
            this.showEating = true;
            this.addNew = true;
            this.food[0].destroy();
            this.createFood();
            this.score++;
            this.scoreText.text = this.score.toString();
        }
    }

    /**
     * Function that checks if snake head is crashing into self.
     */
    checkSnakeCollision ()
    {
        if(this.snakeHead !== null && this.snakeTail !== null)
        {
            for(let i = 0; i < this.snake.length-1; i++)
            {
                if(this.snakeHead.x == this.snake[i].x && this.snakeHead.y == this.snake[i].y)
                {
                    this.gameOver();
                }
            }
        }
    }

    /**
     * Function that checks if snake head is leaving the game board
     */
    checkWallCollision ()
    {
        if(this.snakeHead !== null && this.snakeTail !== null)
        {
            if(this.snakeHead.x >= 800 || this.snakeHead.x < 0 || this.snakeHead.y >= 600 || this.snakeHead.y < 0)
            {
                this.gameOver();
            }
        }
    }

    /**
     * Function that cleans up after player is game over.
     */
    gameOver ()
    {
        let s = this.score;
        this.score = 0;
        this.scoreText.text = this.score.toString();
        this.snake = [];
        this.snakeHead = null;
        this.snakeTail = null;
        this.oldSnakeTailY = 310;
        this.oldSnakeTailX = 310;
        this.direction = 'right';
        this.scene.stop('Game');
        this.scene.start('Gameover', {'score' : s});
    }
}

/**
 * When user is game over we move over to static page and wait for user to start a new game
 */
export class Gameover extends Phaser.Scene
{
    /** Since we wait for spacebar down to start the game */
    space: Phaser.Input.Keyboard.Key;
    constructor ()
    {
        super('Gameover');
    }

    preload ()
    {
        this.load.image('gameover', 'assets/images/gameover.png');
    }

    create (data: any)
    {
        const gameover = this.add.sprite(400, 300, 'gameover');
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.add.text(335, 100, 'LAST SCORE');
        this.add.text(450, 100, data.score.toString());

        this.highscoreListHandle(data.score);
    }

    update ()
    {
        /** If user pressed space then take them over to the game. */
        if(Phaser.Input.Keyboard.JustDown(this.space))
        {
            this.scene.start('Game');
        }
    }

    /**
     * Function that accepts current score, checks where it ranks on highscore list for current locastorage and inputs it on list if needed.
     * @param score
     *              Current score
     */
    highscoreListHandle (score: number)
    {
        let h: Highscore[] = this.getHighscore();
        if(this.checkHighscoreEntry(h, score))
        {
            /** Since method above creates dummy highscore if blank we need to fetch it again */
            if(h === null)
            {
                h = this.getHighscore();
            }
            let name = prompt('Name (only first 3 letters are used):','');
            if(name === null)
            {
                name = '   ';
            }
            for(let i = 0; i < h.length; i++)
            {
                if(h[i].score < score)
                {
                    /** Adding new score to the correct place on the list */
                    h.splice(i, 0, new Highscore(name.substring(0,3).toUpperCase(), score));
                    /** Removing last item since we added new one */
                    h.splice(10,1);
                    this.saveHighscore(h);
                    break;
                }
            }
        }

        this.writeHighscoreListToScreen(h);
    }

    /**
     * Function that writes highscore list to screen
     */
    writeHighscoreListToScreen (h: Highscore[])
    {
        let textX: number = 100,
            textY: number = 100,
            rank: string[] = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th'],
            firstPadding: string,
            scoreString: string;
        
        this.add.text(textX, textY, 'LOCAL HIGHSCORE');
        textX = textX+20;
        textY = textY+20;
        for(let i = 0; i < h.length; i++)
        {
            firstPadding = i<9 ? '\t\t\t' : '\t\t';
            scoreString = h[i].score.toString().padStart(2,'0');
            this.add.text(textX, textY, rank[i]+firstPadding+h[i].name+'\t\t'+scoreString);
            textY = textY+20;
        }
    }

    /**
     * Function that checks if current score is enough to get to the locally stored highscore list.
     * @param h
     *          Current highscore object
     * @param score
     *          Current score
     * @returns boolean
     *              Variable that tells if current score can make it to the highscore list.
     */
    checkHighscoreEntry (h: Highscore[], score: number)
    {
        /** If we have no highscore list stored then we create a dummy list */
        if(h === null)
        {
            h = new Array<Highscore>();
            for(let i = 0; i < 10; i++)
            {
                h[i] = new Highscore('   ', 0);
            }
            this.saveHighscore(h);
        }

        /** We check to see if last highscore entry is smaller than current and if we we want to register current to the list */
        if(h[h.length-1].score < score)
        {
            return true;
        }
        return false;
    }

    /**
     * Function that takes array of Highscore's and saves that to localstorage
     * @param h 
     *          Highscore object that we are saving
     */
    saveHighscore (h: Highscore[])
    {
        localStorage.setItem('highscore', JSON.stringify(h));
    }

    /**
     * Function that pulls highscore array from localstorage
     * @returns Highscore[]
     *              Array containing list of highscore items
     */
    getHighscore ()
    {
        return JSON.parse(localStorage.getItem('highscore'));
    }
}

class Highscore 
{
    name: string;
    score: number;

    constructor(n: string, s: number)
    {
        this.name = n;
        this.score = s;
    }
}

const config = {
    type: Phaser.AUTO,
    backgroundColor: '#000',
    width: 800,
    height: 600,
    scene: [Main, Game, Gameover]
};

const game = new Phaser.Game(config);
