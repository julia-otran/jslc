import {
  startProcessing,
  stopProcessing,
  exportLocalConnValues,
  importLocalConnValues,
} from '../Engine';

import {
  registerMessageListener,
  unregisterMessageListener,
  sendMessage,
} from './messaging';
import {
  EngineInputMessageNames,
  EngineInitInputMessage,
  EngineOutputMessageNames,
  EngineStoppedOutputMessage,
  EngineState,
} from '../../../engine-types';

let engineState: EngineState | null | undefined = undefined;
let shouldStartEngine = false;

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

const beginEngine = () => {
  const { localConnValues } = engineState || {};

  if (localConnValues) {
    importLocalConnValues(localConnValues);
  }

  startProcessing();
};

export const startEngine = (): void => {
  const stopMessageListener = () => {
    engineState = undefined;

    stopProcessing().then(() => {
      sendMessage<EngineStoppedOutputMessage>({
        message: EngineOutputMessageNames.ENGINE_STOPPED,
        data: {
          localConnValues: exportLocalConnValues(),
        },
      });
    });

    unregisterMessageListener(EngineInputMessageNames.STOP_ENGINE);
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
