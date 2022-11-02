// @flow
// use previous wins to train on
exports.trainOnPreviousPlays = (
  networkType: string,
  myNetwork: any,
  myTrainer: any,
  boards: Array<any>,
  plays: Array<number>,
  learningRate: number,
  reward: number,
  discount: number,
  gamma: number,
) => {
  const playsLength = plays.length;

  // find parent Qvalue using network type, the network and the winning boards contained so far in play
  let previousQValue = NeuralNetwork.predict(
    networkType,
    myNetwork,
    boards[playsLength - 1],
  );
  
  // backpropagate on the previous winning Plays
  for (let playIndex = playsLength - 2; playIndex >= 0; playIndex--) {
    NeuralNetwork.backPropagate(
      networkType,
      myTrainer,
      boards[playIndex],
      discount ** (playsLength - playIndex - 1) * reward + gamma * Math.max(...previousQValue),
      plays[playIndex],
      learningRate
    )
    // predict q-value
    previousQValue = NeuralNetwork.predict(
      networkType,
      myNetwork,
      boards[playIndex],
    );
  }
}