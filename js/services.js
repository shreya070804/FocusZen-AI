/* services.js - Procedural Synthesizers & AI Coach Engines */

(function () {
  const Constants = window.FocusZenConstants;

  // --- AUDIO SYNTHESIZER SERVICE ---
  let audioCtx = null;
  let analyserNode = null;
  let audioStartTime = null;

  const activeNodes = {
    brownnoise: null,
    rain: null,
    forest: null,
    ocean: null,
    cafe: null,
    lofi: null,
    deepambient: null
  };

  const breathingSounds = {
    osc: null,
    gain: null
  };

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (!analyserNode) {
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 256;
      analyserNode.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return { ctx: audioCtx, analyser: analyserNode };
  }

  // --- PROCEDURAL AUDIO SYNTHESIZERS ---
  
  function startSound(soundType) {
    const { ctx, analyser } = getAudioContext();
    if (activeNodes[soundType]) return;

    const gainNode = ctx.createGain();
    const volumeSlider = document.getElementById(`vol-${soundType}`);
    const volume = volumeSlider ? parseFloat(volumeSlider.value) : 0.4;

    let soundNode = null;

    if (soundType === 'brownnoise') {
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; 
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume * 0.35, ctx.currentTime);
      source.connect(filter).connect(gainNode).connect(analyser);
      source.start();
      
      soundNode = { source, filter, gainNode };
    } 
    else if (soundType === 'rain') {
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.Q.setValueAtTime(1.0, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.05, ctx.currentTime); 
      lfoGain.gain.setValueAtTime(200, ctx.currentTime);
      
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();

      gainNode.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
      source.connect(filter).connect(gainNode).connect(analyser);
      source.start();

      let isPlaying = true;
      const triggerSpatter = () => {
        if (!isPlaying) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200 + Math.random() * 800, now);
        
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(volume * 0.05, now + 0.005);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05 + Math.random() * 0.1);
        
        osc.connect(oscGain).connect(analyser);
        osc.start(now);
        osc.stop(now + 0.2);
        
        setTimeout(triggerSpatter, 80 + Math.random() * 250);
      };
      triggerSpatter();

      soundNode = { 
        source, 
        lfo, 
        lfoGain, 
        filter, 
        gainNode, 
        stopExtra: () => { isPlaying = false; } 
      };
    } 
    else if (soundType === 'forest') {
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, ctx.currentTime);
      filter.Q.setValueAtTime(1.0, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.1, ctx.currentTime);
      lfoGain.gain.setValueAtTime(150, ctx.currentTime);
      
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();

      gainNode.gain.setValueAtTime(volume * 0.2, ctx.currentTime);
      source.connect(filter).connect(gainNode).connect(analyser);
      source.start();

      let isPlaying = true;
      const triggerBird = () => {
        if (!isPlaying) return;
        const now = ctx.currentTime;
        const numChirps = 2 + Math.floor(Math.random() * 3);
        let timeOffset = 0;

        for (let j = 0; j < numChirps; j++) {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2000 + Math.random() * 500, now + timeOffset);
          osc.frequency.exponentialRampToValueAtTime(2800 + Math.random() * 400, now + timeOffset + 0.08);
          
          oscGain.gain.setValueAtTime(0, now + timeOffset);
          oscGain.gain.linearRampToValueAtTime(volume * 0.03, now + timeOffset + 0.01);
          oscGain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.08);
          
          osc.connect(oscGain).connect(analyser);
          osc.start(now + timeOffset);
          osc.stop(now + timeOffset + 0.1);
          
          timeOffset += 0.12 + Math.random() * 0.08;
        }

        setTimeout(triggerBird, 4000 + Math.random() * 6000);
      };
      setTimeout(triggerBird, 2000);

      soundNode = { 
        source, 
        lfo, 
        lfoGain, 
        filter, 
        gainNode, 
        stopExtra: () => { isPlaying = false; } 
      };
    } 
    else if (soundType === 'ocean') {
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.18, ctx.currentTime); 
      lfoGain.gain.setValueAtTime(120, ctx.currentTime);
      
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();

      const waveVolumeG = ctx.createGain();
      waveVolumeG.gain.setValueAtTime(0.05, ctx.currentTime);
      
      const volLfo = ctx.createOscillator();
      const volLfoGain = ctx.createGain();
      volLfo.frequency.setValueAtTime(0.18, ctx.currentTime);
      volLfoGain.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
      
      volLfo.connect(volLfoGain).connect(waveVolumeG.gain);
      volLfo.start();

      gainNode.gain.setValueAtTime(0.5, ctx.currentTime); 
      source.connect(filter).connect(waveVolumeG).connect(gainNode).connect(analyser);
      source.start();

      soundNode = { source, lfo, lfoGain, filter, volLfo, volLfoGain, waveVolumeG, gainNode };
    } 
    else if (soundType === 'cafe') {
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.015 * white)) / 1.015;
        lastOut = output[i];
        output[i] *= 4.0;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
      source.connect(filter).connect(gainNode).connect(analyser);
      source.start();

      let isPlaying = true;
      const triggerClink = () => {
        if (!isPlaying) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const oscFilter = ctx.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2500 + Math.random() * 1500, now);
        
        oscFilter.type = 'bandpass';
        oscFilter.frequency.setValueAtTime(3000, now);
        oscFilter.Q.setValueAtTime(3.0, now);

        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(volume * 0.025, now + 0.002);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        
        osc.connect(oscFilter).connect(oscGain).connect(analyser);
        osc.start(now);
        osc.stop(now + 0.1);
        
        setTimeout(triggerClink, 2000 + Math.random() * 5000);
      };
      setTimeout(triggerClink, 1500);

      soundNode = { source, filter, gainNode, stopExtra: () => { isPlaying = false; } };
    } 
    else if (soundType === 'lofi') {
      let isPlaying = true;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const oscGain1 = ctx.createGain();
      
      osc1.type = 'triangle';
      osc2.type = 'sine';
      
      osc1.frequency.setValueAtTime(130.81, ctx.currentTime); 
      osc2.frequency.setValueAtTime(196.00, ctx.currentTime); 

      oscGain1.gain.setValueAtTime(volume * 0.12, ctx.currentTime);
      osc1.connect(oscGain1);
      osc2.connect(oscGain1);
      oscGain1.connect(analyser);
      
      osc1.start();
      osc2.start();

      const chordNotes = [
        [130.81, 164.81, 196.00, 246.94], 
        [146.83, 174.61, 220.00, 261.63], 
        [164.81, 196.00, 246.94, 293.66], 
        [130.81, 164.81, 196.00, 246.94]  
      ];
      let chordIdx = 0;

      const triggerArp = () => {
        if (!isPlaying) return;
        const now = ctx.currentTime;
        const chord = chordNotes[chordIdx];
        
        chord.forEach((freq, idx) => {
          const oscArp = ctx.createOscillator();
          const gainArp = ctx.createGain();
          
          oscArp.type = 'triangle';
          oscArp.frequency.setValueAtTime(freq, now + idx * 0.3);
          
          gainArp.gain.setValueAtTime(0, now + idx * 0.3);
          gainArp.gain.linearRampToValueAtTime(volume * 0.05, now + idx * 0.3 + 0.05);
          gainArp.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.3 + 0.8);
          
          oscArp.connect(gainArp).connect(analyser);
          oscArp.start(now + idx * 0.3);
          oscArp.stop(now + idx * 0.3 + 1.2);
        });

        chordIdx = (chordIdx + 1) % chordNotes.length;
        setTimeout(triggerArp, 2500);
      };
      triggerArp();

      const triggerCrackle = () => {
        if (!isPlaying) return;
        const now = ctx.currentTime;
        if (Math.random() > 0.4) {
          const clickOsc = ctx.createOscillator();
          const clickGain = ctx.createGain();
          
          clickOsc.type = 'sawtooth';
          clickOsc.frequency.setValueAtTime(4000 + Math.random() * 4000, now);
          
          clickGain.gain.setValueAtTime(0, now);
          clickGain.gain.linearRampToValueAtTime(volume * 0.008, now + 0.001);
          clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.004);
          
          clickOsc.connect(clickGain).connect(analyser);
          clickOsc.start(now);
          clickOsc.stop(now + 0.01);
        }
        setTimeout(triggerCrackle, 50 + Math.random() * 200);
      };
      triggerCrackle();

      gainNode.gain.setValueAtTime(volume * 0.25, ctx.currentTime);
      gainNode.connect(analyser); 

      soundNode = { 
        osc1, 
        osc2, 
        oscGain1,
        gainNode,
        stopExtra: () => { 
          isPlaying = false; 
          try {
            osc1.stop();
            osc2.stop();
          } catch(e) {}
        } 
      };
    } 
    else if (soundType === 'deepambient') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const osc4 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc3.type = 'triangle';
      osc4.type = 'sine';
      
      osc1.frequency.setValueAtTime(110.00, ctx.currentTime); 
      osc2.frequency.setValueAtTime(165.00, ctx.currentTime); 
      osc3.frequency.setValueAtTime(220.00, ctx.currentTime); 
      osc4.frequency.setValueAtTime(277.18, ctx.currentTime); 

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, ctx.currentTime);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.06, ctx.currentTime); 
      lfoGain.gain.setValueAtTime(80, ctx.currentTime);
      
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();

      gainNode.gain.setValueAtTime(volume * 0.35, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      osc4.connect(filter);
      filter.connect(gainNode).connect(analyser);

      osc1.start();
      osc2.start();
      osc3.start();
      osc4.start();

      soundNode = { osc1, osc2, osc3, osc4, lfo, lfoGain, filter, gainNode };
    }

    if (soundNode) {
      activeNodes[soundType] = soundNode;
    }
  }

  function stopSound(soundType) {
    const node = activeNodes[soundType];
    if (node) {
      try {
        if (node.source) node.source.stop();
        if (node.osc1) node.osc1.stop();
        if (node.osc2) node.osc2.stop();
        if (node.osc3) node.osc3.stop();
        if (node.osc4) node.osc4.stop();
        if (node.lfo) node.lfo.stop();
        if (node.volLfo) node.volLfo.stop();
        if (node.stopExtra) node.stopExtra();
      } catch (e) {}
      activeNodes[soundType] = null;
    }
  }

  function adjustVolume(soundType, val) {
    const { ctx } = getAudioContext();
    const node = activeNodes[soundType];
    if (node && node.gainNode) {
      let factor = 0.35;
      if (soundType === 'rain') factor = 0.25;
      else if (soundType === 'forest') factor = 0.2;
      else if (soundType === 'ocean') factor = 0.25;
      else if (soundType === 'cafe') factor = 0.4;
      else if (soundType === 'lofi') factor = 0.25;
      else if (soundType === 'deepambient') factor = 0.35;
      
      node.gainNode.gain.setValueAtTime(val * factor, ctx.currentTime);
    }
  }

  function stopAllSoundscapes() {
    Object.keys(activeNodes).forEach(id => {
      stopSound(id);
    });
  }

  // --- GUIDED BREATHING AUDIO SYNTHESIZERS ---
  
  function playBreathingSound(stateName) {
    const { ctx, analyser } = getAudioContext();
    stopBreathingSound();

    if (ctx.state === 'suspended') return;

    const now = ctx.currentTime;

    if (stateName === 'inhale') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(440, now + 4);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 2);
      
      osc.connect(gain).connect(analyser);
      osc.start(now);

      breathingSounds.osc = osc;
      breathingSounds.gain = gain;
    } else if (stateName === 'hold') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(1.5, now);
      lfoGain.gain.setValueAtTime(3, now);
      
      lfo.connect(lfoGain).connect(osc.frequency);
      lfo.start(now);

      gain.gain.setValueAtTime(0.08, now);
      
      osc.connect(gain).connect(analyser);
      osc.start(now);
      
      breathingSounds.osc = osc;
      breathingSounds.osc.lfo = lfo;
      breathingSounds.osc.lfoGain = lfoGain;
      breathingSounds.gain = gain;
    } else if (stateName === 'exhale') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(220, now + 4);
      
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4);
      
      osc.connect(gain).connect(analyser);
      osc.start(now);

      breathingSounds.osc = osc;
      breathingSounds.gain = gain;
    } else if (stateName === 'empty-hold') {
      const bufferSize = ctx.sampleRate * 4;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.linearRampToValueAtTime(150, now + 4);
      filter.Q.setValueAtTime(1.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 4);

      noiseNode.connect(filter).connect(gain).connect(analyser);
      noiseNode.start(now);
      
      breathingSounds.osc = noiseNode;
      breathingSounds.osc.filter = filter;
      breathingSounds.gain = gain;
    }
  }

  function stopBreathingSound() {
    if (breathingSounds.osc) {
      try {
        breathingSounds.osc.stop();
        if (breathingSounds.osc.lfo) breathingSounds.osc.lfo.stop();
        if (breathingSounds.osc.lfo) breathingSounds.osc.lfo.disconnect();
        if (breathingSounds.osc.lfoGain) breathingSounds.osc.lfoGain.disconnect();
        if (breathingSounds.osc.filter) breathingSounds.osc.filter.disconnect();
      } catch(e) {}
      breathingSounds.osc = null;
    }
    if (breathingSounds.gain) {
      try { breathingSounds.gain.disconnect(); } catch(e) {}
      breathingSounds.gain = null;
    }
  }

  // --- PROGRESSION CHIMES & ALERTS ---

  function playNotificationChime() {
    const { ctx, analyser } = getAudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    
    osc.connect(gainNode).connect(analyser);
    osc.start(now);
    osc.stop(now + 0.5);
    
    setTimeout(() => {
      try { osc.disconnect(); gainNode.disconnect(); } catch(e) {}
    }, 600);
  }

  function playLevelChime() {
    const { ctx, analyser } = getAudioContext();
    const now = ctx.currentTime;
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gainNode.gain.setValueAtTime(0, now + idx * 0.08);
      gainNode.gain.linearRampToValueAtTime(0.06, now + idx * 0.08 + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);
      
      osc.connect(gainNode).connect(analyser);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
      
      setTimeout(() => {
        try { osc.disconnect(); gainNode.disconnect(); } catch(e) {}
      }, 1000);
    });
  }

  function playUnlockChime() {
    const { ctx, analyser } = getAudioContext();
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gainNode.gain.setValueAtTime(0, now + idx * 0.06);
      gainNode.gain.linearRampToValueAtTime(0.08, now + idx * 0.06 + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.25);
      
      osc.connect(gainNode).connect(analyser);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
      
      setTimeout(() => {
        try { osc.disconnect(); gainNode.disconnect(); } catch(e) {}
      }, 1000);
    });
  }

  // --- GEMINI REST CLIENT UPLINK SERVICE ---

  async function callGeminiAPI(prompt, systemInstruction = Constants.SYSTEM_COACH_INSTRUCTION) {
    // Get key dynamically from active state settings
    const settings = window.FocusZenState.state.settings;
    const apiKey = settings.geminiKey || "";
    if (!apiKey) {
      throw new Error("GEMINI_KEY_MISSING");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ]
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP_ERROR_${response.status}`);
    }

    const responseData = await response.json();
    const responseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("EMPTY_RESPONSE");
    }

    return responseText.trim();
  }

  // --- OFFLINE/DEMO HIGH-FIDELITY CONTEXT-AWARE COACH SERVICE ---

  function generateDynamicOfflineInsight(state) {
    const focusSessions = state.history.filter(item => item.type === 'focus');
    const completed = focusSessions.filter(item => item.status === 'completed');
    const interrupted = focusSessions.filter(item => item.status === 'interrupted');
    const totalWeeklyHours = state.weeklyHours ? state.weeklyHours.reduce((a, b) => a + b, 0) : 0;

    let insightText = "";
    
    if (state.streak >= 5) {
      insightText += `**Streak Champion**: You have maintained an amazing **${state.streak}-day focus streak**! Keeping a consistent daily routine is the secret to building lasting habits. Great job, Shreya! \n\n`;
    } else if (state.streak > 0) {
      insightText += `**Streak Active**: You are on a **${state.streak}-day focus streak**! Completing one mindful session today will keep your momentum going and help you build strong consistency. \n\n`;
    } else {
      insightText += `**Welcome Back**: Let's start a fresh focus streak today! Even a short 15-minute session can help recenter your mind and kickstart your productivity. \n\n`;
    }

    if (interrupted.length > 0) {
      insightText += `**Focus Recovery**: We noticed you had a brief interruption in your recent focus logs. Don't worry at all—distractions happen to everyone. To help stay in flow, try using our **Rain Sounds** focus sound and starting a quick breathing session beforehand. \n\n`;
    } else {
      insightText += `**Excellent Focus Flow**: Incredible! Your recent focus sessions show zero interruptions. You are doing a fantastic job shielding your attention from distractions. \n\n`;
    }

    if (totalWeeklyHours > 0) {
      insightText += `**Productivity Trend**: You have focused for **${totalWeeklyHours.toFixed(1)} hours** this week. Your most productive window is between **8:30 AM and 11:00 AM**. Try locking in your deep work sessions during these peak hours for maximum ease.`;
    } else {
      insightText += `**Focus Sounds**: Using a focus sound like **Rain Sounds** or **Ocean Waves** is shown to help increase average session duration by **18%**. Give them a try on your next timer!`;
    }

    return insightText;
  }

  function generateOfflineCoachReply(query, state) {
    const lowerQuery = query.toLowerCase();
    const focusSessions = state.history.filter(item => item.type === 'focus');
    const completed = focusSessions.filter(item => item.status === 'completed');
    const interrupted = focusSessions.filter(item => item.status === 'interrupted');

    // Calculate time of day greeting
    const hours = new Date().getHours();
    let timeOfDay = "day";
    if (hours < 12) timeOfDay = "morning";
    else if (hours < 17) timeOfDay = "afternoon";
    else timeOfDay = "evening";

    // Streak tier message
    let streakText = "";
    if (state.streak >= 8) {
      streakText = `Your outstanding ${state.streak}-day streak shows amazing mastery.`;
    } else if (state.streak >= 5) {
      streakText = `Your consistent ${state.streak}-day streak is very impressive.`;
    } else if (state.streak > 0) {
      streakText = `You are building momentum on a nice ${state.streak}-day focus streak.`;
    } else {
      streakText = "Let's start a fresh focus streak together today.";
    }

    // Focus Score level analysis
    let scoreAnalysis = "";
    if (state.zenScore > 90) {
      scoreAnalysis = `With your exceptionally high Focus Score of ${state.zenScore}%, you are in absolute flow.`;
    } else if (state.zenScore >= 75) {
      scoreAnalysis = `Your Focus Score is looking strong at ${state.zenScore}%. You have solid, stable concentration.`;
    } else {
      scoreAnalysis = `Your Focus Score is currently at ${state.zenScore}%. Taking short rest periods and using our Focus Sounds will help you align and build it up.`;
    }

    if (lowerQuery.includes('streak') || lowerQuery.includes('progress') || lowerQuery.includes('how am i') || lowerQuery.includes('status')) {
      return `Good ${timeOfDay}, Shreya! ${streakText} ${scoreAnalysis} Keep up this healthy, mindful momentum!`;
    }

    if (lowerQuery.includes('distract') || lowerQuery.includes('interrupt') || lowerQuery.includes('focus') || lowerQuery.includes('study') || lowerQuery.includes('work')) {
      if (interrupted.length > 0) {
        return `It is completely natural to get distracted occasionally—you have ${interrupted.length} interrupted sessions. I recommend starting with a quick 1-minute box breathing session and turning on our 'Rain Sounds' focus sound to mask background noise.`;
      } else {
        return `Your focus is wonderfully steady right now with zero recent interruptions! If you start to feel tired this ${timeOfDay}, try a short resting break or our 'Ocean Waves' focus sound to reset.`;
      }
    }

    if (lowerQuery.includes('breath') || lowerQuery.includes('anxious') || lowerQuery.includes('stress') || lowerQuery.includes('relax') || lowerQuery.includes('calm') || lowerQuery.includes('tired')) {
      return `Taking a moment to pause is a sign of great productivity. I highly recommend our Mindful Breathing exercise right now. Even 1 minute of rhythmic breathing will calm your nervous system and bring instant clarity to your ${timeOfDay}.`;
    }

    // Default customized context-aware greeting
    return `Happy ${timeOfDay}, Shreya! I see your focus score is at ${state.zenScore}% with a ${state.streak}-day streak. Tell me, are you looking to stay focused, take a relaxing break, or check your wellness logs right now?`;
  }

  // Export Services Namespace
  window.FocusZenServices = {
    getAudioContext,
    startSound,
    stopSound,
    adjustVolume,
    stopAllSoundscapes,
    playBreathingSound,
    stopBreathingSound,
    playNotificationChime,
    playLevelChime,
    playUnlockChime,
    callGeminiAPI,
    generateDynamicOfflineInsight,
    generateOfflineCoachReply
  };
})();
