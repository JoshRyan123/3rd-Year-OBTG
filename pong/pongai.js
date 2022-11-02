
// init function
async function init(){

    // try to load a model
    try{
        //model =  await tf.loadModel('https://hkinsley.com/static/tfjsmodel/model.json');
        try{
            model =  await tf.loadModel('pong-model/model.json');
            console.log('model loaded from storage');
            computer.ai_plays = true;
        }
        catch{
            console.log('model not loaded from storage');
        }

    // else create a new one
    }catch{
        model = tf.sequential();

        model.add(tf.layers.dense({units: 256, inputShape: [6]})); //input is a 1x8
        model.add(tf.layers.dense({units: 256, inputShape: [8]}));
        model.add(tf.layers.dense({units: 512, inputShape: [256]}));
        model.add(tf.layers.dense({units: 256, inputShape: [512]}));
        model.add(tf.layers.dense({units: 3, inputShape: [256]})); //returns a 1x3
        console.log('model created');
    }

    // set learning rate and compile model
    const learningRate = 0.001;
    const optimizer = tf.train.adam(learningRate);

    model.compile({loss: 'meanSquaredError', optimizer: optimizer, metrics: ['accuracy']});
    
    document.getElementById("playing");
    // start a game
    animate(step);
}

// set game animation speed (game clock) 16 frames per second
var animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 60)
};

// create canvas variables
var started = false;
var canvas = document.createElement("canvas");
var width = 700;
var height = 700;
var wallWidth= 8;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');

// game positioning
context.translate(700, 700/700);
context.rotate(90 * Math.PI / 180);

// variables for tracking and outputting participant data
var aiScore      = [0];
var playerScore  = [0];
var winnersTally = [0,0];
var runningPlayerScore = [0];
var runningAiScore = [0];

var ball_missed = 'none'
var players_move = 'none'

var recorded = false
var second_recorded = false
var frames = 0
var initial_reaction_time = 0
var secondary_reaction_time = 0

var player_paddle_x = 0
var losing_player_ball_x = 0

var probability_up = null
var probability_down = null
var probability_still = null

var models_loss = 0
var model_loss = 0
var models_accuracy = 0
var model_accuracy = 0

var game = 0

// image variables and formatting
var winner = document.createElement("img");
winner.src = "images/winner.png";
winner.setAttribute('height', '106px');
winner.setAttribute('width', '242px');
var loser = document.createElement("img");
loser.src = "images/loser.png";
loser.setAttribute('height', '106px');
loser.setAttribute('width', '194px');

// goal function for when ball goes out-of-bounds
var goal = function(playerNo) {
    if (menu.winner == 1 || menu.winner == 0) {
        return 
    } else if (menu.winner == null) {
        if(playerNo==0){
            playerScore++;
        }else if (playerNo==1){
            aiScore++;
        }
        // play round for best out of 10 before point is awarded
        if (aiScore==10 || playerScore==10) {
            runningAiScore =+ aiScore;
            aiScore = [0];
            runningPlayerScore =+ playerScore;
            playerScore = [0];

            winnersTally[playerNo] += 1;

            // ROUND END
            computer.ai_plays = false;
            ball.x_speed=0;
            ball.y_speed=0;
            ball.width=0;
            ball.height=0;
            ball.x = 350
            ball.y = 350
            
            this_score = Number(winnersTally[0])
            this_running_score = Number(runningPlayerScore-runningAiScore)
            game_increment_for_score = Number(game)

            $(document).ready(function(){
                $.ajax({
                    global: false,
                    type: 'POST',
                    url: "/submission",
                    dataType: 'html',
                    data: {
                        score: this_score,
                        runningscore: this_running_score,
                        gameincrement: game_increment_for_score,
                        game: "Pong",
                    },
                    success: function (result) {
                        console.log('Score Submitted');
                    },
                    error: function (request, status, error) {
                        serviceError();
                    }
                });
            });
        }

        //BEST TO 3
        if (winnersTally[0]==3 || winnersTally[1]==3){
            //display winner image on side of screen which won
            menu.declareWinner(playerNo);
            
            // GAME END
            computer.ai_plays = false;
            ball.x_speed=0;
            ball.y_speed=0;
            ball.x = 350
            ball.y = 350
            ball.width=0;
            ball.height=0;

            playerScore = null;
            aiScore = null;
            winnersTally[1]=null
            winnersTally[0]=null
        }
    }
};

