const __directions = [(1, 1), (1, 0), (1, -1), (0, -1), (-1, -1), (-1, 0), (-1, 1), (0, 1)];

export default class Board {
  constructor(n = 3) {
    this.n = n;

    this.pieces = Array(this.n).fill(Array(this.n).fill(0));
  }

  get_legal_moves() {
    // # Get all the empty squares (color==0)
    const moves = [];
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (this.pieces[j][i] === 0) {
          moves.push({ x: j, y: i });
        }
      }
    }
    return moves;
  }

  has_legal_moves() {
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        if (this.pieces[j][i] === 0) {
          return true;
        }
      }
    }
  }

  is_win(color) {
    // """
    // Check whether the given player has collected a triplet in any direction;
    // """
    const win = this.n;
    let count = 0;
    // check y-strips
    for (let y = 0; y < this.n; y++) {
      count = 0;
      for (let x = 0; x < this.n; x++) {
        if (this.pieces[x][y] === color) {
          count += 1;
        }
      }
      if (count === win) {
        return true;
      }
    }
    // check x-strips
    for (let x = 0; x < this.n; x++) {
      count = 0;
      for (let y = 0; y < this.n; y++) {
        if (this.pieces[x][y] === color) {
          count += 1;
        }
      }
      if (count === win) {
        return true;
      }
    }
    // check two diagonal-strips
    count = 0;
    for (let d = 0; d < this.n; d++) {
      if (this.pieces[d][d] === color) {
        count += 1;
      }
    }
    if (count === win) {
      return true;
    }
    count = 0;
    for (let d = 0; d < this.n; d++) {
      if (this.pieces[d][this.n - d - 1] === color) {
        count += 1;
      }
    }
    if (count === win) {
      return true;
    }

    return false;
  }

  execute_move(move, color) {
    // """
    // Perform the given move on the board;
    // """
    // (x,y) = move

    // console.log('move:', move);
    let { x, y } = move;
    if (x < 0) {
      if (x < -1) {
        throw 'x position is wrong!!';
      } else {
        x = this.pieces.length - 1;
      }
    }

    if (y < 0) {
      if (y < -1) {
        throw 'y position is wrong!!';
      } else {
        y = this.pieces[0].length - 1;
      }
    }

    // Add to the empty square.
    if (this.pieces[x][y] === 0) {
      this.pieces[x][y] = color;
    } else {
      throw 'already colored, wrong';
    }
  }
}
