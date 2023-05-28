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
  startProcessing,
  stopProcessing,
} from '../Engine';
import {
  registerMessageListener,
  sendMessage,
  unregisterMessageListener,
} from './messaging';

let engineState: EngineState | null | undefined;
let shouldStartEngine = false;

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

    if (shouldStartEngine) {
      shouldStartEngine = false;
      beginEngine();
    }
  }
);

export const stopEngine = async (): Promise<void> => {
  engineState = {
    localConnValues: exportLocalConnValues(),
  };

  unregisterMessageListener(EngineInputMessageNames.STOP_ENGINE);

  await stopProcessing();

  sendMessage<EngineStoppedOutputMessage>({
    message: EngineOutputMessageNames.ENGINE_STOPPED,
    data: engineState ?? { localConnValues: {} },
  });
};

export const startEngine = (): void => {
  const stopMessageListener = () => {
    stopEngine();
    engineState = undefined;
  };

  registerMessageListener(
    EngineInputMessageNames.STOP_ENGINE,
    stopMessageListener
  );

  if (engineState === undefined) {
    shouldStartEngine = true;
  } else {
    beginEngine();
  }
};
