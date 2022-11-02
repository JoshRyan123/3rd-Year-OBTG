const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");
const {google} = require("googleapis");

const urlencodedParser = bodyParser.urlencoded({
    extended: false 
})

// used in determining whether to display 'login' page, 'login - nosesh' page or 'login - signup' page after unsuccessful login attempt/
var logpage = 0;

// setup session
const app = express();
const session = require('express-session');

const store = new session.MemoryStore();

app.use(express.static(__dirname));
app.use(session({
    secret: 'keyboard cat',
    saveUninitialized: false,
    cookie: {maxAge: null},
    store
}))

// include in your app.js file to use this client to connect to the database specified in your DATABASE_URL environment variable:
// setup client and connect to database
const {Client} = require('pg');

// connect to the specified database url
const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
client.connect();

// used in creating a new user on the system through successful signup POST request, just generates a string of specified length
function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Establishing the port 
const PORT = process.env.PORT ||5000;
    
// Executing the sever on given port number
app.listen(PORT, console.log(`Server started on http://localhost:${PORT}`));

// if session is sucessfully logged in then redirect to /gamehub page else take the user to signup page
app.get('/signup', (req, res) => {
    store.get(req.sessionID, (err, session) =>{
        if (err) {
            throw err;
        }
        else if (session != undefined && session != null) {
            res.redirect('/gamehub')
        }
        else{
            res.sendFile('signup.html', {root: __dirname })
        }
    })
});

// if session login is provided it will redirect the user to the games page, else if the session is not currently logged in (by default)  
// redirects user to login page where they can access a /login post request to try again to gain access to the games page, else if a
// successful post request is made to the /signup page redirects the user to the 'login - signup' page requesting them to input
// the details sent to their specified email to which they can then use to contiue the login process and access the games page, else if
// a get request to any of the games accessables on the games page or the /gamehub page itself are provided with a falsely logged 
// in session redirects the user to 'login - nosesh' page where they can attempt to re-login.

// these are all the methods of accessing the website until a successfully login in session is provided and subsequent access to the 
// /gamehub page is given (/gamehub puts the user on the games.html page upon successfully providing logged in session)
app.get('/login', (req, res) => {
    store.get(req.sessionID, (err, session) => {
        if (err) {
            throw err;
        }
        else if (session != undefined && session != null) {
            res.redirect('/gamehub')
        }                 
        else {
            if (logpage == 0){
                res.sendFile('login.html', {root: __dirname })
            } else if (logpage == 1){
                res.sendFile('login-post signup.html', {root: __dirname })
            } else if (logpage == 2){
                res.sendFile('login-no session.html', {root: __dirname })
            }
        }
    })
});

app.get('/', (req, res) => {
  logpage = 0

  store.get(req.sessionID, (err, session) =>{
    if (err) throw err;
    else if (session != undefined && session != null) {
      res.redirect('/gamehub')
    }
    else { 
      res.sendFile('main.html', {root: __dirname })} //requires main
    })
});

app.post('/login', urlencodedParser, async (req,res) => {
    u_name = req.body.username
    p_word = req.body.password

    var sql = {
        text: 'SELECT * FROM u_info where u_name = $1 and p_word = $2;', values: [u_name, p_word]
    }

    var logger = await client.query(sql)

    //check query exists
    if (logger == undefined) {
        res.sendFile('login.html', {root: __dirname })
    }
    else if (logger != undefined) {
        if (logger.rows.length != 0) {
            //get uname and pword
            login = logger.rows[0]
            //check uname and pword match
            if (login.u_name == u_name && login.p_word == p_word) {
                //get all sessions
                store.all((err, sessions) => {
                    if (err) {
                        console.log(err)
                    }
                    else if (sessions) {
                        //if sessions already exist
                        if (sessions.length !=0) {
                            //for all sessions
                            for(let sesh in sessions) {
                                store.get(sesh, (err, s) => {
                                    if (err) {
                                        throw err;
                                    }
                                    else if (s != undefined && s != null) {
                                        //check is session uname already exists
                                        if(s.user.u_name == u_name) {
                                            store.destroy(sesh, (err) => { 
                                                if (err) {
                                                    throw err;
                                                }
                                            })
                                            console.log('Account'+sesh+'already in use!')
                                        }                          
                                    }
                                })
                            }
                            req.session.authenticated = true;
                            req.session.user = {u_name};
                            store.set(req.sessionID, session, (err) => {
                                if (err) {
                                    console.log(err)
                                }
                            })
                            res.redirect('/gamehub')
                        }
                        else if (sessions.length == 0) {
                            req.session.authenticated = true;
                            req.session.user = {u_name};
                            store.set(req.sessionID, session, (err) => {
                                if (err) {
                                    console.log(err)
                                }
                            })
                            res.redirect('/gamehub')
                        }
                    }
                })
            }
            else {
                res.redirect('/signup')
            }
        }
        else {
            res.sendFile('login.html', {root: __dirname })
        }
    }
})

