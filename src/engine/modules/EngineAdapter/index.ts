import { initLocalConn } from './local-conn';

export * from './devices';
export * from './core';

initLocalConn();

console.log('Engine Adapter Loaded!');
