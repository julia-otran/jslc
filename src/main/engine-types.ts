import { app, ipcMain } from 'electron';

import fs from 'fs';
import path from 'path';

export type UIMessageDispatcher = (channel: string, message: any) => void;

let uiMessageDispatcher: UIMessageDispatcher | undefined;

export const setUIMessageDispatcher = (
  dispatcher: UIMessageDispatcher
): void => {
  uiMessageDispatcher = dispatcher;
};

// Fix this under packages mode
// Need a fix for webpack config too
const typesFile = app.isPackaged
  ? path.join(__dirname, 'engine.d.ts')
  : path.join(__dirname, '../../erb/dll/engine.d.ts');

ipcMain.on('request-engine-types', () => {
  fs.readFile(typesFile, { encoding: 'utf8' }, (err, data) => {
    if (err) {
      console.error('Failed to read engine types file', err);
      uiMessageDispatcher?.('engine-types-data', null);
    } else {
      console.log('Engine types loaded!');
      uiMessageDispatcher?.('engine-types-data', data);
    }
  });
});
