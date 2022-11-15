import {
  ValueProvider,
  LocalConnMessage,
  LocalConnValues,
} from '../../../engine-types';

export type LocalConnCallback = (message: LocalConnMessage) => void;

let localConnSenders: LocalConnCallback[] = [];

export const registerLocalConnSender = (sender: LocalConnCallback): void => {
  localConnSenders.push(sender);
};

export const removeLocalConnSender = (sender: LocalConnCallback): void => {
  localConnSenders = localConnSenders.filter((s) => s !== sender);
};

let localConnValues: LocalConnValues = {};

export const exportLocalConnValues = (): LocalConnValues => {
  const data: LocalConnValues = {};

  Object.keys(localConnValues).forEach((key) => {
    data[key] = localConnValues[key];
  });

  return data;
};

export const importLocalConnValues = (data: LocalConnValues): void => {
  Object.keys(data).forEach((key) => {
    sendRawLocalConnValue(key, data[key]);
  });
};

export const sendRawLocalConnValue = (
  connectorKey: string,
  value: number
): void => {
  localConnValues[connectorKey] = value;
  localConnSenders.forEach((s) => s({ connectorKey, value }));
};

export const sendLocalConnValue = (
  connectorKey: string,
  value: number,
  minValue: number,
  maxValue: number
): void => {
  const range = maxValue - minValue;
  const sanitizedValue = value - minValue;
  const multiplier = sanitizedValue / range;
  const result = 255 * Math.abs(multiplier);

  sendRawLocalConnValue(connectorKey, result);
};

export const receiveLocalConnMessage = (message: LocalConnMessage): void => {
  localConnValues[message.connectorKey] = message.value;
};

export const getRawValueProvider =
  (connectorKey: string): ValueProvider =>
  () =>
    localConnValues[connectorKey] ?? 0;

export const getValueProvider = (
  connectorKey: string,
  minValue: number,
  maxValue: number
): ValueProvider => {
  const range = maxValue - minValue;

  return () => {
    const inputVal = localConnValues[connectorKey] ?? 0;

    if (inputVal >= 255.0) {
      return maxValue;
    }

    if (inputVal <= 0) {
      return minValue;
    }

    const normalizedVal = (inputVal / 255.0) * range;

    return minValue + normalizedVal;
  };
};