// create game "objects"
var player = new Player();
var computer = new Computer();
var ball = new Ball(350, 350);
var ai = new AI();
var court = new Court();
var menu = new Menu();

// pressed keys
var keysDown = {};

// renders board
var render = function () {
    context.fillStyle = "#000000";
    context.fillRect(0, 0, width, height);
    player.render();
    computer.render();
    ball.render();
    court.render();
    menu.render();
};

var count = 0

// updates game state
var update = function () {
    // update player position
    player.update(ball);

    // 20 frames seems to work best for updateing players move
    if (count == 20) {
        player.players_move = 'none'
        count = 0
    }

    // update "computer" position
    // ai-based
    if(computer.ai_plays){
        move = ai.predict_move();
        computer.ai_update(move);
    }

    // update ball position
    ball.update(player.paddle, computer.paddle);

    // add training data from current frame to training set
    ai.save_data(player.paddle, computer.paddle, ball)

    // reset at round start
    if (ball.x == 350 && ball.y == 350) {
        recorded = false
        second_recorded = false

        player.reacted = false
        player.second_react = false
        left_second_react = false;
        right_second_react = false;

        frames = 0
        initial_reaction_time = 0
        secondary_reaction_time = 0
    }

    // on update check for initial reaction time (in frames) until found
    if(recorded == false){
        if(player.reacted == true){
            initial_reaction_time = frames
            if (initial_reaction_time != [0]){
                recorded = true
                console.log("initial reaction(frame): "+initial_reaction_time);

                player.left_second_react = false
                player.right_second_react = false 
            }

        }
    }
    // on update check for second reaction (in frames) until found
    if(recorded == true){
        if(second_recorded == false){
            if (player.second_react == true){
                secondary_reaction_time = frames
                if (secondary_reaction_time != [0]  &&  secondary_reaction_time != initial_reaction_time){

                    if (player.right_second_react != player.left_second_react){
                        second_recorded = true
                        console.log("secondary reaction(frame): "+secondary_reaction_time);
                    }
                    
                }
            }
        } 
    }

    frames++
    count++
    // Only activated for purpose of diagnosing fps
    // if (frames_recorded < 20) {
    //     output frames to find fps as is not hard coded into the game - about (10fps)
    //     $(document).ready(function(){
    //         $.ajax({
    //             global: false,
    //             type: 'POST',
    //             url: "/timestamp",
    //             dataType: 'html',
    //             data: {
    //                 frame: Number(frames),
    //             },
    //             success: function (result) {
    //                 //   console.log('timestamp submitted');
    //             },
    //             error: function (request, status, error) {
    //                 //   serviceError();
    //             }
    //         });
    //     });
    //     frames_recorded++
    // }
};

// main game loop
var step = function () {
    update();
    render();
    animate(step); // runs that loop again after a "tick"
};

// paddle object
function Paddle(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.x_speed = 0;
    this.y_speed = 0;
}

// renders paddle on a board
Paddle.prototype.render = function () {
    context.fillStyle = "#59a6ff";
    context.fillRect(this.x, this.y, this.width, this.height);
};

// moves paddle by x and y pixels (y is always 0 now)
Paddle.prototype.move = function (x, y) {

    // update position and speed
    this.x += x;
    this.y += y;
    this.x_speed = x;
    this.y_speed = y;

    // check if not out of the board
    if (this.x < 0) {
        this.x = 0;
        this.x_speed = 0;
    } else if (this.x + this.width > 690) {
        this.x = 690 - this.width;
        this.x_speed = 0;
    }
};

