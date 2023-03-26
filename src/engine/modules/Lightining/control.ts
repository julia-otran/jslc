import {
  addGenerator,
  assignLocalConnWithMidi,
  bpmButtonControlMap,
  decrementToggleControlMap,
  getRawValueProvider,
  getValueProvider,
  incrementToggleControlMap,
  knobControlMap,
  rollControlMap,
} from '../Engine';

// eslint-disable-next-line import/prefer-default-export
export const addControls = (): void => {
  const pageNumberProvider = getValueProvider('control-page', 0, 255);

  const pageActivator =
    (...pageNumbers: number[]) =>
    (): boolean =>
      pageNumbers.includes(pageNumberProvider());

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'control-page',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: rollControlMap({}),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'control-page',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: incrementToggleControlMap({
        noteOn: 0xb0,
        controlNumber: 0x40,
        currentValueProvider: getRawValueProvider('control-page'),
        maxValue: 127,
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'control-page',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: decrementToggleControlMap({
        noteOn: 0xb0,
        controlNumber: 0x43,
        currentValueProvider: getRawValueProvider('control-page'),
        minValue: 0,
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-dimmer',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x3,
        activeProvider: pageActivator(1, 2),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-red',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x4,
        activeProvider: pageActivator(1),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-green',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x5,
        activeProvider: pageActivator(1),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-blue',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x6,
        activeProvider: pageActivator(1),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-white',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x7,
        activeProvider: pageActivator(1),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-ambar',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x8,
        activeProvider: pageActivator(1),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-uv',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x9,
        activeProvider: pageActivator(1),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-strobe',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0xa,
        activeProvider: pageActivator(1),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-strobe',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x4,
        activeProvider: pageActivator(2),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-red-only',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x5,
        activeProvider: pageActivator(2),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-blue-only',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x6,
        activeProvider: pageActivator(2),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-colored-weight',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x7,
        activeProvider: pageActivator(2),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-colored-velocity',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x8,
        activeProvider: pageActivator(2),
        scale: {
          inputMin: 0,
          inputMax: 127,
          outputMin: 0,
          outputMax: (1 / 35) * 60 * 1000,
        },
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-colored-fade',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x9,
        activeProvider: pageActivator(2),
        scale: {
          inputMin: 0,
          inputMax: 127,
          outputMin: 0,
          outputMax: (1 / 35) * 60 * 1000,
        },
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-colored-velocity',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: bpmButtonControlMap({ noteOn: 0xb0, controlNumber: 0x1c }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'par-led-colored-fade',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: bpmButtonControlMap({ noteOn: 0xb0, controlNumber: 0x1d }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'laser-1',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x3,
        activeProvider: pageActivator(3),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'laser-2',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x4,
        activeProvider: pageActivator(3),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'laser-3',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x5,
        activeProvider: pageActivator(3),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'laser-4',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x6,
        activeProvider: pageActivator(3),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'laser-5',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x7,
        activeProvider: pageActivator(3),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'laser-6',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x8,
        activeProvider: pageActivator(3),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'laser-7',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0x9,
        activeProvider: pageActivator(3),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'laser-8',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0xa,
        activeProvider: pageActivator(3),
      }),
    })
  );

  addGenerator(
    assignLocalConnWithMidi({
      localConnName: 'laser-9',
      inputDeviceId: 'MIDI_CTRL_IN',
      controlMap: knobControlMap({
        controlNumber: 0xb,
        activeProvider: pageActivator(3),
      }),
    })
  );
};
