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
  linearVelocityToDmxValue,
  keepValue,
  getValueProvider,
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

  addGenerator(
    keepValue({
      channelGroup: dimmerChannelGroup,
      targetValue: { valueMSB: 255 },
      weightProvider: getValueProvider('par-led-dimmer-1', 0, 1),
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
    console.log('generator added');
    addGenerator(
      notesToChannelsMidiSynth({
        inputDeviceId: midiInputId,
        notesMapping: [
          {
            note: 24,
            channelGroup: redChannelGroup,
            velocityToDmxValue: linearVelocityToDmxValue,
          },
          {
            note: 26,
            channelGroup: greenChannelGroup,
            velocityToDmxValue: linearVelocityToDmxValue,
          },
          {
            note: 28,
            channelGroup: blueChannelGroup,
            velocityToDmxValue: linearVelocityToDmxValue,
          },
          {
            note: 29,
            channelGroup: whiteChannelGroup,
            velocityToDmxValue: linearVelocityToDmxValue,
          },
          {
            note: 31,
            channelGroup: ambarChannelGroup,
            velocityToDmxValue: linearVelocityToDmxValue,
          },
          {
            note: 33,
            channelGroup: uvChannelGroup,
            velocityToDmxValue: linearVelocityToDmxValue,
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
