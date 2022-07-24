import { parentPort } from 'node:worker_threads';

import {
  EngineInputMessage,
  EngineOutputMessage,
  EngineInputMessageNames,
} from '../../../engine-types';

export type MessageListener<TData = any> = (data: TData) => void;

type MessageListeners = {
  [key in EngineInputMessageNames]?: MessageListener<any>;
};

const messageListeners: MessageListeners = {};

export const registerMessageListener = <TMessage extends EngineInputMessage>(
  message: TMessage['message'],
  listener: MessageListener<TMessage['data']>
): void => {
  messageListeners[message] = listener;
};

export const unregisterMessageListener = (
  message: EngineInputMessageNames
): void => {
  delete messageListeners[message];
};

parentPort?.on('message', (message: EngineInputMessage) => {
  messageListeners[message.message]?.(message.data);
});

export const sendMessage = <TMessage extends EngineOutputMessage>(
  message: TMessage
): void => {
  parentPort?.postMessage(message);
};
