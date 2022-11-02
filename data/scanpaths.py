import time
import pandas as pd
import pygame as pygame
import datetime

pygame.init()

font = pygame.font.Font('data/Sans.ttf', 25)

WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
SPEED = 30

class Eyetracker():
    def __init__(self):
        self.w = 1920
        self.h = 898
        self.looking_count = 0
        self.display = pygame.display.set_mode(size=(self.w, self.h))
        self.game_speed = 0.2
        pygame.display.set_caption('Playing')
        

        self.clock = pygame.time.Clock()
        self.x, self.y, self.time = self._reset()
        self.i = 0
        self.background_image = pygame.image.load("images/scanpaths_connect4_image.png").convert() 


    def _reset(self):
        username = "oSiyV"

        start = "19/05/2021  17:58:46"
        end = "19/05/2023  17:58:46"         

        path_to_csv = 'data\Data\oSiyV\Eye tracking\Connect4\oSiyV_game2_eyetracker_results.csv'
        df = pd.read_csv(path_to_csv)

        x=[]
        y=[]
        time=[]

        count = 0
        for i in range(0, len(df)):
            if df.iloc[i,12] == username:
                if df.iloc[i,0] > start and df.iloc[i,0] < end:
                    if i != 0:
                        count += 1
                        x.append(int(df.iloc[i,2]))
                        y.append(int(df.iloc[i,3]))

                        time.append((df.iloc[i,0]))

        return x, y, time


    def pause(self):
        pygame.display.set_caption('Paused')

        paused = True
        while paused:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    quit()
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_SPACE:
                        pygame.display.set_caption('Playing')
                        paused = False
                        game.play_step()
                    elif event.key == pygame.K_RIGHT:
                        game.play_step()
                    elif event.key == pygame.K_DOWN:
                        game.game_speed = game.game_speed*2
                    elif event.key == pygame.K_UP:
                        game.game_speed = game.game_speed/2

    def play_step(self):
        self.i += 1
        if self.i >= len(self.x) or self.i >= len(self.y) or self.i >= len(self.time):
            self.i = 0
        game_over = False
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                quit()
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    pygame.quit()
                    quit()
                elif event.key == pygame.K_LEFT:
                    game.pause()
                elif event.key == pygame.K_DOWN:
                    game.game_speed = game.game_speed*2
                elif event.key == pygame.K_UP:
                    game.game_speed = game.game_speed/2
        
        self._update_ui()
        self.clock.tick(SPEED)
        return game_over
    

    def _update_ui(self):
        self.display.blit(self.background_image, [0,0])
        x = self.x[self.i]
        y = self.y[self.i]

        # Connect4
        # if (595 < x < 1310):
        #     if (190 < y < 840):
        #         self.looking_count = self.looking_count+1
        
        # TicTacToe
        if (1140 < x < 1510):
            if (140 < y < 540):
                self.looking_count = self.looking_count+1

        # Pong
#        if (420 < x < 1030):
#            if (10 < y < 595):
#                self.looking_count = self.looking_count+1

        pygame.draw.rect(self.display, BLACK, pygame.Rect(self.x[self.i], self.y[self.i], 22, 22))
        pygame.draw.rect(self.display, WHITE, pygame.Rect(self.x[self.i], self.y[self.i], 20, 20))
        if self.i > 1:
            pygame.draw.line(self.display, BLACK, (self.x[self.i], self.y[self.i]), (self.x[self.i-1], self.y[self.i-1]), 2)
            pygame.draw.line(self.display, WHITE, (self.x[self.i], self.y[self.i]), (self.x[self.i-1], self.y[self.i-1]), 1)
            pygame.draw.rect(self.display, BLACK, pygame.Rect(self.x[self.i-1], self.y[self.i-1], 22, 22))
            pygame.draw.rect(self.display, WHITE, pygame.Rect(self.x[self.i-1], self.y[self.i-1], 20, 20))
            if self.i > 1:
                pygame.draw.line(self.display, BLACK, (self.x[self.i-1], self.y[self.i-1]), (self.x[self.i-2], self.y[self.i-2]), 2)
                pygame.draw.line(self.display, WHITE, (self.x[self.i-1], self.y[self.i-1]), (self.x[self.i-2], self.y[self.i-2]), 1)
                pygame.draw.rect(self.display, BLACK, pygame.Rect(self.x[self.i-2], self.y[self.i-2], 22, 22))
                pygame.draw.rect(self.display, WHITE, pygame.Rect(self.x[self.i-2], self.y[self.i-2], 20, 20))
                if self.i > 1:
                    pygame.draw.line(self.display, BLACK, (self.x[self.i-2], self.y[self.i-2]), (self.x[self.i-3], self.y[self.i-3]), 2)
                    pygame.draw.line(self.display, WHITE, (self.x[self.i-2], self.y[self.i-2]), (self.x[self.i-3], self.y[self.i-3]), 1)
                    pygame.draw.rect(self.display, BLACK, pygame.Rect(self.x[self.i-3], self.y[self.i-3], 22, 22))
                    pygame.draw.rect(self.display, WHITE, pygame.Rect(self.x[self.i-3], self.y[self.i-3], 20, 20))
                    if self.i > 1:
                        pygame.draw.line(self.display, BLACK, (self.x[self.i-3], self.y[self.i-3]), (self.x[self.i-4], self.y[self.i-4]), 2)
                        pygame.draw.line(self.display, WHITE, (self.x[self.i-3], self.y[self.i-3]), (self.x[self.i-4], self.y[self.i-4]), 1)
                        pygame.draw.rect(self.display, BLACK, pygame.Rect(self.x[self.i-4], self.y[self.i-4], 22, 22))
                        pygame.draw.rect(self.display, WHITE, pygame.Rect(self.x[self.i-4], self.y[self.i-4], 20, 20))
                        if self.i > 1:
                            pygame.draw.line(self.display, BLACK, (self.x[self.i-4], self.y[self.i-4]), (self.x[self.i-5], self.y[self.i-5]), 2)
                            pygame.draw.line(self.display, WHITE, (self.x[self.i-4], self.y[self.i-4]), (self.x[self.i-5], self.y[self.i-5]), 1)
                            pygame.draw.rect(self.display, BLACK, pygame.Rect(self.x[self.i-5], self.y[self.i-5], 22, 22))
                            pygame.draw.rect(self.display, WHITE, pygame.Rect(self.x[self.i-5], self.y[self.i-5], 20, 20))
                            
        text = font.render(str(self.time[self.i]), True, WHITE)
        text2 = font.render("looking count: "+str(self.looking_count), True, WHITE)
        self.display.blit(text, [self.w-450, self.h-50])
        self.display.blit(text2, [self.w-450, self.h-100])
        pygame.display.flip()


if __name__ == '__main__':
    game = Eyetracker()
    while True: 
        now = datetime.datetime.now()
        date_time = now.strftime("%d/%m/%Y %H:%M:%S")

        game_over = game.play_step()
        time.sleep(game.game_speed)

        if game_over == True:
            break

    pygame.quit()


    