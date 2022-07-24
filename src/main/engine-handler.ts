import midi from 'midi';
import { app, ipcMain } from 'electron';
import { open, readdir, FileHandle } from 'fs/promises';
import path from 'path';
import { Worker } from 'node:worker_threads';

import {
  EngineOutputMessageNames,
  EngineRequestDevicesOutputMessage,
  EngineDevicesInputMessage,
  EngineInputMessageNames,
  EngineMidiInputDataInputMessage,
  EngineWriteToDeviceDoneInputMessage,
  EngineWriteToDeviceOutputMessage,
  EngineEnableMidiInputOutputMessage,
  EngineInputMessage,
  EngineOutputMessage,
  EngineLocalConnOutputMessage,
  EngineLocalConnInputMessage,
  EngineLocalConnRequestValueInputMessage,
} from '../engine-types';

export type UIMessageDispatcher = (channel: string, message: any) => void;

let uiMessageDispatcher: UIMessageDispatcher | undefined = undefined;

export const setUIMessageDispatcher = (
  dispatcher: UIMessageDispatcher
): void => {
  uiMessageDispatcher = dispatcher;
};

const midiInput = new midi.Input();
const midiInputs: Record<number, midi.Input> = {};

interface OpenDevice {
  path: string;
  id: number;
  handle: FileHandle;
}

let openedDevices: OpenDevice[] = [];

const getDevId = (path: string): number => parseInt(path.replace('dmx', ''));

type MessageListener<TData> = (data: TData) => void;

type MessageListenerMap<TData = any> = {
  [key in EngineOutputMessageNames]?: TData;
};

let messageListeners: MessageListenerMap = {};

const registerMessageListener = <TMessage extends EngineOutputMessage>(
  message: TMessage['message'],
  listener: MessageListener<TMessage['data']>
): void => {
  messageListeners[message] = listener;
};

const handleMessage = (message: EngineOutputMessage): void => {
  messageListeners[message.message]?.(message.data);
};

registerMessageListener<EngineEnableMidiInputOutputMessage>(
  EngineOutputMessageNames.ENABLE_MIDI_INPUT,
  (msg) => {
    const { midiInputId } = msg;

    console.log(`Openning midi input port ${midiInputId}`);

    if (midiInputs[midiInputId] === undefined) {
      midiInputs[midiInputId] = new midi.Input();

      const input = midiInputs[midiInputId];

      input.openPort(midiInputId);

      input.on('message', (deltaTime, message) => {
        console.log({ message, deltaTime });

        sendMessage<EngineMidiInputDataInputMessage>({
          message: EngineInputMessageNames.MIDI_INPUT_DATA,
          data: { midiInputId, deltaTime: deltaTime.toString(), message },
        });
      });
    }
  }
);

export interface Devices {
  requestId: string;
  inputs: {
    midi: Array<{
      name: string;
      id: number;
    }>;
  };
  outputs: {
    linuxDMX: Array<number>;
    local: Array<number>;
  };
}

let devices: Devices | undefined = undefined;

registerMessageListener<EngineRequestDevicesOutputMessage>(
  EngineOutputMessageNames.REQUEST_DEVICES,
  async (data) => {
    console.log('Loading Linux output DMX devices....');

    const allDevices = await readdir('/dev');

    const tryDevices = allDevices
      .filter((d) => d.startsWith('dmx'))
      .filter(
        (dmxDevPath) =>
          openedDevices.find((d) => d.path === dmxDevPath) === undefined
      )
      .map((dmxDevPath) =>
        open(`/dev/${dmxDevPath}`, 'w').then((handle) => ({
          handle,
          path: dmxDevPath,
          id: getDevId(dmxDevPath),
        }))
      );

    const results = await Promise.allSettled(tryDevices);

    (
      results.filter(
        (r) => r.status === 'fulfilled'
      ) as PromiseFulfilledResult<OpenDevice>[]
    )
      .map((r) => r.value)
      .forEach((dev) => openedDevices.push(dev));

    console.log('Loading Midi inputs....');

    const midiInputPortCount = midiInput.getPortCount();

    const midiInputPorts = [];

    for (let i = 0; i < midiInputPortCount; i++) {
      midiInputPorts.push({
        id: i,
        name: midiInput.getPortName(i).toString(),
      });
    }

    devices = {
      requestId: data.requestId,
      inputs: {
        midi: midiInputPorts,
      },
      outputs: {
        linuxDMX: openedDevices.map((d) => d.id),
        local: [9],
      },
    };

    console.log(devices);

    const { requestId } = devices;

    const linuxDmxOutputDevices = devices.outputs.linuxDMX;
    const localDmxOutputDevices = devices.outputs.local;
    const midiInputDevices = devices.inputs.midi;

    sendMessage<EngineDevicesInputMessage>({
      message: EngineInputMessageNames.DEVICES_FOUND,
      data: {
        localDmxOutputDevices,
        linuxDmxOutputDevices,
        midiInputDevices,
        requestId,
      },
    });

    uiMessageDispatcher?.('devices-found', devices);
  }
);

