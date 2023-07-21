import {
  EngineInitInputMessage,
  EngineInputMessageNames,
  EngineOutputMessageNames,
  EngineState,
  EngineStoppedOutputMessage,
} from '../../../engine-types';
import {
  exportLocalConnValues,
  importLocalConnValues,
  isProcessing,
  startProcessing,
  stopProcessing,
} from '../Engine';
import {
  registerMessageListener,
  sendMessage,
  unregisterMessageListener,
} from './messaging';

let engineState: EngineState | null | undefined;

const beginEngine = () => {
  const { localConnValues } = engineState || {};

  if (localConnValues) {
    importLocalConnValues(localConnValues);
  }

  startProcessing();
};

registerMessageListener<EngineInitInputMessage>(
  EngineInputMessageNames.INIT_ENGINE,
  (data) => {
    if (data) {
      engineState = data;
    } else {
      engineState = null;
    }
  }
);

export const stopEngine = async (): Promise<void> => {
  unregisterMessageListener(EngineInputMessageNames.STOP_ENGINE);

  if (isProcessing()) {
    engineState = {
      localConnValues: exportLocalConnValues(),
    };

    await stopProcessing();
  }

  sendMessage<EngineStoppedOutputMessage>({
    message: EngineOutputMessageNames.ENGINE_STOPPED,
    data: engineState,
  });
};

export const startEngine = (): void => {
  const stopMessageListener = async () => {
    await stopEngine();
    engineState = undefined;
  };

  registerMessageListener(
    EngineInputMessageNames.STOP_ENGINE,
    stopMessageListener
  );

  beginEngine();
};
