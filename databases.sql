--scores table
CREATE TABLE g_info 
    (u_name VARCHAR(255),
     g_name TEXT,
     id INT4 NOT NULL GENERATED ALWAYS AS IDENTITY,
     game_increment VARCHAR(255),
     score VARCHAR(255),
     runningscore VARCHAR(255),
     CONSTRAINT PK_g PRIMARY KEY (id, u_name)
);

--eye tracking table
CREATE TABLE e_info
    (e_datetime timestamp,
     game VARCHAR(255),
     gazex VARCHAR(255),
     gazey VARCHAR(255),
     headx VARCHAR(255),
     heady VARCHAR(255),
     headz VARCHAR(255),
     id INT4 NOT NULL GENERATED ALWAYS AS IDENTITY,
     inner_height INT4,
     inner_width INT4,
     pitch VARCHAR(255),
     roll VARCHAR(255),
     u_name VARCHAR(5),
     yaw VARCHAR(255),
     CONSTRAINT PK_e PRIMARY KEY (id, u_name)
);

CREATE TABLE timestamp_info
    (timestamp_datetime timestamp,
     frame VARCHAR(255)
);

--ML table for Pong
CREATE TABLE pong_info
    (u_name VARCHAR(5),
     g_name TEXT,
     increment VARCHAR(255),
     ballx VARCHAR(255),
     playerx VARCHAR(255),
     aix VARCHAR(255),
     ball_missed VARCHAR(255),
     reaction_one VARCHAR(255),
     reaction_two VARCHAR(255),
     probability_up_movement DECIMAL(5,4),
     probability_down_movement DECIMAL(5,4),
     probability_no_movement DECIMAL(5,4),
     player_movement VARCHAR(255),
     model_loss VARCHAR(255),
     model_accuracy VARCHAR(255),
     pong_datetime timestamp,
     id INT4 NOT NULL GENERATED ALWAYS AS IDENTITY,
     CONSTRAINT PG_ml PRIMARY KEY (id, u_name)
);

--login table
CREATE TABLE u_info
    (email TEXT NOT NULL,
     id INT4 NOT NULL GENERATED ALWAYS AS IDENTITY,
     p_word VARCHAR(8),
     u_name VARCHAR(5),
     CONSTRAINT PK_u PRIMARY KEY (id, u_name)
);

--can only have unique names in the log-in database
ALTER TABLE u_info
    ADD CONSTRAINT UN_PKUR_NAME UNIQUE (u_name);

--foreign key constraint
ALTER TABLE pong_info
    ADD CONSTRAINT FK_ML FOREIGN KEY (u_name) REFERENCES u_info (u_name);
ALTER TABLE e_info
    ADD CONSTRAINT FK_EYE FOREIGN KEY (u_name) REFERENCES u_info (u_name);
ALTER TABLE g_info
    ADD CONSTRAINT FK_SCORE FOREIGN KEY (u_name) REFERENCES u_info (u_name);

-- INSERT INTO ml_info(u_name, c_move, board_state, g_name, ml_datetime) VALUES('atest', 2, 'TEXT', 'DotsandBoxes', '2017-07-23",  "13:10:11');
-- INSERT INTO pong_info(u_name, model_loss, model_accuracy, validation_loss, validation_accuracy, g_name, pong_datetime) VALUES('atest', '34%', '33%', '34%', '33%', 'Pong', '2017-07-23",  "13:10:11');
-- INSERT INTO pong_info(u_name, g_name, increment, ballx, playerx, aix, ball_missed, reaction_one, reaction_two, probability_up_movement, probability_down_movement, probability_no_movement, player_movement, model_loss, model_accuracy, pong_datetime) VALUES('atest', 'pong', 1, 80, 100, 0, 'no', 123, 123, 0.3, 0.2, 0.5, 'up', 0, 0, '2017-07-23",  "13:10:11');
-- INSERT INTO g_info(u_name, g_name, score) VALUES('atest', 'Asteroids', 7);
-- INSERT INTO e_info(u_name, gazex, gazey, headx, heady, headz, yaw, pitch, roll, e_datetime, game, inner_width, inner_height) VALUES('atest', '$2', '$3', '4', '5', '6', '7', '8', '9', '2017-07-23",  "13:10:11', '11', 1, 2);
-- INSERT INTO u_info(u_name, p_word, email) VALUES('SlNad', 'UkwyX', 'andrea216@btinternet.com');
-- INSERT INTO u_info(u_name, p_word, email) VALUES('oSiyV', 'aiTYq', 'kevin.ryan177@btinternet.com');
-- INSERT INTO u_info(u_name, p_word, email) VALUES('YtskC', 'SUqlk', 'bethany.bover77@gmail.com');
-- INSERT INTO u_info(u_name, p_word, email) VALUES('UwmTY', 'TELhz', 'daniel.ryan26@btinternet.com');
-- INSERT INTO u_info(u_name, p_word, email) VALUES('jwMdg', 'IAlON', 'aleksandra.stasitca@yahoo.com');
