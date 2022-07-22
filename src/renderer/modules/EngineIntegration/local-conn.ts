import { useState, useEffect, useCallback } from 'react';

import {
  EngineOutputMessageNames,
  EngineInputMessageNames,
  EngineLocalConnRequestValueInputMessage,
  EngineLocalConnInputMessage,
  EngineLocalConnInputMessageData,
  EngineLocalConnOutputMessage,
} from '../../../engine';

import { registerMessageListener, sendMessage } from './messaging';

type LocalConnListenerFn = (value: number) => void;

const localConnListeners: Record<string, LocalConnListenerFn[]> = {};

const addLocalConnListener = (
  connectorKey: string,
  listener: LocalConnListenerFn
): void => {
  if (localConnListeners[connectorKey] === undefined) {
    localConnListeners[connectorKey] = [];
  }

  localConnListeners[connectorKey].push(listener);
};

const removeLocalConnListener = (
  connectorKey: string,
  listener: LocalConnListenerFn
): void => {
  if (localConnListeners[connectorKey] !== undefined) {
    localConnListeners[connectorKey] = localConnListeners[connectorKey].filter(
      (l) => l !== listener
    );
  }
};

registerMessageListener<EngineLocalConnOutputMessage>(
  EngineOutputMessageNames.LOCAL_CONN,
  (message) => {
    const connectorListeners = localConnListeners[message.connectorKey] ?? [];
    connectorListeners.forEach((l) => l(message.value));
  }
);

const sendLocalConn = (data: EngineLocalConnInputMessageData): void => {
  sendMessage<EngineLocalConnInputMessage>({
    message: EngineInputMessageNames.LOCAL_CONN,
    data,
  });
};

const requestLocalConnValue = (connectorKey: string): void => {
  sendMessage<EngineLocalConnRequestValueInputMessage>({
    message: EngineInputMessageNames.LOCAL_CONN_REQUEST_VALUE,
    data: { connectorKey },
  });
};

export type UseLocalConn = [number | undefined, (value: number) => void];

export const useLocalConn = (connectorKey: string): UseLocalConn => {
  const [internalValue, setValue] = useState<number | undefined>(undefined);

  useEffect(() => {
    addLocalConnListener(connectorKey, setValue);
    requestLocalConnValue(connectorKey);

    return () => removeLocalConnListener(connectorKey, setValue);
  }, [connectorKey, setValue]);

  const setLocalConnValue = useCallback(
    (value: number) => {
      sendLocalConn({ connectorKey, value });
      setValue(value);
    },
    [connectorKey, setValue]
  );

  return [internalValue, setLocalConnValue];
};
