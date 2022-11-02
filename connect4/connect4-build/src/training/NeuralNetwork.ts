// @flow
const convnetjs = require("convnetjs");
const deepqlearn = require('convnetjs/build/deepqlearn');


const synaptic = require('synaptic');

exports.initialize = (networkType: string, config: Object) => {
  let myNetwork
  
  if (networkType === 'CNN') {
    const filters_number = config[networkType]['filters_number'];
    const padding = config[networkType]['padding'];
    const stride = config[networkType]['stride'];
    const size = config[networkType]['size'];
    const layers = config[networkType]['layers'];
    
    const layer_defs = [];
    // input layer
    layer_defs.push({type:'input', out_sx:7, out_sy:6, out_depth:2});
    // convolutional layers
    layer_defs.push({
      type: 'conv',
      sx: size,
      filters: filters_number,
      stride: stride,
      pad: padding,
      activation: 'relu'
    });
    for (let layer = 0; layer < layers.length; layer++) {
      layer_defs.push({
        type: 'fc',
        num_neurons: layers[layer],
        activation: 'relu'
      });
    }
    // regression layer
    layer_defs.push({type:'regression', num_neurons:7});

    myNetwork = new convnetjs.Net();
    myNetwork.makeLayers(layer_defs);

  } 
  else if (networkType === 'NN') {
    const layers = config[networkType]['layers'];

    //input layers
    const inputLayer = new synaptic.Layer(7 * 6);

    // hidden players
    const hiddenLayers = [];
    for (let layer = 0; layer < layers.length; layer++) {
      hiddenLayers.push(new synaptic.Layer(layers[layer]));
      hiddenLayers[layer].set({
        squash: synaptic.Neuron.squash.RELU,
      });
    }

    // outputlayers 
    const outputLayer = new synaptic.Layer(7);
    outputLayer.set({
      squash: synaptic.Neuron.squash.IDENTITY,
    });

    inputLayer.project(hiddenLayers[0]);
    for (let layer = 0; layer < layers.length - 1; layer++) {
      hiddenLayers[layer].project(hiddenLayers[layer + 1])
    }
    hiddenLayers[hiddenLayers.length - 1].project(outputLayer);

    // initlize
    myNetwork = new synaptic.Network({
      input: inputLayer,
      hidden: hiddenLayers,
      output: outputLayer,
    });
  }
  return myNetwork;
}

exports.getTrainer = (networkType: string, myNetwork: any) => {
  let trainer;
  if (networkType === 'CNN') {
    trainer = new convnetjs.Trainer(
      myNetwork,
      {
        method: 'sgd',
        learning_rate: 0.00001,
        momentum: 0.5,
        l2_decay: 0.001,
        l1_decay: 0.001,
        batch_size: 1,
      }
    );
  } else if (networkType === 'NN') {
    trainer = myNetwork;
  }
  return trainer;
}

exports.formatInput = (
  networkType: string,
  board: Array<Array<number>>,
  playerIdToPlay: number
) => {
  let formattedBoard;
  if (networkType === 'CNN') {
    // convert board to format readable by conv
    formattedBoard = Helper.boardToConvolutionalVol(board, playerIdToPlay);
  } else if (networkType === 'NN') {
    // convert board to format readable by dense
    formattedBoard = Helper.boardTo1DArrayFormatted(board, playerIdToPlay);
  }
  return formattedBoard;
}

exports.predict = (
  networkType: string,
  myNetwork: any,
  board: any,
) => {
  let output = [];
  let boardFormatted;
  if (networkType === 'CNN') {
    //forward()
    output = myNetwork.forward(board).w;
  } else if (networkType === 'NN') {
    //activate()
    output = myNetwork.activate(board);
  }
  return output;
}

// finding discounted reward
exports.backPropagate = (
  networkType: string,
  trainer: any,
  board: any,
  reward: number,
  columnIndex: number,
  learningRate: number
) => {
  const outputArray = Helper.getArrayFromIndex(columnIndex, reward);
  if (networkType === 'CNN') {
    trainer.learning_rate = learningRate;
    trainer.train(board, outputArray);
  } else if (networkType === 'NN') {
    trainer.activate(board);
    trainer.propagate(learningRate, outputArray);
  }
}

exports.evaluate = (
  networkType: string,
  myNetwork: any,
) => {
  if (networkType === 'CNN') {
    return Helper.evaluateLearningCNN(myNetwork);
  } else if (networkType === 'NN') {
    return Helper.evaluateLearning(myNetwork);
  }
}