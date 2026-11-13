/* Synthesis is local. The first gesture unlocks audio; it is safe to play without it. */
const VeilAudio = (() => {
  const ambience = {
    salt:[46,71,.035], archive:[52,104,.021], garden:[44,66,.035],
    soundings:[38,57,.065], sky:[57,86,.026],
    crypt: [53, 81, .07], catacomb: [47, 67, .1], chapel: [61, 92, .045],
    nave: [41, 62, .12], sanctuary: [37, 58, .065], watcher: [32, 49, .11],
  };
  let audio, output, room, roomLevel, bed, noise, current, volume=.7, muted=false;

  function begin() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      if (!audio) {
        audio=new Audio();
        output=audio.createGain();
        output.gain.value=muted?0:volume;
        output.connect(audio.destination);
        const buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);
        const samples=buffer.getChannelData(0);
        let last=0;
        for(let i=0;i<samples.length;i++){
          last=.94*last+.06*(Math.random()*2-1);
          samples[i]=last;
        }
        noise=buffer;
        room=audio.createBiquadFilter();
        room.type='lowpass';
        room.frequency.value=85;
        roomLevel=audio.createGain();
        roomLevel.gain.value=0;
        roomLevel.connect(output);
        bed=[audio.createOscillator(),audio.createOscillator()];
        bed.forEach((voice,i)=>{
          voice.type=i?'triangle':'sine';
          voice.frequency.value=ambience.crypt[i];
          voice.connect(roomLevel);
          voice.start();
        });
        const air=audio.createBufferSource();
        air.buffer=noise;air.loop=true;
        air.connect(room).connect(roomLevel);air.start();
      }
      if(audio.state==='suspended')audio.resume().catch(()=>{});
    } catch {}
  }

  function preferences(gain, silent) {
    volume=gain;
    muted=silent;
    if(output)output.gain.setTargetAtTime(muted?0:volume,audio.currentTime,.055);
  }

  function region(name, audible) {
    const desired=audible?name:null;
    if(!roomLevel||desired===current)return;
    current=desired;
    const t=audio.currentTime;
    const [low,high,gain]=ambience[name]||ambience.crypt;
    roomLevel.gain.setTargetAtTime(desired?gain:0,t,desired?.45:.09);
    bed[0].frequency.setTargetAtTime(low,t,.55);
    bed[1].frequency.setTargetAtTime(high,t,.63);
    room.frequency.setTargetAtTime(low*3,t,.4);
  }

  function tone(freq=230, duration=.12, type='sine', level=.02, endScale=.6, pan=0) {
    if(!audio||audio.state!=='running'||muted)return;
    const t=audio.currentTime;
    const oscillator=audio.createOscillator();
    const gain=audio.createGain();
    oscillator.type=type;
    oscillator.frequency.setValueAtTime(freq,t);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(24,freq*endScale),t+duration);
    gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(level,t+Math.min(.024,duration/4));
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    oscillator.connect(gain);
    if(pan&&audio.createStereoPanner){
      const stereo=audio.createStereoPanner();
      stereo.pan.value=pan;
      gain.connect(stereo).connect(output);
    }else gain.connect(output);
    oscillator.start(t);oscillator.stop(t+duration);
  }

  function texture(frequency, duration, level, shape='bandpass') {
    if(!noise||audio.state!=='running'||muted)return;
    const t=audio.currentTime;
    const source=audio.createBufferSource();
    const filter=audio.createBiquadFilter();
    const gain=audio.createGain();
    source.buffer=noise;
    filter.type=shape;
    filter.frequency.value=frequency;
    gain.gain.setValueAtTime(level,t);
    gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    source.connect(filter).connect(gain).connect(output);
    source.start(t,Math.random()*.7);source.stop(t+duration);
  }

  function cue(name) {
    switch (name) {
      case 'hollow': texture(510,.28,.22);tone(98,.32,'triangle',.025,1.5);break;
      case 'knight': tone(248,.35,'triangle',.042);tone(513,.21,'sine',.023);break;
      case 'wraith': texture(920,.5,.14);tone(322,.39,'sine',.039,1.35);break;
      case 'drowned': tone(102,.68,'sine',.052);tone(166,.52,'triangle',.026);texture(350,.37,.14);break;
      case 'boss': tone(72,.69,'triangle',.062);tone(98,.84,'sine',.04);break;
      case 'light': texture(1780,.15,.24);break;
      case 'heavy': texture(760,.28,.29);tone(122,.24,'triangle',.042);break;
      case 'impact': texture(370,.14,.34);break;
      case 'block': tone(386,.25,'triangle',.055);tone(615,.19,'sine',.03);break;
      case 'wetStep': texture(740,.18,.34);tone(99,.09,'sine',.029);break;
      case 'step': texture(370,.13,.30);break;
      case 'drip': tone(550,.16,'sine',.035,1.5);tone(157,.28,'sine',.016);break;
      case 'threshold': tone(168,.9,'sine',.035,.82);tone(251,.65,'triangle',.019);break;
      case 'salt': texture(1150,.31,.095);break;
      case 'paper': texture(1400,.65,.063);break;
      case 'branch': texture(610,.8,.065);tone(105,.92,'sine',.012);break;
      case 'star': tone(419,1.2,'sine',.018,1.01);break;
      case 'whisper': texture(910,.95,.18);tone(127,.88,'sine',.014,1.2);break;
    }
  }
  const weaponTimbre={sword:[1780,196],spear:[2320,342],axe:[580,94],needle:[1280,473]};
  function weapon(id,heavy,impact=false){
    const [air,pitch]=weaponTimbre[id];
    texture(impact?air*.39:air,heavy?.22:.12,impact?.25:.16);
    if(impact||heavy||id==='needle')tone(pitch,impact?.19:.14,id==='needle'?'sine':'triangle',.036,impact?.54:1.28);
  }
  const warningPitch={hollow:112,knight:248,wraith:305,drowned:91,boss:69};
  function warning(name,pan){
    const pitch=warningPitch[name]??140;
    tone(pitch,.65,name==='knight'?'triangle':'sine',.038,1.28,pan);
  }
  return { begin, preferences, region, tone, cue, warning, weapon };
})();
