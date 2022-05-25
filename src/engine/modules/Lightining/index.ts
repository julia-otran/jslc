import {
  registerDevice,
  addDevicesChangeCallback,
  createUniverse,
  Universe,
  setDefaultUniverse,
  startProcessing,
  addProcess,
  getNextPriority,
  ProcessCallback,
  ChannelGroup,
  MixMode,
} from '../Engine';

import { reloadDevices } from '../EngineAdapter';

let universe: Universe;
let dimmerChannelGroup = new ChannelGroup();
let redChannelGroup = new ChannelGroup();

const testProcess: ProcessCallback = function* ({ status }) {
  const fadeInGenerator = timedIncrement({
    startValue() {
      return 0;
    },
    endValue: 255,
    durationMs: 2000,
  });

  while (true) {
    const frameControls = yield;

    const fadeInValue = fadeInGenerator.next().value || 255;

    frameControls.pushValues(
      dimmerChannelGroup.getChannelMapWithValue({
        value: 255,
        mixMode: MixMode.GREATER_PRIORITY,
      })
    );
    frameControls.pushValues(
      redChannelGroup.getChannelMapWithValue({
        value: fadeInValue,
        mixMode: MixMode.GREATER_PRIORITY,
      })
    );
  }
};

const prepareUI = () => {
  dimmerChannelGroup.addChannel({ universe, start: 1, offset: 0 });
  redChannelGroup.addChannel({ universe, start: 1, offset: 1 });

  addProcess(getNextPriority(), testProcess);

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