ipcMain.on('request-devices', () => {
  uiMessageDispatcher?.('devices-found', devices);
});

registerMessageListener<EngineWriteToDeviceOutputMessage>(
  EngineOutputMessageNames.WRITE_TO_DEVICE,
  (data) => {
    const { requestId, dmxOutputDevice, dmxData } = data;

    if (dmxOutputDevice === 9) {
      setTimeout(() => {
        sendMessage<EngineWriteToDeviceDoneInputMessage>({
          message: EngineInputMessageNames.WRITE_TO_DEVICE_DONE,
          data: { requestId, success: true },
        });

        uiMessageDispatcher?.('dmx-data-done', {
          dmxOutputDevice,
          dmxData,
        });
      }, 20);
    } else {
      const device = openedDevices.find((dev) => dev.id === dmxOutputDevice);

      if (device) {
        device.handle
          .write(dmxData)
          .then(() => {
            sendMessage<EngineWriteToDeviceDoneInputMessage>({
              message: EngineInputMessageNames.WRITE_TO_DEVICE_DONE,
              data: { requestId, success: true },
            });

            uiMessageDispatcher?.('dmx-data-done', {
              dmxOutputDevice,
              dmxData,
            });
          })
          .catch(() => {
            device.handle.close();
            openedDevices = openedDevices.filter(
              (d) => d.id !== dmxOutputDevice
            );

            sendMessage<EngineWriteToDeviceDoneInputMessage>({
              message: EngineInputMessageNames.WRITE_TO_DEVICE_DONE,
              data: { requestId, success: false },
            });
          });
      } else {
        sendMessage<EngineWriteToDeviceDoneInputMessage>({
          message: EngineInputMessageNames.WRITE_TO_DEVICE_DONE,
          data: { requestId, success: false },
        });
      }
    }
  }
);

registerMessageListener<EngineLocalConnOutputMessage>(
  EngineOutputMessageNames.LOCAL_CONN,
  (message) => {
    uiMessageDispatcher?.('local-conn', message);
  }
);

ipcMain.on(
  'local-conn',
  (_: Electron.IpcMainEvent, data: EngineLocalConnInputMessage): void => {
    sendMessage<EngineLocalConnInputMessage>(data);
  }
);

ipcMain.on(
  'request-local-conn-value',
  (_: Electron.IpcMainEvent, connectorKey: string): void => {
    sendMessage<EngineLocalConnRequestValueInputMessage>({
      message: EngineInputMessageNames.LOCAL_CONN_REQUEST_VALUE,
      data: { connectorKey },
    });
  }
);

export const terminateEngine = (): void => {
  openedDevices.forEach((dev) => dev.handle.close());
  openedDevices = [];
};

const workerFile = app.isPackaged
  ? path.join(__dirname, 'engine.js')
  : path.join(__dirname, '../../erb/dll/engine.js');

const worker = new Worker(workerFile);

const sendMessage = <TMessage extends EngineInputMessage>(
  message: TMessage
): void => {
  worker.postMessage(message);
};

worker.on('message', (message) => {
  handleMessage(message);
});

worker.on('error', (...args) => {
  console.log('Worker errored', ...args);
});