// computer player object
function Computer() {
    this.paddle = new Paddle(310, 10, 90, 12);
    this.ai_plays = false; 
}

// renders computer paddle on a board
Computer.prototype.render = function () {
    this.paddle.render();
};

// updates computer paddle position - rule-based (simply follows a ball)
Computer.prototype.update = function (ball) {
    // calculate difference in pixels between paddle and ball (cap to 5 pixels - max speed of paddle)
    var x_pos = ball.x;
    var diff = -((this.paddle.x + (this.paddle.width / 2)) - x_pos);
    if (diff < 0 && diff < -4) {
        diff = -5;
    } else if (diff > 0 && diff > 4) {
        diff = 5;
    }

    // move paddle
    this.paddle.move(diff, 0);

    // check if paddle is not outside of the board
    if (this.paddle.x < 0) {
        this.paddle.x = 0;
    } else if (this.paddle.x + this.paddle.width > 700) {
        this.paddle.x = 700 - this.paddle.width;
    }
};

// updates computer paddle position - ai-based (ai calls it later in a code)
Computer.prototype.ai_update = function (move = 0) {
    this.paddle.move(4 * move, 0);
};

// player object
function Player() {
    this.reacted = false;
    this.left_second_react = false;
    this.second_react = false;
    this.right_second_react = false;
    this.players_move = players_move;
    
    this.paddle = new Paddle(310, 680, 90, 12);
}

// renders player paddle
Player.prototype.render = function () {
    this.paddle.render();
};

Player.prototype.update = function () {
    for (var key in keysDown) {
        var value = Number(key);

        //perform move (if approprate key is pressed) and update reaction if necessary, else dont move
        if (value == 81) {//up
            this.players_move = 'up'
            this.paddle.move(-5, 0);

            // weird bug seems to stop outputting second reaction frame if the participant tabs out in the middle of a game
            if (this.reacted == true){
                if(this.right_second_react==false){
                    this.left_second_react = true
                } else {
                    this.left_second_react = false
                }
            }
            if (this.right_second_react == true && this.left_second_react == false){
                this.second_react = true;
            } else {
                this.second_react = false;
            }
            this.reacted = true
        } else if (value == 65) {//down
            this.players_move = 'down'

            this.paddle.move(5, 0);
            // weird bug seems to stop outputting second reaction frame if the participant tabs out in the middle of a game
            if (this.reacted == true){
                if (this.left_second_react==false){
                    this.right_second_react = true
                } else {
                    this.right_second_react = false
                }
            }
            if (this.left_second_react == true && this.right_second_react == false){
                this.second_react = true;
            } else {
                this.second_react = false;
            }
            this.reacted = true
        } else {//none
            this.paddle.move(0, 0);
            this.reacted = false
            this.second_react = false
            this.left_second_react = false
            this.right_second_react = false
        }
    }
};

// ball object
function Ball(x, y) {
    this.x = x;
    this.y = y;
    this.width = 12;
    this.height = 12;
    this.x_speed = 0;
    this.y_speed = 2;
    this.player_strikes = false;
    this.ai_strikes = false;
    this.models_loss = models_loss;
    this.models_accuracy = models_accuracy;
    this.ball_missed = ball_missed;
    this.players_move = players_move;
}

// renders ball on a table
Ball.prototype.render = function () {
    context.beginPath();

    context.fillStyle = "#ddff59";
    context.fillRect(this.x, this.y, this.width, this.height);
    
    context.fill();
};


