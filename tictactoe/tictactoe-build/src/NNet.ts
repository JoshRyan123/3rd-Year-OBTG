import { NeuralNet } from '../../NeuralNet';
import * as tf from '@tensorflow/tfjs';

import TicTacToeNNet from './TicTacToeNNet';

const args = {
  lr: 0.001,
  dropout: 0.3,
  epochs: 8,
  batch_size: 64,
  cuda: false,
  num_channels: 512,
};

export class NNetWrapper extends NeuralNet {
  constructor(game) {
    super();
    this.nnet = new TicTacToeNNet(game, args);
    const { a, b } = game.getBoardSize();
    this.board_x = a;
    this.board_y = b;
    // return { a: this.n, b: this.n };
    this.action_size = game.getActionSize();

    console.log('NNetWrapper constructer');
  }

  async train(examples) {
    console.log('train -1. epoch size:', args.batch_size);
    console.log('examples:', examples);
    const total = examples.length;

    const inputData = [];
    const pisData = [];
    const vsData = [];

    for (let i = 0; i < total; i++) {
      const example = examples[i];
      const { input_boards, target_pis, target_vs } = example;
      const input_boards2 = input_boards.tolist(); // 3x3 numjs(numpy ndarray like)
      inputData.push(input_boards2);
      pisData.push(target_pis);
      vsData.push(target_vs);
      // console.log('pisData item size:', target_pis.length);
    }

    let xTrain = tf.tensor3d(inputData, [total, 3, 3]);
    xTrain = xTrain.reshape([total, 3, 3, 1]);

    const yTrain1 = tf.tensor2d(pisData); // , [total, 10]);
    const yTrain2 = tf.tensor2d(vsData, [total, 1]); // 784
    console.log('start train');

    const history = await this.nnet.model.fit(xTrain, [yTrain1, yTrain2], {
      shuffle: true,
      batchSize: args.batch_size,
      epochs: args.epochs, // params.epochs
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log('onEpochEnd');
        },
      },
    });

    console.log('training-2: after fit');
  }

  async loadPretrained(url) {
    console.log('load model start');

    // 'https://foo.bar/tfjs_artifacts/model.json'
    this.preTrainedModel = await tf.loadModel(url);

    console.log('load model ok');
  }

  predict(boardNdArray) {
    // console.log('prediction');

    try {
      // prepare input
      let input = boardNdArray.tolist();

      input = tf.tensor3d([input], [1, 3, 3]);

      // run
      let prediction;
      if (this.preTrainedModel) {
        prediction = this.preTrainedModel.predict(input);
      } else {
        input = input.reshape([1, 3, 3, 1]);
        prediction = this.nnet.model.predict(input);
      }

      const data1 = prediction[0].dataSync();

      const data12 = Array.from(data1);

      const data2 = Array.from(prediction[1].dataSync());

      const Ps = data12; // e.g. [0,1,2,3,0,1,2,3,0,1,2,3];
      const v = data2[0]; // e.g.[0.1];

      // console.log('tensorflow predicts Ps:', Ps, '. v:', v);
      prediction[0].dispose();
      prediction[1].dispose();
      input.dispose();
      return { Ps, v };
    } catch (err) {
      console.log('prediction error:', err);
    }
  }

  save_checkpoint(folder = 'checkpoint', filename = 'checkpoint.pth.tar') {
  }

  load_checkpoint(folder = 'checkpoint', filename = 'checkpoint.pth.tar') {
  }
}