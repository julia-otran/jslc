import { ProcessSaga, isStopped, fork, cancel } from './frame-generator';
import { ValueProvider, Task } from '../../../engine-types';
import { fadeIn, fadeOut, hang } from './functions';

export type RoundRobinEffectScene = (
  weightProvider: ValueProvider
) => ProcessSaga;

export interface RoundRobinEffectParams {
  weightProvider: ValueProvider;
  pauseTimeProvider: ValueProvider;
  fadeTimeProvider: ValueProvider;
  scenes: RoundRobinEffectScene[];
}

export const roundRobinEffect = function* ({
  scenes,
  fadeTimeProvider,
  pauseTimeProvider,
  weightProvider,
}: RoundRobinEffectParams): ProcessSaga {
  const scenesWeight = Array(scenes.length).fill(0);
  let currentScene = 0;
  let nextScene = 0;
  let tasks: Task[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const sceneFn = scenes[i];
    const index = i;
    const scene = sceneFn(() => scenesWeight[index] * weightProvider());
    tasks.push(yield fork(scene));
  }

  let initialTime = new Date().getTime();

  yield* fadeIn({
    gracefulInStop: false,
    weightCb: (w: number) => (scenesWeight[currentScene] = w),
    durationMs: fadeTimeProvider,
    initialTime,
  });

  while (true) {
    nextScene = currentScene + 1;

    if (nextScene >= scenes.length) {
      nextScene = 0;
    }

    yield* hang({ durationMs: pauseTimeProvider });

    if (yield isStopped()) {
      break;
    }

    initialTime = new Date().getTime();

    yield* fadeIn({
      initialTime,
      gracefulInStop: false,

      weightCb(n: number): void {
        if (currentScene !== nextScene) {
          scenesWeight[currentScene] = 1 - n;
          scenesWeight[nextScene] = n;
        }
      },
      durationMs: fadeTimeProvider,
    });

    currentScene = nextScene;
  }

  const originalWeights: number[] = [...scenesWeight];

  yield* fadeOut({
    initialTime,
    durationMs: fadeTimeProvider,
    weightCb(w: number) {
      scenesWeight[currentScene] = originalWeights[currentScene] * w;
      scenesWeight[nextScene] = originalWeights[nextScene] * w;
    },
  });

  for (let i = 0; i < tasks.length; i++) {
    yield cancel(tasks[i]);
  }
};