// updates ball position
Ball.prototype.update = function (paddle1, paddle2, new_turn) {

    // update speed and left/right point of a ball on a table
    this.x += this.x_speed;
    this.y += this.y_speed;
    var right_x = this.x - 5;
    var right_y = this.y - 5;
    var left_x = this.x + 5;
    var left_y = this.y + 5;

    // bounce off the top/bottom walls
    if (this.x - 5 < 0) {
        this.x = 5;
        this.x_speed = -this.x_speed;
    } else if (this.x + 5 > 690) {
        this.x = 685;
        this.x_speed = -this.x_speed;
    }


    // if ball hits left and right walls - reset ball (score)
    if (this.y < 0) {
        //  if player wins player serves
        this.x_speed = Math.random()*2+1;
        this.y_speed = Math.random()*1+4;
        ai.new_turn();   

        reaction_time_one = initial_reaction_time
        reaction_time_two = secondary_reaction_time
        game_increment = game
        ball_missed = 'yes'

        this_model_loss = Math.round(Number(ball.models_loss))
        this_model_accuracy = Math.round(Number(ball.models_accuracy))
        ball_position = Math.round(Number(ball.x))
        computer_paddle_position = Math.round(Number(computer.paddle.x))

        goal(0);
        console.log('player got the ball out! total score: '+playerScore);

        //console.log("BAllMissted:"+ball_missed+"probabilityDOWN:"+probability_down+"probabilityUP:"+probability_up+"probabilityMIDDLE:"+probability_still+"playersmove:"+player.players_move+"reactiontime:"+reaction_time_one, "reactiontime2:"+reaction_time_two+"Gameincrement:"+game_increment+"ballmissed:"+ball_missed+"model loss:"+this_model_loss+"modelsaccuracy:"+this_model_accuracy+"ballposition:"+ball_position+"computerpaddleposition:"+computer_paddle_position);

        // when the ai misses the ball we want to know how far away (pixels) its paddle was from hitting it
        $(document).ready(function(){
            $.ajax({
              global: false,
              type: 'POST',
              url: "/pongmachinelearning",
              dataType: 'html',
              data: {
                    ModelLoss: this_model_loss,
                    ModelAcc: this_model_accuracy,
                    Ball: ball_position,
                    PlayerPaddle: 0,
                    ComputerPaddle: computer_paddle_position,
                    InitialReaction: reaction_time_one,
                    SecondaryReaction: reaction_time_two,
                    GameIncrement: game_increment,
                    Game: 'Pong',
                    Move: player.players_move,
                    ProbStill: probability_still,
                    ProbUp: probability_up,
                    ProbDown: probability_down,
                    BallMissed: ball_missed,
                    
              },
              success: function (result) {
                  console.log('MachineLearning Info Submitted');
              },
              error: function (request, status, error) {
                //   alert(request + status + error);
              }
              
          });
        });
        this.x = 350;
        this.y = 350;
    }else{
        if(this.y > 700){
            // if ai wins ai serves
            this.x_speed = Math.random()*2-1;
            this.y_speed = Math.random()*1-4;
            ai.new_turn();

            reaction_time_one = initial_reaction_time
            reaction_time_two = secondary_reaction_time
            game_increment = game
            ball_missed = 'yes'

            this_model_loss = Math.round(Number(ball.models_loss))
            this_model_accuracy = Math.round(Number(ball.models_accuracy))
            ball_position = Math.round(Number(ball.x))
            player_paddle_position = Math.round(Number(player.paddle.x))

            goal(1);
            console.log('ai got the ball out! total score: '+aiScore);

            //console.log("BAllMissted:"+ball_missed+"probabilityDOWN:"+probability_down+"probabilityUP:"+probability_up+"probabilityMIDDLE:"+probability_still+"playersmove:"+player.players_move+"reactiontime:"+reaction_time_one, "reactiontime2:"+reaction_time_two+"Gameincrement:"+game_increment+"ballmissed:"+ball_missed+"model loss:"+this_model_loss+"modelsaccuracy:"+this_model_accuracy+"ballposition:"+ball_position+"playerpaddleposition:"+player_paddle_position);
            
    
            // when the player misses the ball we want to know how far away (pixels) they're paddle was from hitting it
            $(document).ready(function(){
                $.ajax({
                  global: false,
                  type: 'POST',
                  url: "/pongmachinelearning",
                  dataType: 'html',
                  data: {
                        ModelLoss: this_model_loss,
                        ModelAcc: this_model_accuracy,
                        Ball: ball_position,
                        PlayerPaddle: player_paddle_position,
                        ComputerPaddle: 0,
                        InitialReaction: reaction_time_one,
                        SecondaryReaction: reaction_time_two,
                        GameIncrement: game_increment,
                        Game: 'Pong',
                        Move: player.players_move,
                        ProbStill: probability_still,
                        ProbUp: probability_up,
                        ProbDown: probability_down,
                        BallMissed: ball_missed,
                  },
                  success: function (result) {
                      console.log('MachineLearning Info Submitted');
                  },
                  error: function (request, status, error) {
                      serviceError();
                  }
              });
            });
            this.x = 350;
            this.y = 350;
        }
    }

    // move ball on a table, update angle and speed, calculate new position
    // update striking player for appropriate data collection
    this.player_strikes = false;
    this.ai_strikes = false;

    if (right_y > 350) {
        if (right_y < (paddle1.y + paddle1.height) && left_y > paddle1.y && right_x < (paddle1.x + paddle1.width) && left_x > paddle1.x) {
            this.y_speed = -3;
            this.x_speed += (paddle1.x_speed / 2);
            this.y += this.y_speed;
            this.player_strikes = true;
        }
    } else {
        if (right_y+8 < (paddle2.y + paddle2.height) && left_y > paddle2.y && right_x < (paddle2.x + paddle2.width) && left_x > paddle2.x) {
            this.y_speed = 3;
            this.x_speed += (paddle2.x_speed / 2);
            this.y += this.y_speed;
            this.ai_strikes = true;
        }
    }
};

