import { app, ipcMain } from 'electron';
import path from 'path';
import { Worker } from 'node:worker_threads';
import fs from 'fs';
import { LocalStorage } from 'node-localstorage';

import {
  EngineOutputMessageNames,
  EngineRequestDevicesOutputMessage,
  EngineDevicesInputMessage,
  EngineInputMessageNames,
  EngineInputDataInputMessage,
  EngineWriteToDeviceDoneInputMessage,
  EngineWriteToDeviceOutputMessage,
  EngineEnableInputOutputMessage,
  EngineInputMessage,
  EngineOutputMessage,
  EngineLocalConnOutputMessage,
  EngineLocalConnInputMessage,
  EngineLocalConnRequestValueInputMessage,
} from '../engine-types';

import {
  writeToDmxOutputDevice,
  openInput,
  getLogicalDevicesIds,
  closeDevices,
  setLogicalDevicesInfo,
  initDeviceBridge,
  addChangeLogicalDevicesCallback,
} from './devices-bridge';

// TODO: Fix this when turning platform portable
// However, we don't even support windows or osx drivers.
// So still there is no way to run this software on other platforms
const localStorage = new LocalStorage('jslc-local-storage');

let worker: Worker | undefined;

const sendMessage = <TMessage extends EngineInputMessage>(
  message: TMessage
): void => {
  worker?.postMessage(message);
};

export type UIMessageDispatcher = (channel: string, message: any) => void;

let uiMessageDispatcher: UIMessageDispatcher | undefined;

export const setUIMessageDispatcher = (
  dispatcher: UIMessageDispatcher
): void => {
  uiMessageDispatcher = dispatcher;
};

type MessageListener<TData> = (data: TData) => void;

type MessageListenerMap<TData = any> = {
  [key in EngineOutputMessageNames]?: TData;
};

const messageListeners: MessageListenerMap = {};

const registerMessageListener = <TMessage extends EngineOutputMessage>(
  message: TMessage['message'],
  listener: MessageListener<TMessage['data']>
): void => {
  messageListeners[message] = listener;
};

const handleMessage = (message: EngineOutputMessage): void => {
  messageListeners[message.message]?.(message.data);
};

registerMessageListener<EngineEnableInputOutputMessage>(
  EngineOutputMessageNames.ENABLE_INPUT,
  (msg) => {
    const { inputId } = msg;

    openInput(inputId, (message, deltaTime) => {
      sendMessage<EngineInputDataInputMessage>({
        message: EngineInputMessageNames.INPUT_DATA,
        data: { inputId, deltaTime, message },
      });
    });
  }
);

let logicalDevices: ReturnType<typeof getLogicalDevicesIds> | undefined;

registerMessageListener<EngineRequestDevicesOutputMessage>(
  EngineOutputMessageNames.REQUEST_DEVICES,
  async (data) => {
    logicalDevices = getLogicalDevicesIds();

    const { requestId } = data;

    sendMessage<EngineDevicesInputMessage>({
      message: EngineInputMessageNames.DEVICES_FOUND,
      data: {
        ...logicalDevices,
        requestId,
      },
    });
  }
);

ipcMain.on('request-devices', () => {
  uiMessageDispatcher?.('devices-found', getLogicalDevicesIds());
});

registerMessageListener<EngineWriteToDeviceOutputMessage>(
  EngineOutputMessageNames.WRITE_TO_DEVICE,
  (data) => {
    const { requestId, dmxOutputDevice, dmxData } = data;

    writeToDmxOutputDevice(dmxOutputDevice, dmxData)
      .then(() => {
        sendMessage<EngineWriteToDeviceDoneInputMessage>({
          message: EngineInputMessageNames.WRITE_TO_DEVICE_DONE,
          data: { requestId, success: true },
        });

        uiMessageDispatcher?.('dmx-data-done', {
          dmxOutputDevice,
          dmxData,
        });

        return undefined;
      })
      .catch(() => {
        sendMessage<EngineWriteToDeviceDoneInputMessage>({
          message: EngineInputMessageNames.WRITE_TO_DEVICE_DONE,
          data: { requestId, success: false },
        });
      });
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

export const stopEngine = (): Promise<void> => {
  const currentWorker = worker;

  if (currentWorker) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.error('Engine not stopped in 10s');

        resolve(currentWorker.terminate().then(() => undefined));
      }, 10000);

      currentWorker.on('message', (message: EngineOutputMessage) => {
        if (message.message === EngineOutputMessageNames.ENGINE_STOPPED) {
          clearTimeout(timeoutId);

          localStorage.setItem('ENGINE_STATE', JSON.stringify(message.data));

          resolve(currentWorker.terminate().then(() => undefined));
        }
      });

      sendMessage({
        message: EngineInputMessageNames.STOP_ENGINE,
        data: undefined,
      });

      worker = undefined;
    });
  }

  return Promise.resolve();
};

export const terminateEngine = (): Promise<void> => {
  return stopEngine().then(closeDevices);
};

const workerFile = app.isPackaged
  ? path.join(__dirname, 'engine.js')
  : path.join(__dirname, '../../erb/dll/engine.js');

const loadWorker = async () => {
  console.log('Loading worker....');

  await initDeviceBridge();

  const savedIOString = localStorage.getItem('IO');

  if (savedIOString) {
    setLogicalDevicesInfo(JSON.parse(savedIOString));
  }

  addChangeLogicalDevicesCallback((info) => {
    localStorage.setItem('IO', JSON.stringify(info));
    uiMessageDispatcher?.('devices-found', getLogicalDevicesIds());
  });

  worker = new Worker(workerFile);

  worker.on('message', (message) => {
    handleMessage(message);
  });

  worker.on('error', (...args) => {
    localStorage.removeItem('ENGINE_STATE');
    console.log('Worker errored', ...args);
  });

  sendMessage({
    message: EngineInputMessageNames.INIT_ENGINE,
    data: JSON.parse(localStorage.getItem('ENGINE_STATE') || '{}'),
  });
};

export const restartEngine = async (): Promise<void> => {
  return stopEngine().then(loadWorker);
};

if (!app.isPackaged) {
  fs.watchFile(workerFile, () => {
    console.log('Worker file update detected');
    restartEngine();
  });
}