//Requires urlencodedParser.
//takes the user to 'login-post signup' page by specifying logpage
app.post('/signup', urlencodedParser, (req,res) => {
    email = req.body.email
    u_name = makeid(5)
    p_word = makeid(5)

    var sql = {
        text: 'INSERT INTO u_info(u_name, p_word, email) VALUES($1,$2,$3);', values: [u_name, p_word, email]
    }

    client.query(sql, (err, res) => {
        if (err){
            console.log(err)
        };
    });

    // used to send the user an email detailing their new login
    // Basically logges into the email so make sure you use your own account
    const smtpTransport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'thirdyearproject1234@gmail.com',
            pass: 'bmtyzhwwqcdklnpj'
        }
    });

    var mailOptions = {
        from: 'thirdyearproject1234@gmail.com',
        to: req.body.email,
        subject: '3rd Year Project Study Details',
        text: 'Dear Participant, in order to maintain your anonymity, and to limit the opportunity for bias towards results, you have been assigned a random username and password. Please also find attached further participant information.\n\n Please ensure that eyetracking is done for each game by pressing the start button and completing calibration, and that when changing games, you stop the eyetracking using the stop button. This will ensure that the website is not collecting information outside of your play of the game suit. If you are playing the game again on the same page, continue eyetracking.\n\n Every game on the platform should be played through at least three times, post eyetracking calibration, however please feel no pressure to do so. Any results are greatly appreciated and valued. \n\n Your login details are as follows: \n\n Your username is ' + u_name + '.\n Your password is ' + p_word  + '.\n\n Thank you for taking the time and being a part of this study!\n\n Josh Ryan',
        attachments: [{path: 'Participant_Information.docx'},] 
    };

    smtpTransport.sendMail(mailOptions);
    
    logpage = 1
    res.redirect('/login')
})

// takes the user to the games page if login in session is successful and redirects user to /login page on upon request on unsecessfully logged in session
app.get('/gamehub', (req, res) => {
    console.log(store)
    store.get(req.sessionID, (err, session) => {
        if (err) {
            throw err;
        }
        else if (session != undefined && session != null) {
            res.sendFile('games.html', {root: __dirname })//change this to the html of the game selection screen (containing logout button).
        }
        else {
            logpage = 2
            res.redirect('/login')
        }
    })
});
  
// kills the session login and then redirect the user to main.html through '/' redirect which put the user back onto the main page,
// provided they have no login session (which is what is killed in this get request) 
app.get('/logout', (req, res) => {
    store.destroy(req.sessionID, (err) => { 
        if (err) {
            throw err;
        }
    })
    req.session.destroy( (err) => {
        if (err) {
            throw err
        }
    });
    res.redirect('/')
});
  
// takes the user to tictactoe.html on successfully logged in session, or redirects to 'login - nosesh' page provided unsuccessfully
// logged in session is provided as changes the logpage variable for subsequent /login get request equal to '2' 
app.get('/tictactoe', (req, res) => {
    store.get(req.sessionID, (err, session) => {
        if (err) {
            throw err;
        }
        else if (session != undefined && session != null) {
            res.sendFile('tictactoe.html', {root: __dirname })
        }
        else {
            logpage = 2
            res.redirect('/login')
        }; 
    })
});
  
app.get('/connect4', (req, res) => {
    store.get(req.sessionID, (err, session) => {
        if (err) {
            throw err;
        }
        else if (session != undefined && session != null) {
            res.sendFile('connect4.html', {root: __dirname })
        }
        else {
            logpage = 2
            res.redirect('/login')
        }; 
    })
});
  
app.get('/pong', (req, res) => {
    store.get(req.sessionID, (err, session) => {
        if (err) {
            throw err;
        }
        else if (session != undefined && session != null) {
            res.sendFile('pong.html', {root: __dirname })
        }
        else {
            logpage = 2;
            res.redirect('/login')
        }; 
    })
});

// used once for finding how many frames recorded every second
app.post('/timestamp', urlencodedParser, async (req, res) => {
    var frames = req.body.frame
  
    console.log(frames)
  
    let date_ob = new Date();
  
    // current date
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);
  
    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  
    // current year
    let year = date_ob.getFullYear();
  
    // current hours
    let hours = date_ob.getHours();
  
    // current minutes
    let minutes = date_ob.getMinutes();
  
    // current seconds
    let seconds = date_ob.getSeconds();
  
    var DateTime = (date + "/" + month + "/" + year + "  " + hours + ":" + minutes + ":" + seconds);
  
    var sql = {
        text: 'INSERT INTO timestamp_info(timestamp_datetime, frame) VALUES($1, $2);', values: [DateTime, frames]
    }

    client.query(sql, (err, res) => {
        // to check outputs to console log go to hosted website url and "inspect" < "Console" and logs should be outputted there
        // console.log(res)
        if (err) {
            console.log(err)
        };
    });
});
  