function Court() {
    var w  = width;
    var h  = height;
    var ww = wallWidth*2;
    var sw = 3*ww;
    var sh = 4*ww;

    this.score2 = {x: 0.5 + (w/2) - 1.5*ww - sw, y: 2*ww, w: sw, h: sh};
    this.score1 = {x: 0.5 + (w/2) + 1.5*ww,      y: 2*ww, w: sw, h: sh};
    this.ww    = ww;
    this.walls = [];

    // top wall
    this.walls.push({x: -5, y: 0, width: ww, height: w});
    // bottom wall
    this.walls.push({x: 690, y: 0,      width: ww, height: w});
    
    // dashed line
    var nMax = (h/2 / (ww));
    for(var n = 0 ; n < nMax ; n++) { 
      this.walls.push({
          x: (ww / 2 - 10) + (ww * 2 * n), 
          y: (w / 2 + 4) - (ww / 2), 
          width: ww, height: ww/10});
    }
}

Court.prototype.render = function () {
    context.fillStyle = "White";

    for(var n = 0 ; n < this.walls.length ; n++)
        context.fillRect(this.walls[n].x, this.walls[n].y, this.walls[n].width, this.walls[n].height);

    this.renderDigit(context, winnersTally[0], this.score1.x-10, this.score1.y, this.score1.w*3/4, this.score1.h*3/4, this.ww*2/5);
    this.renderDigit(context, winnersTally[1], this.score2.x+15, this.score2.y, this.score2.w*3/4, this.score2.h*3/4, this.ww*2/5);
    this.renderDigit(context, playerScore, this.score1.x+255, this.score1.y, this.score1.w/3, this.score1.h/3, this.ww*1/5);
    this.renderDigit(context, aiScore, this.score2.x-220, this.score2.y, this.score2.w/3, this.score2.h/3, this.ww*1/5);
};

