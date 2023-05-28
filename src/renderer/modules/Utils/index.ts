import { useEffect, useState } from 'react';

export const STOP_LINT = true;

export const useDebounce = <T>(arg: T, time = 500): T => {
  const [current, setCurrent] = useState(arg);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrent(arg);
    }, time);

    return () => clearTimeout(timeoutId);
  }, [arg, time]);

  return current;
};