app.post('/pongmachinelearning', urlencodedParser, async (req, res) => {
    var u_name = req.session.user.u_name
    var g_name = req.body.Game
    var model_loss = req.body.ModelLoss
    var model_accuracy = req.body.ModelAcc
    var probability_up_movement = req.body.ProbUp
    var probability_down_movement = req.body.ProbDown
    var probability_no_movement = req.body.ProbStill
    var player_movement = req.body.Move
    var ballx = req.body.Ball
    var playerx = req.body.PlayerPaddle
    var aix = req.body.ComputerPaddle
    var initialreaction = req.body.InitialReaction
    var secondaryreaction = req.body.SecondaryReaction
    var increment = req.body.GameIncrement
    var ball_missed = req.body.BallMissed

    // console.log(u_name, g_name, increment, ballx, playerx, aix, ball_missed, initialreaction, secondaryreaction, probability_up_movement, probability_down_movement, probability_no_movement, player_movement, model_loss, model_accuracy)
    
    let date_ob = new Date();
  
    // current date
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);
  
    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  
    // current year
    let year = date_ob.getFullYear();
  
    // current hours
    let hours = date_ob.getHours();
  
    // current minutes
    let minutes = date_ob.getMinutes();
  
    // current seconds
    let seconds = date_ob.getSeconds();
  
    var DateTime = (date + "/" + month + "/" + year + "  " + hours + ":" + minutes + ":" + seconds);
  
    var sql = {
        text: 'INSERT INTO pong_info(u_name, g_name, increment, ballx, playerx, aix, ball_missed, reaction_one, reaction_two, probability_up_movement, probability_down_movement, probability_no_movement, player_movement, model_loss, model_accuracy, pong_datetime) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);', values: [u_name, g_name, increment, ballx, playerx, aix, ball_missed, initialreaction, secondaryreaction, probability_up_movement, probability_down_movement, probability_no_movement, player_movement, model_loss, model_accuracy, DateTime]
    }

    client.query(sql, (err, res) => {
        // to check outputs to console log go to hosted website url and "inspect" < "Console" and logs should be outputted there
        console.log(res)
        if (err){
            console.log(err)
        };
    });
});
  
  
// submit the score recieved on the respective games
app.post('/submission', urlencodedParser, async (req, res) => {
    var username = req.session.user.u_name
    var g_name = req.body.game
    var score = req.body.score

    if (req.body.runningscore != null) {
        var runningscore = req.body.runningscore
    } else {
        var runningscore = 0
    }

    var increment_too = req.body.gameincrement
  
    console.log(username, g_name, score, runningscore, increment_too)
  
    var sql = {
        text: 'INSERT INTO g_info(u_name, g_name, game_increment, score, runningscore) VALUES($1, $2, $3, $4, $5);', values: [username, g_name, increment_too, score, runningscore]
    }

    client.query(sql, (err, res) => {
        if (err){
            console.log(err)
        } else {
            console.log('Score Submitted')
        }
    });
    res.end();
});
  
// eyetracking.js files use this request when called to log eye tracking metrics similarly to how scores and ML data is logged
app.post("/eyetracking", urlencodedParser, async (req,res) => {
    var u_name = req.session.user.u_name
    var GazeX = req.body.GazeX
    var GazeY = req.body.GazeY
    var HeadX = req.body.HeadX
    var HeadY = req.body.HeadY
    var HeadZ = req.body.HeadZ
    var Yaw = req.body.Yaw
    var Pitch = req.body.Pitch
    var Roll = req.body.Roll
    var Game = req.body.Game
    var innerHeight = req.body.InnerHeight
    var innerWidth = req.body.InnerWidth
    
    // console.log(innerWidth, innerHeight)
    // console.log('Username: ' + u_name + ', GazeX :' + GazeX + ', GazeY :' + GazeY + ', HeadX :' + HeadX + ', HeadY :' + HeadY + ', HeadZ :' + HeadZ + ', Yaw :' + Yaw + ', Pitch :' + Pitch + ', Roll :' + Roll)
  
    // These are changed within the server itself and not taken from the HTML form
    let date_ob = new Date();
  
    // current date
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);
  
    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  
    // current year
    let year = date_ob.getFullYear();
  
    // current hours
    let hours = date_ob.getHours();
  
    // current minutes
    let minutes = date_ob.getMinutes();
  
    // current seconds
    let seconds = date_ob.getSeconds();
  
    var DateTime = (date + "/" + month + "/" + year + "  " + hours + ":" + minutes + ":" + seconds);
  
    // console.log('Username: ' + u_name + ', GazeX :' + GazeX + ', GazeY :' + GazeY + ', HeadX :' + HeadX + ', HeadY :' + HeadY + ', HeadZ :' + HeadZ + ', Yaw :' + Yaw + ', Pitch :' + Pitch + ', Roll :' + Roll + ', DateTime: ' + DateTime + ', Game:' + Game)
    var sql = {
        text: 'INSERT INTO e_info(u_name, gazex, gazey, headx, heady, headz, yaw, pitch, roll, e_datetime, game, inner_width, inner_height) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);', values: [u_name, GazeX, GazeY, HeadX, HeadY, HeadZ, Yaw, Pitch, Roll, DateTime, Game, innerWidth, innerHeight]
    }

    client.query(sql, (err, res) => {
        if (err){
            console.log(err)
        };
    });
    res.end();
})