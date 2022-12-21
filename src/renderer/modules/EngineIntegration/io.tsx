import { useEffect, useCallback, useState } from 'react';
import { v4 as uuidV4 } from 'uuid';

import type { IOState as IOStateExt } from '../../../main/devices-bridge';

export type IOState = IOStateExt;
export type IOStateInfo = IOStateExt['info'];

export type UseIOSetup = [IOState | undefined, (info: IOStateInfo) => void];

export const useIOSetup = (): UseIOSetup => {
  const [ioState, setIOState] = useState<IOState | undefined>(undefined);

  useEffect(() => {
    const callback = (ioStateIn: unknown): void => {
      setIOState(ioStateIn as IOState);
    };

    const deregister = window.electron.ipcRenderer.on('io-state', callback);

    window.electron.ipcRenderer.getIOState(uuidV4());

    return deregister;
  }, []);

  const setInfo = useCallback((newInfo: IOState['info']) => {
    window.electron.ipcRenderer.setIO(uuidV4(), newInfo);
  }, []);

  return [ioState, setInfo];
};
