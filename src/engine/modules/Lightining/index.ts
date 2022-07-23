import {
  addDevicesChangeCallback,
  createUniverse,
  Universe,
  setDefaultUniverse,
  startProcessing,
  addGenerator,
  ChannelGroup,
  InputDeviceId,
  notesToChannelsMidiSynth,
  fixedVelocityToDmxValue,
  keepValue,
  getValueProvider,
  MixMode,
  ProcessSaga,
  fork,
  ValueProvider,
  roundRobinEffect,
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
let strobeChannelGroup = new ChannelGroup();
let velocityChannelGroup = new ChannelGroup();

let laser1 = new ChannelGroup();
let laser2 = new ChannelGroup();
let laser3 = new ChannelGroup();
let laser4 = new ChannelGroup();
let laser5 = new ChannelGroup();
let laser6 = new ChannelGroup();
let laser7 = new ChannelGroup();
let laser8 = new ChannelGroup();
let laser9 = new ChannelGroup();
let laser10 = new ChannelGroup();
let laser11 = new ChannelGroup();
let laser12 = new ChannelGroup();
let laser13 = new ChannelGroup();
let laser14 = new ChannelGroup();
let laser15 = new ChannelGroup();
let laser16 = new ChannelGroup();

enum Color {
  RED,
  YELLOW,
  GREEN,
  CIAN,
  BLUE,
  PINK,
  AMBAR,
  WHITE,
  UV,
}

const colorOnly = function* (
  color: Color,
  weightProvider: ValueProvider
): ProcessSaga {
  yield fork(
    keepValue({
      channelGroup: redChannelGroup,
      targetValue: {
        valueMSB: [Color.PINK, Color.RED, Color.YELLOW].includes(color)
          ? 255
          : 0,
      },
      weightProvider,
    })
  );

  yield fork(
    keepValue({
      channelGroup: greenChannelGroup,
      targetValue: {
        valueMSB: [Color.YELLOW, Color.GREEN, Color.CIAN].includes(color)
          ? 255
          : 0,
      },
      weightProvider,
    })
  );

  yield fork(
    keepValue({
      channelGroup: blueChannelGroup,
      targetValue: {
        valueMSB: [Color.CIAN, Color.BLUE, Color.PINK].includes(color)
          ? 255
          : 0,
      },
      weightProvider,
    })
  );

  yield fork(
    keepValue({
      channelGroup: whiteChannelGroup,
      targetValue: { valueMSB: color === Color.WHITE ? 255 : 0 },
      weightProvider,
    })
  );

  yield fork(
    keepValue({
      channelGroup: ambarChannelGroup,
      targetValue: { valueMSB: color === Color.AMBAR ? 255 : 0 },
      weightProvider,
    })
  );

  yield fork(
    keepValue({
      channelGroup: uvChannelGroup,
      targetValue: { valueMSB: color === Color.UV ? 255 : 0 },
      weightProvider,
    })
  );
};

const redOnly = (): ProcessSaga =>
  colorOnly(Color.RED, getValueProvider('par-led-red-only', 0, 1));

const blueOnly = (): ProcessSaga =>
  colorOnly(Color.BLUE, getValueProvider('par-led-blue-only', 0, 1));

const colored = (): ProcessSaga =>
  roundRobinEffect({
    scenes: [
      (w) => colorOnly(Color.RED, w),
      (w) => colorOnly(Color.YELLOW, w),
      (w) => colorOnly(Color.GREEN, w),
      (w) => colorOnly(Color.CIAN, w),
      (w) => colorOnly(Color.BLUE, w),
      (w) => colorOnly(Color.PINK, w),
    ],
    weightProvider: getValueProvider('par-led-colored-weight', 0, 1),
    fadeTimeProvider: () => 0,
    pauseTimeProvider: () => 1000,
  });

const prepareUI = () => {
  laser1.addChannel({ universe, start: 21, offset: 0 });
  laser2.addChannel({ universe, start: 21, offset: 1 });
  laser3.addChannel({ universe, start: 21, offset: 2 });
  laser4.addChannel({ universe, start: 21, offset: 3 });
  laser5.addChannel({ universe, start: 21, offset: 4 });
  laser6.addChannel({ universe, start: 21, offset: 5 });
  laser7.addChannel({ universe, start: 21, offset: 6 });
  laser8.addChannel({ universe, start: 21, offset: 7 });
  laser9.addChannel({ universe, start: 21, offset: 8 });
  laser10.addChannel({ universe, start: 21, offset: 9 });
  laser11.addChannel({ universe, start: 21, offset: 10 });
  laser12.addChannel({ universe, start: 21, offset: 11 });
  laser13.addChannel({ universe, start: 21, offset: 12 });
  laser14.addChannel({ universe, start: 21, offset: 13 });
  laser15.addChannel({ universe, start: 21, offset: 14 });
  laser16.addChannel({ universe, start: 21, offset: 15 });

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

  strobeChannelGroup.addChannel({ universe, start: 1, offset: 7 });
  strobeChannelGroup.addChannel({ universe, start: 11, offset: 7 });

  velocityChannelGroup.addChannel({ universe, start: 1, offset: 9 });
  velocityChannelGroup.addChannel({ universe, start: 11, offset: 9 });

  addGenerator(
    keepValue({
      channelGroup: dimmerChannelGroup,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('par-led-dimmer', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: redChannelGroup,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('par-led-red', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: greenChannelGroup,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('par-led-green', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: blueChannelGroup,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('par-led-blue', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: whiteChannelGroup,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('par-led-white', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: ambarChannelGroup,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('par-led-ambar', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: uvChannelGroup,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('par-led-uv', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: strobeChannelGroup,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('par-led-strobe', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: velocityChannelGroup,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('par-led-velocity', 0, 1),
    })
  );

  addGenerator(redOnly());
  addGenerator(blueOnly());
  addGenerator(colored());

  addGenerator(
    keepValue({
      channelGroup: laser1,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-1', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser2,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-2', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser3,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-3', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser4,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-4', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser5,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-5', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser6,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-6', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser7,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-7', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser8,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-8', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser9,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-9', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser10,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-10', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser11,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-11', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser12,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-12', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser13,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-13', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser14,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-14', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser15,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-15', 0, 1),
    })
  );

  addGenerator(
    keepValue({
      channelGroup: laser16,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('laser-16', 0, 1),
    })
  );

  if (midiInputId) {
    console.log('generator added');
    addGenerator(
      notesToChannelsMidiSynth({
        inputDeviceId: midiInputId,
        notesMapping: [
          {
            note: 24,
            channelGroup: laser1,
            velocityToDmxValue: fixedVelocityToDmxValue(87),
            mixMode: MixMode.MAX,
          },
          {
            note: 26,
            channelGroup: laser1,
            velocityToDmxValue: fixedVelocityToDmxValue(87),
            mixMode: MixMode.MAX,
          },
          {
            note: 28,
            channelGroup: laser1,
            velocityToDmxValue: fixedVelocityToDmxValue(87),
            mixMode: MixMode.MAX,
          },
          {
            note: 29,
            channelGroup: laser1,
            velocityToDmxValue: fixedVelocityToDmxValue(87),
            mixMode: MixMode.MAX,
          },
          {
            note: 31,
            channelGroup: laser1,
            velocityToDmxValue: fixedVelocityToDmxValue(87),
            mixMode: MixMode.MAX,
          },
          {
            note: 33,
            channelGroup: laser1,
            velocityToDmxValue: fixedVelocityToDmxValue(87),
            mixMode: MixMode.MAX,
          },
          {
            note: 24,
            channelGroup: laser3,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 26,
            channelGroup: laser3,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 28,
            channelGroup: laser3,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 29,
            channelGroup: laser3,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 31,
            channelGroup: laser3,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 33,
            channelGroup: laser3,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 24,
            channelGroup: laser3,
            velocityToDmxValue: fixedVelocityToDmxValue(6),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 26,
            channelGroup: laser3,
            velocityToDmxValue: fixedVelocityToDmxValue(16),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 28,
            channelGroup: laser3,
            velocityToDmxValue: fixedVelocityToDmxValue(26),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 29,
            channelGroup: laser3,
            velocityToDmxValue: fixedVelocityToDmxValue(36),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 31,
            channelGroup: laser3,
            velocityToDmxValue: fixedVelocityToDmxValue(46),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 33,
            channelGroup: laser3,
            velocityToDmxValue: fixedVelocityToDmxValue(56),
            mixMode: MixMode.AVERAGE,
          },
        ],
      })
    );
  }

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
    }
  }

  if (universe && midiInputId) {
    prepareUI();
  }
});

reloadDevices();
