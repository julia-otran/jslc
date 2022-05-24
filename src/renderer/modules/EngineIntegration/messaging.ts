import {
  EngineOutputMessageNames,
  EngineInputMessage,
  EngineOutputMessage,
} from '../../../engine';

export type MessageListener<TData> = (data: TData) => void;
export type MessageForwarder = (message: EngineInputMessage) => void;

type MessageListenerMap<TData = any> = {
  [key in EngineOutputMessageNames]?: TData;
};

let messageListeners: MessageListenerMap = {};
let messageForwarder: MessageForwarder | undefined = undefined;

export const registerMessageListener = <TMessage extends EngineOutputMessage>(
  message: TMessage['message'],
  listener: MessageListener<TMessage['data']>
): void => {
  messageListeners[message] = listener;
};

export const unregisterMessageListener = (
  message: EngineOutputMessageNames
): void => {
  delete messageListeners[message];
};

export const handleMessage = (
  event: MessageEvent<EngineOutputMessage>
): void => {
  messageListeners[event.data.message]?.(event.data.data);
};

export const sendMessage = <TMessage extends EngineInputMessage>(
  message: TMessage
): void => {
  if (messageForwarder) {
    messageForwarder(message);
  } else {
    throw new Error(
      'Cannot send message to engine. Did the engine worker started?'
    );
  }
};

export const setMessageForwarder = (forwarder: MessageForwarder): void => {
  messageForwarder = forwarder;
};
