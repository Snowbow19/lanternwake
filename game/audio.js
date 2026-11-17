export function createAudio(enabled=false) {
  let context,master;
  function notes(frequencies,duration=.18) {
    if(!enabled)return;
    try {
      if(!context){context=new AudioContext();master=context.createGain();master.gain.value=.065;master.connect(context.destination);}
      if(context.state==='suspended')context.resume();
      frequencies.forEach((frequency,index)=>{
        const oscillator=context.createOscillator(),gain=context.createGain(),start=context.currentTime+index*.065;
        oscillator.type='sine';oscillator.frequency.value=frequency;
        gain.gain.setValueAtTime(.001,start);gain.gain.linearRampToValueAtTime(1,start+.015);gain.gain.exponentialRampToValueAtTime(.001,start+duration);
        oscillator.connect(gain);gain.connect(master);oscillator.start(start);oscillator.stop(start+duration+.02);
      });
    }catch { /* Sound is optional; a browser may decline the audio device. */ }
  }
  return {
    setEnabled(value){enabled=value;if(value)notes([293.66,440]);},
    enabled:()=>enabled,
    play(type){const chords={start:[196,293.66,392],tow:[440,660],rescue:[392,523.25,659.25],damage:[110],flare:[329.63,493.88,659.25],salvage:[587.33,783.99],won:[261.63,329.63,392,523.25],lost:[196,164.81,130.81],upgrade:[392,493.88,587.33]};if(chords[type])notes(chords[type],type==='won'?.4:.18);},
  };
}
