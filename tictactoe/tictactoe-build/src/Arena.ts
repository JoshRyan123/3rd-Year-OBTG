export default class Arena {
  // """
  // An Arena class where any 2 agents can be pit against each other.
  // """
  //
  constructor(player1, player2, game, display) {
    console.log('Arena constructer');
    this.player1 = player1;
    this.player2 = player2;
    this.game = game;
    this.display = display;

    this.players = null;
    this.curPlayer = 0; // 0: dummy. real values: 1 or -1
    this.boardNdArray = null;
  }

  gameMoveByAction(action) {
    let valids = this.game.getValidMoves(this.game.getCanonicalForm(this.boardNdArray, this.curPlayer), 1);
    valids = valids.tolist();
    if (valids[action] == 0) {
      console.log(action);
      throw 'cannot find action';
    }
    const nextState = this.game.getNextState(this.boardNdArray, this.curPlayer, action);
    this.boardNdArray = nextState.boardNdArray;
    this.curPlayer = nextState.curPlayer;
  }

  // a: board index from 0 to 8
  humanStep(action) {
    console.log('humanStep');
    console.log(`current Player: ${this.curPlayer}`);

    let aiAction = -1;
    if (!this.players[this.curPlayer + 1].isHuman) {
      console.log('current player is ai, ignore');
      return aiAction;
    }

    if (this.game.getGameEnded(this.boardNdArray, this.curPlayer) !== 0) {
      console.log('should not happen, game is ended already');
    }

    this.display(this.boardNdArray);

    // 1. human's step.
    this.gameMoveByAction(action);

    // 2. auto ai
    aiAction = this.tryToPlayAIStep();

    if (this.game.getGameEnded(this.boardNdArray, this.curPlayer) !== 0) {
      this.display(this.boardNdArray);
    }
    return aiAction;
  }

  // it will affect who is the first player of a new game
  swapTwoPlayers() {
    console.log('swap');
    const tmpPlayer1 = this.player1;
    this.player1 = this.player2;
    this.player2 = tmpPlayer1;
  }

  tryToPlayAIStep() {
    let action = -1;
    console.log('tryToPlayAIStep');
    if (!this.players[this.curPlayer + 1].isHuman) {
      // it is an AI
      // let it = 0;
      if (this.game.getGameEnded(this.boardNdArray, this.curPlayer) === 0) {
        // curPlayer: 1 (this.player1) or -1 (this.player2)
        this.display(this.boardNdArray);
        console.log(`Player ${this.curPlayer}`);

        action = this.players[this.curPlayer + 1].play(this.game.getCanonicalForm(this.boardNdArray, this.curPlayer));

        this.gameMoveByAction(action);
      } else {
        console.log('game is already ended');
      }
    } else {
      console.log('current player is human, ignore');
    }
    return action;
  }

  playNewGameWithHuman() {
    this.players = [this.player2, null, this.player1];
    this.curPlayer = 1;
    this.boardNdArray = this.game.getInitBoardNdArray(); // !!!

    // first player (player1) may be human or AI
    return this.tryToPlayAIStep();
  }

  playGame(verbose = false) {
    const players = [this.player2, null, this.player1];
    let curPlayer = 1;
    let boardNdArray = this.game.getInitBoardNdArray();
    let it = 0;
    while (this.game.getGameEnded(boardNdArray, curPlayer) === 0) {
      it += 1;
      if (verbose) {
        this.display(boardNdArray);
        console.log(`Turn ${it}. Player ${curPlayer}`);
      }
      const action = players[curPlayer + 1].play(this.game.getCanonicalForm(boardNdArray, curPlayer));
      let valids = this.game.getValidMoves(this.game.getCanonicalForm(boardNdArray, curPlayer), 1);
      valids = valids.tolist();

      if (valids[action] == 0) {
        console.log(action);
        // assert valids[action] >0
        throw 'can not find out valid action, something wrong';
      }
      const nextState = this.game.getNextState(boardNdArray, curPlayer, action);
      boardNdArray = nextState.boardNdArray;
      curPlayer = nextState.curPlayer;
    }

    if (verbose) {
      console.log(`Game over: Turn ${it}. Result ${this.game.getGameEnded(boardNdArray, 1)}`);
      this.display(boardNdArray);
    }
    return this.game.getGameEnded(boardNdArray, 1);
  }


  playGames(num, verbose = false) {
    num = Math.floor(num / 2);
    let oneWon = 0;
    let twoWon = 0;
    let draws = 0;
    for (let i = 0; i < num; i++) {
      const gameResult = this.playGame(verbose);
      if (gameResult == 1) {
        oneWon += 1;
      } else if (gameResult == -1) {
        twoWon += 1;
      } else {
        draws += 1;
      }
    }

    this.swapTwoPlayers();
    for (let i = 0; i < num; i++) {
      const gameResult = this.playGame(verbose);
      if (gameResult == -1) {
        oneWon += 1;
      } else if (gameResult == 1) {
        twoWon += 1;
      } else {
        draws += 1;
      }
    }
    return { oneWon, twoWon, draws };
  }
}