Court.prototype.renderDigit = function (context, n, x, y, w, h, dh) {
        context.fillStyle = "White";
        var dw = dh;
        var blocks = this.getDigits(n);

        // Each statement corresponds to a segemnt in the 'Seven-segment display': https://en.wikipedia.org/wiki/Seven-segment_display
        //1.               __     
        //2.              |__|
        //3.              |__|    
        //middle (top)                                                                     
        if (blocks[0]) context.fillRect(y, x, dh, w);
        //left (top)                                                                                
        if (blocks[2]) context.fillRect(y, x, h/2, dw);
        //right (top)                                                                                
        if (blocks[1]) context.fillRect(y, x+w-dw, h/2, dw);
        //middle (middle)  
        if (blocks[3]) context.fillRect(y + h/2 - dh/2, x, dh, w);
        //left (bottom)        
        if (blocks[5]) context.fillRect(y + h/2, x, h/2, dw);
        //right (bottom)      
        if (blocks[4]) context.fillRect(y+h/2, x+w-dw, h/2, dw);
        //middle (bottom)       
        if (blocks[6]) context.fillRect(y+h-dh, x, dh, w);
};

Court.prototype.getDigits = function(n) {
    if(n==0){
        return [1, 1, 1, 0, 1, 1, 1]
    }
    if(n==1){
        return [0, 0, 1, 0, 0, 1, 0]
    }
    if(n==2){
        return [1, 0, 1, 1, 1, 0, 1]
    }
    if(n==3){
        return [1, 0, 1, 1, 0, 1, 1]
    }
    if(n==4){
        return [0, 1, 1, 1, 0, 1, 0]
    }
    if(n==5){
        return [1, 1, 0, 1, 0, 1, 1]
    }
    if(n==6){
        return [1, 1, 0, 1, 1, 1, 1]
    }
    if(n==7){
        return [1, 0, 1, 0, 0, 1, 0]
    }
    if(n==8){
        return [1, 1, 1, 1, 1, 1, 1]
    }
    if(n==9){
        return [1, 1, 1, 1, 0, 1, 0]
    }
    if(n==null){
        return [0, 0, 0, 0, 0, 0, 0]
    }
};

// computer player object
function Menu() {
    this.winner = null
    // left winner
    this.winner1 = { 
        image: winner, 
        // x: (width/2) - wallWidth, 
        // y: 6 * wallWidth 
      };
      // right winner
    this.winner2 = { 
        image: loser, 
        // x: (width/2)+ wallWidth, 
        // y: 6 * wallWidth 
      };
}

Menu.prototype.declareWinner = function(playerNo) {
    this.winner = playerNo;
},


Menu.prototype.render = function () {
    // image.onload = function(){
        if (this.winner == 0) {
            context.drawImage(this.winner1.image, 280, 350)
        }
        else if (this.winner == 1){
            context.drawImage(this.winner2.image, 280, 350)
        }
    // }
};

// add canvas
document.body.appendChild(canvas);

function startGame(){
    if (menu.winner == 1 || menu.winner == 0) {
        playerScore = null;
        aiScore = null;
        winnersTally[0]=null;
        winnersTally[1]=null;
    } 

    if (started==false){
        init();
        started = true;
    }

    // increment game if is actually a new game
    game++
    ai.turn = 0

    //need to include game iteration in all table outputs
    console.log("Game: " + game)

    if(ball) {
        ball.x_speed=0;
        ball.y_speed=2;
        ball.x = 350
        ball.y = 350
        ball.width=12;
        ball.height=12;
    }
    if (computer) {
        computer.ai_plays = true;
        playerScore = 0;
        aiScore = 0;
    }

    ball.x = 350;
    ball.y = 350;

    if (ai) {
        ai.model_loss = 0
        ai.model_acc = 0
        ai.turn = 0
        computer.ai_plays = true;
    }
    
}

function speedUp(){
    if (started==true){
        animate(step); 
    }
}

// arrow keypress events
window.addEventListener("keydown", function (event) {
    keysDown[event.keyCode] = true;
});
window.addEventListener("keyup", function (event) {
    delete keysDown[event.keyCode];
});

