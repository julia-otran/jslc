import {
  registerDevice,
  addDevicesChangeCallback,
  createUniverse,
  Universe,
  setDefaultUniverse,
  startProcessing,
  addGenerator,
  ChannelGroup,
  fadeInWithOutByWeight,
  stopProcess,
  keepValue,
} from '../Engine';

import { reloadDevices } from '../EngineAdapter';

let universe: Universe;
let dimmerChannelGroup = new ChannelGroup();
let redChannelGroup = new ChannelGroup();

const prepareUI = () => {
  dimmerChannelGroup.addChannel({ universe, start: 1, offset: 0 });
  redChannelGroup.addChannel({ universe, start: 1, offset: 1 });

  addGenerator(
    keepValue({ channelGroup: redChannelGroup, targetValue: { valueMSB: 255 } })
  );

  const token = addGenerator(
    fadeInWithOutByWeight({
      channelGroup: dimmerChannelGroup,
      durationMs: 2000,
      targetValue: { valueMSB: 255 },
    })
  );

  setTimeout(() => stopProcess(token), 3000);

  startProcessing();
};

addDevicesChangeCallback(({ outputDevices }) => {
  // Add "mock" device if none
  if (outputDevices.length <= 0) {
    console.log('No output detected.');
  } else {
    if (!universe) {
      console.log('Creating universes');
      universe = createUniverse(1, outputDevices[0]);
      setDefaultUniverse(universe);
      prepareUI();
    }
  }
});

reloadDevices().then(({ outputDevices }) => {
  if (outputDevices.length <= 0) {
    console.log('Registering dummy device');
    registerDevice(9, () => {
      return new Promise((resolve) => setTimeout(resolve, 15));
    });
  }
});
