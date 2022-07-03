import {
  registerDmxOutputDevice,
  addDevicesChangeCallback,
  createUniverse,
  Universe,
  setDefaultUniverse,
  startProcessing,
  addGenerator,
  ChannelGroup,
  fadeInWithOutByWeight,
  InputDeviceId,
  isStopped,
  ProcessSaga,
  waitNextFrame,
  readFromInputDevice,
} from '../Engine';

import { reloadDevices } from '../EngineAdapter';

let midiInputId: InputDeviceId | undefined = undefined;

let universe: Universe;
let dimmerChannelGroup = new ChannelGroup();
let redChannelGroup = new ChannelGroup();
let greenChannelGroup = new ChannelGroup();
let blueChannelGroup = new ChannelGroup();
let whiteChannelGroup = new ChannelGroup();
let ambarChannelGroup = new ChannelGroup();
let uvChannelGroup = new ChannelGroup();

function* linkWithMidi(): ProcessSaga {
  while (!(yield isStopped())) {
    if (midiInputId !== undefined) {
      const inputData = yield readFromInputDevice(midiInputId);

      console.log({ inputData });
    }

    yield waitNextFrame();
  }
}

const prepareUI = () => {
  dimmerChannelGroup.addChannel({ universe, start: 1, offset: 0 });
  dimmerChannelGroup.addChannel({ universe, start: 11, offset: 0 });

  redChannelGroup.addChannel({ universe, start: 1, offset: 1 });
  redChannelGroup.addChannel({ universe, start: 11, offset: 1 });

  greenChannelGroup.addChannel({ universe, start: 1, offset: 2 });
  greenChannelGroup.addChannel({ universe, start: 11, offset: 2 });

  blueChannelGroup.addChannel({ universe, start: 1, offset: 3 });
  blueChannelGroup.addChannel({ universe, start: 11, offset: 3 });

  whiteChannelGroup.addChannel({ universe, start: 1, offset: 4 });
  whiteChannelGroup.addChannel({ universe, start: 11, offset: 4 });

  ambarChannelGroup.addChannel({ universe, start: 1, offset: 5 });
  ambarChannelGroup.addChannel({ universe, start: 11, offset: 5 });

  uvChannelGroup.addChannel({ universe, start: 1, offset: 6 });
  uvChannelGroup.addChannel({ universe, start: 11, offset: 6 });

  addGenerator(
    fadeInWithOutByWeight({
      channelGroup: dimmerChannelGroup,
      durationMs: 2000,
      targetValue: { valueMSB: 255 },
    })
  );

  addGenerator(linkWithMidi());

  startProcessing();
};

addDevicesChangeCallback(({ dmxOutputDeviceIds, inputDeviceIds }) => {
  midiInputId = inputDeviceIds[0];
  console.log({ midiInputId });

  // Add "mock" device if none
  if (dmxOutputDeviceIds.length <= 0) {
    console.log('No output detected.');
  } else {
    if (!universe) {
      console.log('Creating universes');
      universe = createUniverse(1, dmxOutputDeviceIds[0]);
      setDefaultUniverse(universe);
      prepareUI();
    }
  }
});

reloadDevices().then(({ dmxOutputDeviceIds }) => {
  if (dmxOutputDeviceIds.length <= 0) {
    console.log('Registering dummy device');
    registerDmxOutputDevice(9, () => {
      return new Promise((resolve) => setTimeout(resolve, 15));
    });
  }
});