// AI object
function AI(){
    this.model_loss = 0;                        // produced by model and output to database
    this.model_acc =  0;                        // produced by model and output to database
    this.previous_data = null;                  // data from previous frame
    this.training_data = [[], [], []];          // empty training dataset
    this.training_batch_data = [[], [], []];    // empty batch (dataset to be added to training data)
    this.previous_ys = null;                    // input data from previus frame
    this.turn = 0;                              // number of turn
    this.grab_data = true;                      // enables/disables data grabbing
    this.flip_table = true;                     // flips table
    this.keep_trainig_records = true;           // keep some number of training records instead of discardin them each session
    this.training_records_to_keep = 100000;     // number of training records to keep
    this.first_strike = true;                   // first strike flag (to ommit data)
}

// infers a move
AI.prototype.predict_move = function(){
    // [old_player_y, old_computer_y, old_ball_y, old_ball_x, player_y, computer_y, ball_y, ball_x]
    if(this.previous_ys != null){
        data_xs = [
            width - this.previous_ys[1], width - this.previous_ys[2], height - this.previous_ys[3],
            width - this.previous_ys[5], width - this.previous_ys[6], height - this.previous_ys[7]
        ];
        prediction = model.predict(tf.tensor([data_xs]));

        // argmax will return embedding 0, 1 or 2, need -1, 0 or 1 (left, no move, right) - decrement it
        // flipped as ai plays on the right
        return -(tf.argMax(prediction, 1).dataSync()-1);
    }
}

// saves data from current frame of a game
AI.prototype.save_data = function(player, computer, ball){
    // return if grabbing is disabled
    if(!this.grab_data)
        return;

    // fresh turn, just fill initial data in
    if(this.previous_data == null){
        this.previous_data = [player.x, computer.x, ball.x, ball.y];
        return;
    }

    // if ai strikes, start recording data - empty batch
    if(ball.ai_strikes){
        this.training_batch_data = [[], [], []];
        // console.log('emtying batch')
    }

    // create current data object [player_x, computer_x, ball_x, ball_y]
    // and embedding index (0 - left, 1 - no move, 2 - right)
    data_xs = [player.x, computer.x, ball.x-60, ball.y];
    index = (player.x < this.previous_data[0])?0:((player.x == this.previous_data[0])?1:2);

    // save data as [...previous data, ...current data]
    // result - [old_player_x, old_computer_x, old_ball_x, old_ball_y, player_x, computer_x, ball_x, ball_y]
    this.previous_ys = [...this.previous_data, ...data_xs];
    // add data to training set depending on index value (depending if that data relates to the move to the left, no move or move to the right)
    // only player and ball position
    this.training_batch_data[index].push([this.previous_ys[0], this.previous_ys[2], this.previous_ys[3], this.previous_ys[4], this.previous_ys[6], this.previous_ys[7]]);
    // set current data as previous data for next frame
    this.previous_data = data_xs;

    // if player strikes, add batch to training data
    if(ball.player_strikes){
        if(this.first_strike){
            this.first_strike = false;
            this.training_batch_data = [[], [], []];
            // console.log('emtying batch');
        }else{
            for(i = 0; i < 3; i++)
                this.training_data[i].push(...this.training_batch_data[i]);
            this.training_batch_data = [[], [], []];
            // console.log('adding batch');
        }
    }
}

// runs every turn
AI.prototype.new_turn = function(){

    // clean previus data, we are starting fresh
    this.first_strike = true;
    this.training_batch_data = [[], [], []];
    this.previous_data = null;
    this.turn++;
    // console.log('new turn: ' + this.turn);

    document.getElementById("playing");

    // TRAINING PART
    // needs to be high other wise the resultant ai will be inferior 
    // if(this.turn == 5){
    //     this.reset();
    // }
    // if player chooses to play against the bot for longer than their 3 games then they can experience play against a ai trained on the data given from the matches they played
    // this functionality is an abtraction from the main purposes of the game and if left as an optional extra for perticipants to play
    if(this.turn == 8 && game > 3){

        // train a model
        //this.train();

        // allow ai to play
        computer.ai_plays = true;

        // empty training dataset
        //this.reset();
    }
}

