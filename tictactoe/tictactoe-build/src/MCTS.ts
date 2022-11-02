import Utils from './Utils';
import nj from '@d4c/numjs';

const EPS = 1e-8;

export default class MCTS {
  constructor(game, nnet, args) {
    console.log('MCTS constructer');
    this.game = game;
    this.nnet = nnet;
    this.args = args;
    this.Qsa = {}; // stores Q values for s,a (as defined in the paper)
    this.Nsa = {}; // stores #times edge s,a was visited
    this.Ns = {}; // stores #times board s was visited
    this.Ps = {}; // stores initial policy (returned by neural net)

    this.Es = {}; // stores game.getGameEnded ended for board s
    this.Vs = {}; // stores game.getValidMoves for board s
  }

  // return a array object
  getActionProb(canonicalBoard, temp = 1) {
    for (let i = 0; i < this.args.numMCTSSims; i++) {
      this.search(canonicalBoard);
    }
    const s = this.game.stringRepresentation(canonicalBoard);

    const aSize = this.game.getActionSize();
    let counts = [];
    for (let a = 0; a < aSize; a++) {
      const saKey = `${s};${a}`;
      if (this.Nsa.hasOwnProperty(saKey)) {
        counts.push(this.Nsa[saKey]);
      } else {
        counts.push(0);
      }
    }

    let probs;
    if (temp === 0) {
      const bestA = Utils.argmax(counts);
      probs = Array(counts.length).fill(0);
      probs[bestA] = 1;
      return probs;
    }

    counts = counts.map(x => x ** (1.0 / temp));
    const sum = counts.reduce((x, y) => x + y);
    probs = counts.map(x => x / sum);
    return probs;
  }

  // Python:
  // """
  // This function performs one iteration of MCTS. It is recursively called
  // till a leaf node is found. The action chosen at each node is one that
  // has the maximum upper confidence bound as in the paper.
  //
  // Returns:
  //     v: the negative of the value of the current canonicalBoard
  // """

  search(canonicalBoard) {
    const s = this.game.stringRepresentation(canonicalBoard);

    if (this.Es.hasOwnProperty(s) == false) {
      this.Es[s] = this.game.getGameEnded(canonicalBoard, 1);
    }

    if (this.Es[s] != 0) {
      // # terminal node
      return -this.Es[s];
    }

    if (this.Ps.hasOwnProperty(s) == false) {
      const resp = this.nnet.predict(canonicalBoard);
      this.Ps[s] = resp.Ps;
      const v = resp.v;// .get(0);

      const valids = this.game.getValidMoves(canonicalBoard, 1);
      // NOTE: : Array multiplication
      this.Ps[s] = nj.multiply(this.Ps[s], valids);
      const sum_Ps_s = nj.sum(this.Ps[s]);
      if (sum_Ps_s > 0) {
        this.Ps[s] = nj.divide(this.Ps[s], sum_Ps_s);
      } else {
        this.Ps[s] = nj.add(this.Ps[s], valids);
        this.Ps[s] = nj.divide(this.Ps[s], nj.sum(this.Ps[s]));
      }

      this.Vs[s] = valids;
      this.Ns[s] = 0;
      return v;
    }

    const valids = this.Vs[s];
    let cur_best = Number.NEGATIVE_INFINITY;
    let best_act = -1;
    const aSize = this.game.getActionSize();
    // # pick the action with the highest upper confidence bound
    for (let a = 0; a < aSize; a++) {
      // NOTE: valid is a ndarray
      if (valids.get(a) > 0) {
        const saKey = `${s};${a}`;
        let u;
        if (this.Qsa.hasOwnProperty(saKey)) {
          // JavaScript version here: u gets a value, this.Qsa[saKey] is value too.
          u = this.Qsa[saKey] + this.args.cpuct * this.Ps[s].get(a) * Math.sqrt(this.Ns[s]) / (1 + this.Nsa[saKey]);
        } else {
          u = this.args.cpuct * this.Ps[s].get(a) * Math.sqrt(this.Ns[s] + EPS);
        }

        // JavaScript: To be more clear, use specified ways to let u get value always
        if (u > cur_best) {
          cur_best = u;
          best_act = a;
        }
      }
    }

    const a = best_act; // a: value

    const nextState = this.game.getNextState(canonicalBoard, 1, a);
    let next_s = nextState.boardNdArray;
    const next_player = nextState.curPlayer;

    next_s = this.game.getCanonicalForm(next_s, next_player);
    // v (value): number
    const v = this.search(next_s);
    const saKey = `${s};${a}`;
    if (this.Qsa.hasOwnProperty(saKey)) {
      this.Qsa[saKey] = (this.Nsa[saKey] * this.Qsa[saKey] + v) / (this.Nsa[saKey] + 1);

      this.Nsa[saKey] += 1;
    } else {
      this.Qsa[saKey] = v;
      this.Nsa[saKey] = 1;
    }

    this.Ns[s] += 1;
    return -v;
  }
}
