import {
  EngineInputMessage,
  EngineOutputMessage,
  EngineInputMessageNames,
} from '../EngineMessaging';

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

self.addEventListener(
  'message',
  (event: MessageEvent<EngineInputMessage>): void => {
    messageListeners[event.data.message]?.(event.data.data);
  }
);

export const sendMessage = <TMessage extends EngineOutputMessage>(
  message: TMessage
): void => {
  postMessage(message);
};
