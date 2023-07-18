import { useEffect, useState } from 'react';

import { useDebounce } from '../Utils';

export const useEngineTypes = (): string | undefined => {
  const [typesData, setTypesData] = useState<string | undefined>(undefined);

  useEffect(() => {
    window.electron.ipcRenderer
      .getEngineTypes()
      .then(setTypesData)
      .catch(() => {});
  }, []);

  return typesData;
};

export type EngineCodeSet = (code: string) => void;

export const useEngineCode = (): [string | undefined, EngineCodeSet] => {
  const [code, setCode] = useState<string | undefined>();

  useEffect(() => {
    const deregister = window.electron.ipcRenderer.on('engine-code', (data) =>
      setCode(data as string)
    );

    window.electron.ipcRenderer.requestEngineCode();

    return deregister;
  }, []);

  const codeDebounced = useDebounce(code);

  useEffect(() => {
    if (codeDebounced) {
      window.electron.ipcRenderer.engineCodeUpdate(codeDebounced);
    }
  }, [codeDebounced]);

  return [code, setCode];
};
