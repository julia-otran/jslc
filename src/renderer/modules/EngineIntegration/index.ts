export * from './bridge';
export * from './devices';
export * from './local-conn';

import { EngineOutputMessage } from '../../../engine';
import { handleMessage, setMessageForwarder } from './messaging';

const engineWorker = new Worker('engine-worker.js');

if (engineWorker) {
  setMessageForwarder((message) => {
    engineWorker.postMessage(message);
  });

  engineWorker.addEventListener(
    'message',
    (event: MessageEvent<EngineOutputMessage> | ErrorEvent): void => {
      if (event instanceof ErrorEvent) {
        console.error(event);
      } else {
        handleMessage(event);
      }
    }
  );
}
