import MCTS from './MCTS';
import Utils from './Utils';
import Arena from './Arena';
import * as players from './tictactoe/TicTacToePlayers';

export default class Coach {
  // """
  // This class executes the self-play + learning.
  // """
  constructor(game, nnet, args) {
    console.log('Coach constructer');
    this.game = game;
    this.nnet = nnet;

    this.args = args;
    this.mcts = new MCTS(this.game, this.nnet, this.args);
    this.trainExamplesHistory = [];
    this.skipFirstSelfPlay = false;
  }


  executeEpisode() {
    const trainExamples = [];
    let boardNdArray = this.game.getInitBoardNdArray();
    this.curPlayer = 1;
    let episodeStep = 0;

    while (true) {
      episodeStep += 1;
      const canonicalBoard = this.game.getCanonicalForm(boardNdArray, this.curPlayer);
      const temp = episodeStep < this.args.tempThreshold ? 1 : 0;
      const pi = this.mcts.getActionProb(canonicalBoard, temp);
      const sym = this.game.getSymmetries(canonicalBoard, pi);
      sym.forEach((obj) => {
        const { b, p } = obj;

        trainExamples.push([b, this.curPlayer, p, null]);
      });

      const action = Utils.randomChoice(pi);
      const nextState = this.game.getNextState(boardNdArray, this.curPlayer, action);
      boardNdArray = nextState.boardNdArray;
      this.curPlayer = nextState.curPlayer;

      const r = this.game.getGameEnded(boardNdArray, this.curPlayer);

      if (r != 0) {
        const resp = [];
        for (const x of trainExamples) {
          resp.push({
            input_boards: x[0],
            target_pis: x[2],
            target_vs: r * ((-1) ** (x[1] != this.curPlayer)),
          });
        }
        return resp;
      }
    }
  }

  // """
  // Performs numIters iterations with numEps episodes of self-play in each
  // iteration.
  // """
  async learn() {
    const max = this.args.numIters + 1;
    console.log(`start learn ${this.args.numIters} times iteration-MTCS+train`);

    // numIters (3) * numEps (25)?
    for (let i = 1; i < max; i++) {
      console.log(`------ITER ${i}------`);

      if (!this.skipFirstSelfPlay || i > 1) {
        let iterationTrainExamples = [];

        console.log('start %d eposides', this.args.numEps);
        for (let j = 0; j < this.args.numEps; j++) {
          console.log('eposides-%d', j);
          this.mcts = new MCTS(this.game, this.nnet, this.args);
          const episodeResult = this.executeEpisode();
          iterationTrainExamples = iterationTrainExamples.concat(episodeResult);
        }
        this.trainExamplesHistory.push(iterationTrainExamples);
      }

      console.log('get this time iteration MTCS data, prepare training');

      if (this.trainExamplesHistory.length > this.args.numItersForTrainExamplesHistory) {
        console.log(`len(trainExamplesHistory) =${this.trainExamplesHistory.length} => remove the oldest trainExamples`);
        this.trainExamplesHistory.shift();
      }

      const flattenExamples = [].concat.apply([], this.trainExamplesHistory);
      //  nnet's training epochs: 10
      await this.nnet.train(flattenExamples);
      console.log('after training 1 time');

      const nmcts = new MCTS(this.game, this.nnet, this.args);
      console.log('PITTING AGAINST Random VERSION');

      const firstPlayr = new players.RandomPlayer(this.game);

      const arena = new Arena(
        firstPlayr,
        // { play: x => Utils.argmax(pmcts.getActionProb(x, 0)) },
        { play: x => Utils.argmax(nmcts.getActionProb(x, 0)) },
        this.game,
      );
      const { oneWon, twoWon, draws } = arena.playGames(this.args.arenaCompare);
      console.log('NEW/RANDOM WINS : %d / %d ; DRAWS : %d', twoWon, oneWon, draws);

      // NOTE: Use AlphaZero's design, not possibily rollback to previous version
    }

    console.log('finish learning');
  }

  // return filename
  getCheckpointFile(iteration) {
    return '';
  }
}
