import {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  useContext,
} from 'react';
import { equals } from 'ramda';

import {
  Devices,
  addDevicesFoundCallback,
  removeDevicesFoundCallback,
  addValuesCallback,
  removeValuesCallback,
} from './devices';

export type ValueCallback = (value: number) => void;

export type ValuesType = {
  devices: number[];
  listenToCh(device: number, channel: number, cb: ValueCallback): () => void;
};

type InternalValues = {
  [key in number]: Uint8Array;
};

const ValuesContext = createContext<ValuesType | undefined>(undefined);

export const useDevices = (): number[] => {
  const valuesCtx = useContext(ValuesContext);

  if (valuesCtx === undefined) {
    throw new Error('Cannot useDeviceChannelValue outside a ValuesProvider');
  }

  return valuesCtx.devices;
};

export const useDeviceChannelValue = (
  device: number,
  channel: number
): number => {
  const [value, setValue] = useState(0);
  const valuesCtx = useContext(ValuesContext);

  if (valuesCtx === undefined) {
    throw new Error('Cannot useDeviceChannelValue outside a ValuesProvider');
  }

  useEffect(() => {
    return valuesCtx.listenToCh(device, channel, setValue);
  }, [valuesCtx, device, channel]);

  return value;
};

export const ValuesProvider = ({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element => {
  const [devices, setDevices] = useState<number[]>([]);

  useEffect(() => {
    const cb = (rawDevices: Devices): void => {
      const devicesArr = [
        ...rawDevices.outputs.linuxDMX,
        ...(rawDevices.outputs.local ?? []),
      ];
      if (!equals(devices, devicesArr)) {
        setDevices(devicesArr);
      }
    };

    addDevicesFoundCallback(cb);

    return () => removeDevicesFoundCallback(cb);
  }, [devices]);

  const listeners = useRef<
    Array<{ device: number; channel: number; cb: ValueCallback }>
  >([]);
  const internalValues = useRef<InternalValues>({});

  const listenToCh = useCallback(
    (device: number, channel: number, cb: ValueCallback) => {
      const listener = { device, channel, cb };

      listeners.current.push(listener);

      cb(
        (internalValues.current[device] &&
          internalValues.current[device][channel - 1]) ??
          0
      );

      return () => {
        listeners.current = listeners.current.filter((l) => l !== listener);
      };
    },
    [devices, listeners]
  );

  useEffect(() => {
    const cb = (device: number, data: Uint8Array): void => {
      const currentValues = internalValues.current[device] || new Uint8Array();

      data.forEach((val, index) => {
        if (currentValues[index] !== val) {
          currentValues[index] = val;

          listeners.current
            .filter((l) => l.device === device && l.channel === index + 1)
            .forEach((l) => l.cb(val));
        }
      });

      internalValues.current[device] = currentValues;
    };

    addValuesCallback(cb);

    return () => {
      removeValuesCallback(cb);
    };
  }, [internalValues, listeners]);

  const value = useMemo(() => ({ devices, listenToCh }), [devices]);

  return (
    <ValuesContext.Provider value={value}>{children}</ValuesContext.Provider>
  );
};
