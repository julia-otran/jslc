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

// eslint-disable-next-line import/prefer-default-export
export const startEngine = (): void => {
  const stopMessageListener = () => {
    engineState = undefined;

    stopProcessing()
      .then(() => {
        sendMessage<EngineStoppedOutputMessage>({
          message: EngineOutputMessageNames.ENGINE_STOPPED,
          data: {
            localConnValues: exportLocalConnValues(),
          },
        });

        return undefined;
      })
      .catch(console.error);

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
