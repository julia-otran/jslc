# jslc
JavaScript based Light Control Software

# Proposed Technologies
- Electron
- ReactJS
- Typescript
- C lang

# Programming the scenes
There will be a node.js lib that can be included to a project so you can code, version and manage your scenes code.
Also, typescript typings will be added so you can see the entire jslc api.
Your project can be built and loaded into jslc via UI.

You can also use the debugger (it will be active even in the production builds of this project) to debug your scenes.

# Software under construction
Liked the idea and want to contribute?
Get in touch with me.

Right now we only have the basics API definitions, in this read-me.

We need to create:
- Electron user interface
- ArtNet (first thing only outputs) + lightining processing engine as Electron native module
- MIDI Inputs (just like ArtNet inputs, we stil need to define an API to receive the inputs)
- ArtNet inputs (we stil need to define an API to receive the inputs)
- Sound inputs (we could handle multiple inputs, imagine how cool can be code light behaviours over sound inputs)

# Proposal

```js
const universe1 = getUniverse({ number: 1 });
const universe2 = getUniverse({ number: 2 });

// Can be very useful if you have only one.
setDefaultUniverse(universe1);

const masterDimmerGroup = createChannelGroup();
const ledParMasterDimmerOffset = 0;

masterDimmerGroup.addChannel({ universe: universe1, start: 1, offset: ledParMasterDimmerOffset }); // Means CH 1 (1+0), first DMX universe
masterDimmerGroup.addChannel({ universe: universe2, start: 17, offset: ledParMasterDimmerOffset }); // Means CH 17 (17+0), second DMX universe

// ....

const redChannelGroup = createChannelGroup();
const ledParRedOffset = 1;

redChannelGroup.addChannel({ start: 1, offset: ledParRedOffset }); // Means CH 2 (1 + 1)
redChannelGroup.addChannel({ start: 17, offset: ledParRedOffset });

const moviePanGroup = createChannelGroupWithFine();
moviePanGroup.addChannel({ start: 33, offset: 0, type: CH_TYPE.MSB });
moviePanGroup.addChannel({ start: 33, offset: 1, type: CH_TYPE.LSB });

const myControlButton = {
  start: () => {
    // GREATER_PRIORITY mode will force the channel value to be the output of the higher priority function.
    // Thsi is why you need to take of priorities.

    this.priority = getCurrentPriority();
    this.token1 = instant({ priority, mode: MODES.GREATER_PRIORITY }, () => {
      redChannelGroup(255);
    });

    // AVERAGE mode will do an average of all other previous values set to the channel.
    // Notice that if the previous function is a GREATER_PRIORITY mode, everything with less priority than it won't be included to the
    // average calc.

    // We could also use some modes like MAXIMUN, MINIMUM, SUM, MULTIPLY. All they should obey to the previous rule about LAST_PRIORITY.
    // The SUM and MULTIPLY mode results will be limited to the 255 maximum.
    this.token2 = fadeIn({ priority, timeSecs: 1, mode: MODES.AVERAGE }, () => {
      masterDimmerGroup(255);
    });

    // We could do some effect time-based
    // This may be called on every DMX frame.
    // This API is a test, we don't know if we will get enoght performance to call it every frame (so we don't know if this API is possible).
    // Also, beware that time consupting algorithms may affect the frame rate of your effect.
    //
    // The max DMX frame rate is 44 FPS, considering any other processing costs, this callback must run at maximum of 20 ms (this time is not well defined right now, maybe it would be less than this) if you want smooth movements.

    // This is a simple demo. Many effects can be done here. This includes sin/cos calcs, exponential calcs, etc...
    // At the first run prevMS and deltaMS will be null.
    this.token3 = frameCallback({ priority, mode: MODES.GREATER_PRIORITY }, ({ prevMS, currentMS, deltaMS, isPaused )) => {
      // This will keep the values freezed when token gets paused.
      // Note that wil can even set a value when paused.
      if (!isPaused) {
        const deltaSecs = deltaMS / 1000;

        let currentVal = moviePanGroup.getCurrentValue();

        // Half of pan rotation per second
        currentVal += deltaSecs * (65535 / 2);

        if (currentVal >= 65535) {
          currentVal -= 65535;
        }

        moviePanGroup(currentVal);
      }
    });
  },
  stop: () => {
    const token1 = this.token1;
    const token3 = this.token3;

    // Don't forget to `Off` your tokens.
    // Otherwise, they will cause a memory leak and also will consume CPU because they will still be processed by the engine.
    fadeOff({ token: this.token2, timeSecs: 1 }).then(() => {
      return Promise.all([instantOff({ token: token1 }), instantOff({ token: token3 })]);
    });
  },
  pause: () => {
    // If this is triggered before 1 sec, the fade in will be paused and the value will be keeped the same.
    // It will pause fadeOff too, so be careful to resume it, otherwise a leak may occur.
    pauseToken(this.token2);
    // will set the flag paused to the callback
    pauseToken(this.token3);
  },
  resume: () => {
    resumeToken(this.token2);
    resumeToken(this.token3);
  },
};

addControlButton('RED and Movie Pan', myControlButton);
```