// empties training data
// AI.prototype.reset = function(){
//     this.previous_data = null;

//     if(!this.keep_trainig_records)
//         this.training_data = [[], [], []];

//     document.getElementById("playing");

//     console.log('reset')
//     console.log('emtying batch')
// }

// trains a model
// AI.prototype.train = function(){

//     // first we have to balance a data
//     // console.log('balancing');

//     document.getElementById("playing");

//     // trim data and find minimum number of training records in data for all 3 embeddings
//     if(this.keep_trainig_records){
//         for(i = 0; i < 3; i++){
//             if(this.training_data[i].length > this.training_records_to_keep)
//                 this.training_data[i] = this.training_data[i].slice(
//                     Math.max(0, this.training_data[i].length - this.training_records_to_keep),
//                     this.training_data[i].length
//                 );
//         }
//     }
//     len = Math.min(this.training_data[0].length, this.training_data[1].length, this.training_data[2].length);
//     // console.log(this.training_data);
//     if(!len){
//         console.log('no data to train on');
//         return;
//     }

//     data_xs = [];
//     data_ys = [];

//     // now we need to trim data so every embedding will contain exactly the same amount of training records
//     // than randomize that data
//     // and create embedding records one embedding record for every input data record
//     // finally add training data records and embedding records to common tables (for training)
//     // tf.fit() will do final data shuffle
//     for(i = 0; i < 3; i++){
//         data_xs.push(...this.training_data[i].slice(0, len)
//             .sort(()=>Math.random()-0.5).sort(()=>Math.random()-0.5));      // trims training data to 'len' length and shuffle it
//         data_ys.push(...Array(len).fill([i==0?1:0, i==1?1:0, i==2?1:0]));   // creates 'len' number records of embedding data
//                                                                             // either [1, 0 0] for left, [0, 1, 0] - for no move
//                                                                             // and [0, 0, 1] for right (depending in index if training data)
//     }
//     // console.log(data_xs);
//     // console.log(data_ys);
    
//     document.createElement("playing").innerHTML = "Training: "+data_xs.length+" records";

//     // console.log('training');

//     // create tensor from
//     const xs = tf.tensor(data_xs);
//     const ys = tf.tensor(data_ys);

//     // "crative" way of running asynchronous code in a synchronous-like manner
//     (async function() {
//         // train a model
//         let result = await model.fit(xs, ys, {
//             batchSize: 32,
//             epochs: 1,
//             shuffle: true,
//             validationSplit: 0.1,
//             callbacks: {
//                 // print batch stats
//                 onBatchEnd: async (batch, logs) => {
//                     // console.log("Step: "+batch+", Loss: "+logs.loss.toFixed(5)+", Acc: "+logs.acc.toFixed(5));
//                 },
//             },
//         });

//         // and save it in website local storage to play against for the next game (ai based of playing the player seems to be inferior)
//         await model.save('indexeddb://my-model');

//         // print model and validation stats
//         console.log("Model: loss: "+result.history.loss[0]+", acc: "+result.history.acc[0]);

//         this.model_loss = Math.round((result.history.loss[0]*100));
//         this.model_acc =  Math.round((result.history.acc[0]*100));

//         console.log("metrics:"+this.model_loss)
//         console.log(this.model_acc)

//         ball.models_loss = this.model_loss;
//         ball.models_accuracy = this.model_acc;
//         models_loss = this.model_loss;
//         models_accuracy = this.models_accuracy;

//         ///////////////////////////////////////////////////////////

//         this.turn = 0;

//         ///////////////////////////////////////////////////////////
//     }());

//     // console.log('trained');
// }