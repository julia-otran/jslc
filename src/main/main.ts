/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import midi from 'midi';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { open, readdir, FileHandle } from 'fs/promises';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

const midiInput = new midi.Input();

interface OpenDevice {
  path: string;
  id: number;
  handle: FileHandle;
}

let openedDevices: OpenDevice[] = [];

const getDevId = (path: string): number => parseInt(path.replace('dmx', ''));

ipcMain.on('load-devices', async (event, requestId: string) => {
  console.log('Loading Linux output DMX devices....');

  const allDevices = await readdir('/dev');

  const tryDevices = allDevices
    .filter((d) => d.startsWith('dmx'))
    .filter(
      (dmxDevPath) =>
        openedDevices.find((d) => d.path === dmxDevPath) === undefined
    )
    .map((dmxDevPath) =>
      open(`/dev/${dmxDevPath}`, 'w').then((handle) => ({
        handle,
        path: dmxDevPath,
        id: getDevId(dmxDevPath),
      }))
    );

  const results = await Promise.allSettled(tryDevices);

  (
    results.filter(
      (r) => r.status === 'fulfilled'
    ) as PromiseFulfilledResult<OpenDevice>[]
  )
    .map((r) => r.value)
    .forEach((dev) => openedDevices.push(dev));

  console.log('Loading Midi inputs....');

  const midiInputPortCount = midiInput.getPortCount();

  const midiInputPorts = [];

  for (let i = 0; i < midiInputPortCount; i++) {
    midiInputPorts.push({
      id: i,
      name: midiInput.getPortName(i).toString(),
    });
  }

  const devices = {
    requestId,
    inputs: {
      midi: midiInputPorts,
    },
    outputs: {
      linuxDMX: openedDevices.map((d) => d.id),
    },
  };

  console.log(devices);

  event.reply('devices-found', devices);
});

ipcMain.on(
  'enable-midi-input',
  async (event, requestId: string, midiInputId: number) => {
    midiInput.openPort(midiInputId);
  }
);

ipcMain.on(
  'dmx-data',
  (event, requestId: string, devId: number, data: Uint8Array) => {
    const device = openedDevices.find((dev) => dev.id === devId);

    if (device) {
      device.handle
        .write(data)
        .then(() => {
          event.reply('dmx-data-done', requestId, true);
        })
        .catch(() => {
          device.handle.close();
          openedDevices = openedDevices.filter((d) => d.id !== devId);
          event.reply('dmx-data-done', requestId, false);
        });
    } else {
      event.reply('dmx-data-done', requestId, false);
    }
  }
);

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  openedDevices.forEach((dev) => dev.handle.close());
  openedDevices = [];

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
