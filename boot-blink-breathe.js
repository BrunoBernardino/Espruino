// Init function
function onInit() {
  // Simulate breathing
  simulateBreathing( 2000 );

  // Pressing the BTN1 will trigger breathing pattern
  setWatch( function() {
    simulateBreathing( 2000 );
  }, BTN1, {
    repeat: true,
    edge: 'falling'
  });
}

// Function to simulate breathing on each LED
// @param Number howLongEach: How long for each LED to breathe
function simulateBreathing( howLongEach ) {
  // Turn off all LEDs
  digitalWrite( [ LED1, LED2, LED3 ], false );

  // Breathe RED
  LED1.breathe( howLongEach );

  // Breathe GREEN, after RED
  setTimeout( function() {
    LED2.breathe( howLongEach );

    // Breathe BLUE, after RED
    setTimeout( function() {
      LED3.breathe( howLongEach );
    }, howLongEach );
  }, howLongEach );
}

// Extend Pin (which LED1, LED2, and LED3 extend from) to allow blinking
// @param Number howLong: For how long should it blink
// @param Number speed: How fast to blink, in milliseconds (optional, defaults to 200)
Pin.prototype.blink = function( howLong, speed ) {
  var state = false,// On/Off state
    pin = this;// Current pin

  // Default blinking speed
  if ( ! speed ) {
    speed = 200;
  }

  // Initialize the array where we'll store the intervals
  if ( Pin.intervals === undefined ) {
    Pin.intervals = [];
  }

  // If we're trying to start blinking again, clear the interval first
  if ( Pin.intervals[pin] ) {
    clearInterval( Pin.intervals[pin] );
  }

  // Set the interval
  Pin.intervals[ pin ] = setInterval( function() {
    // Toggle the On/Off state
    state = ! state;

    // Write to Espruino the LED state
    digitalWrite( pin, state );
  }, speed );

  // Make sure to stop blinking after howLong
  setTimeout( function() {
    clearInterval( Pin.intervals[pin] );

    // Write to Espruino the LED state
    digitalWrite( pin, false );
  }, howLong );
};

// Extend Pin (which LED1, LED2, and LED3 extend from) to allow breathing (glowing) once
// @param Number speed: How fast to breathe, in milliseconds (optional, defaults to 2000)
// Based off of http://forum.espruino.com/conversations/480/#5510
Pin.prototype.breatheOnce = function( speed ) {
  var pin = this,// Current pin
    Hz = 80,// Defaults to 80Hz
    cycle = ( 1000 / Hz ),// have cycles every 1000/Hz milliseconds
    pos = 0.001,// we need to cheat a bit and take pos > 0 since sin(0) = 0 and digitalPulse does not accept 0
    interval;// Interval ID for breathing

  // Default breathing speed
  if ( ! speed ) {
    speed = 2000;
  }

  // Set the interval to launch this every cycle, where the dimmer cycles will have a shorter pulse and the brighter cycles a longer pulse
  interval = setInterval( function() {
    var pulseDuration = Math.pow( Math.sin(pos * Math.PI), 2 ) * cycle;

    // Avoid the dead-blink bug (LED turning blinking off slightly when switching from getting brighter to getting dimmer)
    // Basically, when the pulse duration is higher than 12.470 and smaller than 12.505, we just turn the thing on completely (no pulse)
    if ( pulseDuration >= 12.470 && pulseDuration <= 12.505 ) {
      digitalWrite( pin, 1 );
    } else {
      digitalPulse( pin, 1, pulseDuration );
    }

    pos += 1 / ( speed / cycle );

    // If we are done, we clear this interval
    if ( pos >= 1 ) {
      clearInterval( interval );
    }
  }, cycle );
};

// Extend Pin (which LED1, LED2, and LED3 extend from) to allow breathing (glowing) for a period of time
// @param Number howLong: For how long should it breathe
// @param Number speed: How fast to breathe, in milliseconds (optional, defaults to 2000)
Pin.prototype.breathe = function( howLong, speed ) {
  var pin = this,// Current pin
    interval;// Interval ID for breathing period

  // Default breathing speed
  if ( ! speed ) {
    speed = 2000;
  }

  // Set the interval for each breath
  interval = setInterval( function() {
    pin.breatheOnce( speed );
  }, speed );

  // Make sure to stop breathing
  setTimeout( function() {
    clearInterval( interval );

    // Write to Espruino the LED state
    digitalWrite( pin, false );
  }, howLong );
};