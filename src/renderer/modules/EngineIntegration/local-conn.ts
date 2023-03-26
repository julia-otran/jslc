import {
  EngineInputMessageNames,
  EngineLocalConnInputMessageData,
  EngineLocalConnOutputMessageData,
} from '../../../engine-types';
import { useCallback, useEffect, useState } from 'react';

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

const sendLocalConn = (data: EngineLocalConnInputMessageData): void => {
  window.electron.ipcRenderer.localConn({
    message: EngineInputMessageNames.LOCAL_CONN,
    data,
  });
};

const requestLocalConnValue = (connectorKey: string): void => {
  window.electron.ipcRenderer.requestLocalConnValue(connectorKey);
};

window.electron.ipcRenderer.on('local-conn', (...args) => {
  const message = args[0] as EngineLocalConnOutputMessageData;
  localConnListeners[message.connectorKey]?.forEach((l) => l(message.value));
});

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
