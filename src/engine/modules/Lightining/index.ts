import {
  createUniverse,
  Universe,
  setDefaultUniverse,
  addGenerator,
  ChannelGroup,
  notesToChannelsMidiSynth,
  fixedVelocityToDmxValue,
  keepValue,
  getValueProvider,
  getRawValueProvider,
  ProcessSaga,
  fork,
  roundRobinEffect,
  isProcessing,
} from '../Engine';

import { addDeviceChangeCallback, startEngine } from '../EngineAdapter';

import { MixMode, InputDeviceId, ValueProvider } from '../../../engine-types';

let midiInputId: InputDeviceId | undefined;

const getScanCh = (scanNumber: number): number => (scanNumber - 1) * 16 + 1;

const PAR_LED_UV = [209, 219];
const PAR_LED_RGB_SMALL = [
  getScanCh(1),
  getScanCh(2),
  getScanCh(5),
  getScanCh(6),
  getScanCh(7),
  getScanCh(8),
  getScanCh(9),
  getScanCh(10),
];
const PAR_LED_RGB = [getScanCh(3), getScanCh(4)];

let universe: Universe;
const dimmerChannelGroup = new ChannelGroup();
const redChannelGroup = new ChannelGroup();
const greenChannelGroup = new ChannelGroup();
const blueChannelGroup = new ChannelGroup();
const whiteChannelGroup = new ChannelGroup();
const ambarChannelGroup = new ChannelGroup();
const uvChannelGroup = new ChannelGroup();
const strobeChannelGroup = new ChannelGroup();
const velocityChannelGroup = new ChannelGroup();

const laser1 = new ChannelGroup();
const laser2 = new ChannelGroup();
const laser3 = new ChannelGroup();
const laser4 = new ChannelGroup();
const laser5 = new ChannelGroup();
const laser6 = new ChannelGroup();
const laser7 = new ChannelGroup();
const laser8 = new ChannelGroup();
const laser9 = new ChannelGroup();
const laser10 = new ChannelGroup();
const laser11 = new ChannelGroup();
const laser12 = new ChannelGroup();
const laser13 = new ChannelGroup();
const laser14 = new ChannelGroup();
const laser15 = new ChannelGroup();
const laser16 = new ChannelGroup();

const power1 = new ChannelGroup();
const power2 = new ChannelGroup();
const power3 = new ChannelGroup();

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
    fadeTimeProvider: getRawValueProvider('par-led-colored-fade'),
    pauseTimeProvider: getRawValueProvider('par-led-colored-velocity'),
  });

const prepareScenes = () => {
  laser1.addChannel({ universe, start: 229, offset: 0 });
  laser2.addChannel({ universe, start: 229, offset: 1 });
  laser3.addChannel({ universe, start: 229, offset: 2 });
  laser4.addChannel({ universe, start: 229, offset: 3 });
  laser5.addChannel({ universe, start: 229, offset: 4 });
  laser6.addChannel({ universe, start: 229, offset: 5 });
  laser7.addChannel({ universe, start: 229, offset: 6 });
  laser8.addChannel({ universe, start: 229, offset: 7 });
  laser9.addChannel({ universe, start: 229, offset: 8 });
  laser10.addChannel({ universe, start: 229, offset: 9 });
  laser11.addChannel({ universe, start: 229, offset: 10 });
  laser12.addChannel({ universe, start: 229, offset: 11 });
  laser13.addChannel({ universe, start: 229, offset: 12 });
  laser14.addChannel({ universe, start: 229, offset: 13 });
  laser15.addChannel({ universe, start: 229, offset: 14 });
  laser16.addChannel({ universe, start: 229, offset: 15 });

  power1.addChannel({ universe, start: 193, offset: 0 });
  power2.addChannel({ universe, start: 194, offset: 0 });
  power3.addChannel({ universe, start: 195, offset: 0 });

  dimmerChannelGroup.addChannels({ universe, starts: PAR_LED_UV, offset: 0 });
  dimmerChannelGroup.addChannels({
    universe,
    starts: PAR_LED_RGB_SMALL,
    offset: 0,
  });
  dimmerChannelGroup.addChannels({ universe, starts: PAR_LED_RGB, offset: 0 });

  redChannelGroup.addChannels({ universe, starts: PAR_LED_UV, offset: 1 });
  redChannelGroup.addChannels({
    universe,
    starts: PAR_LED_RGB_SMALL,
    offset: 1,
  });
  redChannelGroup.addChannels({ universe, starts: PAR_LED_RGB, offset: 1 });

  greenChannelGroup.addChannels({ universe, starts: PAR_LED_UV, offset: 2 });
  greenChannelGroup.addChannels({
    universe,
    starts: PAR_LED_RGB_SMALL,
    offset: 2,
  });
  greenChannelGroup.addChannels({ universe, starts: PAR_LED_RGB, offset: 2 });

  blueChannelGroup.addChannels({ universe, starts: PAR_LED_UV, offset: 3 });
  blueChannelGroup.addChannels({
    universe,
    starts: PAR_LED_RGB_SMALL,
    offset: 3,
  });
  blueChannelGroup.addChannels({ universe, starts: PAR_LED_RGB, offset: 3 });

  whiteChannelGroup.addChannels({ universe, starts: PAR_LED_UV, offset: 4 });

  ambarChannelGroup.addChannels({ universe, starts: PAR_LED_UV, offset: 5 });

  uvChannelGroup.addChannels({ universe, starts: PAR_LED_UV, offset: 6 });

  strobeChannelGroup.addChannels({ universe, starts: PAR_LED_UV, offset: 7 });
  strobeChannelGroup.addChannels({
    universe,
    starts: PAR_LED_RGB_SMALL,
    offset: 4,
  });
  strobeChannelGroup.addChannels({ universe, starts: PAR_LED_RGB, offset: 5 });

  velocityChannelGroup.addChannels({ universe, starts: PAR_LED_UV, offset: 9 });

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
      channelGroup: power2,
      targetValue: { valueMSB: 255 },
      weightProvider: () => {
        const currentVal = getValueProvider('laser-1', 0, 255)();

        if (currentVal > 10) {
          return 1;
        }

        return 0;
      },
    })
  );

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
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 26,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 28,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 29,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 31,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 33,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 35,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 24,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(18),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 26,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(36),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 28,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(54),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 29,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(72),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 31,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(90),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 33,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(108),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 35,
            channelGroup: laser4,
            velocityToDmxValue: fixedVelocityToDmxValue(127),
            mixMode: MixMode.AVERAGE,
          },

          {
            note: 36,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 38,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 40,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 41,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 43,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 45,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 47,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(0),
            mixMode: MixMode.CLEAR,
          },
          {
            note: 36,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(18),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 38,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(36),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 40,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(54),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 41,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(72),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 43,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(90),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 45,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(108),
            mixMode: MixMode.AVERAGE,
          },
          {
            note: 47,
            channelGroup: laser9,
            velocityToDmxValue: fixedVelocityToDmxValue(127),
            mixMode: MixMode.AVERAGE,
          },
        ],
      })
    );
  }
};

addDeviceChangeCallback(({ dmxOutputDeviceIds, inputDeviceIds }) => {
  [midiInputId] = inputDeviceIds;
  console.log({ midiInputId });

  // Add "mock" device if none
  if (dmxOutputDeviceIds.length <= 0) {
    console.log('No output detected.');
  } else if (!universe) {
    console.log('Creating universes');

    universe = createUniverse(1, dmxOutputDeviceIds[0]);
    setDefaultUniverse(universe);
  }

  if (universe && !isProcessing()) {
    startEngine();
    prepareScenes();
  }
});
