import Coach from './Coach';
import { TicTacToeGame } from './tictactoe/TicTacToeGame';
import { NNetWrapper as NNet } from './tictactoe/tensorflow/NNet';

const args = {
  numIters: 3,
  numEps: 25,
  tempThreshold: 15,
  updateThreshold: 0.6,
  maxlenOfQueue: 200000,
  numMCTSSims: 25,
  arenaCompare: 100,
  cpuct: 1,

  checkpoint: './temp/',
  load_model: false,
  load_folder_file: { folder: '/dev/models/8x100x50', fileName: 'best.pth.tar' },
  numItersForTrainExamplesHistory: 20,
};

let trainedNN = null;

export function getTrainedNN() {
  return trainedNN;
}

export default async function train() {
  const g = new TicTacToeGame();
  const nnet = new NNet(g);
  
  trainedNN = nnet;
  const c = new Coach(g, nnet, args);
  await c.learn();
}
