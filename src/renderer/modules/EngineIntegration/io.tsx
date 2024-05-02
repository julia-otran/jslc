import type {
  ArtNetInputAddress,
  ArtNetOutputAddress,
  IOState as IOStateIn,
} from '../../../main/devices-bridge';
import { mapObjIndexed, reduce } from 'ramda';
import { useCallback, useEffect, useState } from 'react';

import { v4 as uuidV4 } from 'uuid';

export interface IOStateInfoInputArtNet extends ArtNetInputAddress {
  type: 'ART_NET';
  name: string;
}

export interface IOStateInfoInputMidi {
  type: 'MIDI';
  name: string;
  portName: string;
}

export interface IOStateInfoOutputLinuxDMX {
  type: 'LINUX_DMX';
  name: string;
  device: string;
}

export interface IOStateInfoOutputMockDMX {
  type: 'MOCK_DMX';
  name: string;
}

export interface IOStateInfoOutputArtNetDMX extends ArtNetOutputAddress {
  type: 'ART_NET';
  name: string;
}

export type IOStateInfo = {
  inputs: (IOStateInfoInputArtNet | IOStateInfoInputMidi)[];
  outputs: (
    | IOStateInfoOutputLinuxDMX
    | IOStateInfoOutputMockDMX
    | IOStateInfoOutputArtNetDMX
  )[];
};

export type IOState = {
  info: IOStateInfo;
  status: IOStateIn['status'];
  connectedDevices: IOStateIn['connectedDevices'];
};

const fromEngineToUI = (inState: IOStateIn): IOState => {
  return {
    status: inState.status,
    connectedDevices: inState.connectedDevices,
    info: {
      inputs: [
        ...Object.values(
          mapObjIndexed(
            (value, key) =>
              ({
                type: 'ART_NET',
                name: key,
                ...value,
              } as IOStateInfoInputArtNet),
            inState.info.artNetInputs
          )
        ),
        ...Object.values(
          mapObjIndexed(
            (value, key) =>
              ({
                type: 'MIDI',
                name: key,
                portName: value,
              } as IOStateInfoInputMidi),
            inState.info.midiInputs
          )
        ),
      ],
      outputs: [
        ...inState.info.mockDMXOutputs.map(
          (mock) =>
            ({
              type: 'MOCK_DMX',
              name: mock,
            } as IOStateInfoOutputMockDMX)
        ),
        ...Object.values(
          mapObjIndexed(
            (value, key) =>
              ({
                type: 'LINUX_DMX',
                name: key,
                device: value.toString(),
              } as IOStateInfoOutputLinuxDMX),
            inState.info.linuxDMXOutputs
          )
        ),
        ...Object.values(
          mapObjIndexed(
            (value, key) =>
              ({
                type: 'ART_NET',
                name: key,
                ...value,
              } as IOStateInfoOutputArtNetDMX),
            inState.info.artNetOutputs
          )
        ),
      ],
    },
  };
};

const fromUiToEngine = (ioState: IOStateInfo): IOStateIn['info'] => ({
  linuxDMXOutputs: reduce(
    (acc, value) => ({ ...acc, [value.name]: parseInt(value.device, 10) }),
    {} as IOStateIn['info']['linuxDMXOutputs'],
    ioState.outputs.filter(
      ({ type }) => type === 'LINUX_DMX'
    ) as IOStateInfoOutputLinuxDMX[]
  ),
  artNetOutputs: reduce(
    (acc, value) => ({
      ...acc,
      [value.name]: {
        ip: value.ip,
        net: value.net,
        subnet: value.subnet,
        universe: value.universe,
        port: value.port,
        resendIntervalMs: value.resendIntervalMs,
      },
    }),
    {} as IOStateIn['info']['artNetOutputs'],
    ioState.outputs.filter(
      ({ type }) => type === 'ART_NET'
    ) as IOStateInfoOutputArtNetDMX[]
  ),
  mockDMXOutputs: ioState.outputs
    .filter(({ type }) => type === 'MOCK_DMX')
    .map(({ name }) => name),
  artNetInputs: reduce(
    (acc, value) => ({
      ...acc,
      [value.name]: {
        subnet: value.subnet,
        net: value.net,
        universe: value.universe,
      },
    }),
    {} as IOStateIn['info']['artNetInputs'],
    ioState.inputs.filter(
      ({ type }) => type === 'ART_NET'
    ) as IOStateInfoInputArtNet[]
  ),
  midiInputs: reduce(
    (acc, value) => ({
      ...acc,
      [value.name]: value.portName,
    }),
    {} as IOStateIn['info']['midiInputs'],
    ioState.inputs.filter(
      ({ type }) => type === 'MIDI'
    ) as IOStateInfoInputMidi[]
  ),
});

export type UseIOSetup = [
  IOState | undefined,
  (info: IOStateInfo) => void,
  () => void
];

export const useIOSetup = (): UseIOSetup => {
  const [ioState, setIOState] = useState<IOState | undefined>(undefined);

  const refreshDevices = useCallback(() => {
    window.electron.ipcRenderer.getIOState(uuidV4());
  }, []);

  useEffect(() => {
    const callback = (ioStateInRaw: unknown): void => {
      setIOState(fromEngineToUI(ioStateInRaw as IOStateIn));
    };

    const deregister = window.electron.ipcRenderer.on('io-state', callback);

    refreshDevices();

    return deregister;
  }, [refreshDevices]);

  const setInfo = useCallback((newInfo: IOStateInfo) => {
    window.electron.ipcRenderer.setIO(uuidV4(), fromUiToEngine(newInfo));
  }, []);

  return [ioState, setInfo, refreshDevices];
};
