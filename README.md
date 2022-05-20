# jslc
JavaScript based Light Control Software

# Software under construction
Liked the idea and want to contribute?
Get in touch with me.

# Proposal

```
const masterDimmerGroup = createChannelGroup();

masterDimmerGroup.addChannel({ start: 1, offset: 0 }); // Means CH 1 (1+0)
masterDimmerGroup.addChannel({ start: 17, offset: 0 }); // Means CH 17 (17+0)

// ....

const redChannelGroup = createChannelGroup();
redChannelGroup.addChannel({ start: 1, offset: 1 }); // Means CH 2 (1 + 1)
redChannelGroup.addChannel({ start: 17, offset: 1 });

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
    this.token3 = frameCallback({ priority, mode: MODES.GREATER_PRIORITY }, ({ prevMS, currentMS, deltaMS )) => {
      const deltaSecs = deltaMS / 1000;
      
      let currentVal = moviePanGroup.getCurrentValue();
      
      // Half of pan rotation per second
      currentVal += deltaSecs * (65535 / 2);
      
      if (currentVal >= 65535) {
        currentVal -= 65535;
      }
      
      moviePanGroup(currentVal);
    });
  },
  stop: () => {
    const token1 = this.token1;
    
    // Don't forget to `Off` your tokens. 
    // Otherwise, they will cause a memory leak and also will consume CPU because they will still be processed by the engine.
    fadeOff({ token: this.token2, timeSecs: 1 }).then(() => instantOff({ token: token1 }));
  },
  pause: () => {
    // If this is triggered before 1 sec, the fade in will be paused and the value will be keeped the same.
    // It will pause fadeOff too, so be careful to resume it, otherwise a leak may occur.
    pauseToken(this.token2);
  },
  resume: () => {
    resumeToken(this.token2);
  },
};
```
