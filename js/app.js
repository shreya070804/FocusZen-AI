/* app.js - Main Application Coordinator & Event Binder */

document.addEventListener("DOMContentLoaded", () => {
  const Constants = window.FocusZenConstants;
  const Storage = window.FocusZenStorage;
  const Utils = window.FocusZenUtils;
  const Services = window.FocusZenServices;
  const State = window.FocusZenState;
  const Components = window.FocusZenComponents;

  // Initialize Lucide Glowing Vectors
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Bind state and component systems reactively
  Components.initializeUIBindings();

  // --- DYNAMIC NAV ROUTER ---
  const screens = {
    home: document.getElementById('screen-home'),
    analytics: document.getElementById('screen-analytics'),
    wellness: document.getElementById('screen-wellness'),
    history: document.getElementById('screen-history'),
    auth: document.getElementById('screen-auth'),
    settings: document.getElementById('screen-settings'),
    notifications: document.getElementById('screen-notifications')
  };

  const navItems = {
    home: document.getElementById('nav-home'),
    analytics: document.getElementById('nav-analytics'),
    wellness: document.getElementById('nav-wellness'),
    history: document.getElementById('nav-history')
  };

  const navigateTo = (tabName) => {
    // If not authenticated, force lock to 'auth'
    if (!State.state.currentUser && tabName !== 'auth') {
      tabName = 'auth';
    }
    
    State.state.currentTab = tabName;
    
    // Toggle bottom navigation display
    const bottomNav = document.querySelector('.bottom-nav');
    if (bottomNav) {
      if (tabName === 'auth' || tabName === 'settings') {
        bottomNav.style.display = 'none';
      } else {
        bottomNav.style.display = 'flex';
      }
    }
    
    // Toggle screen visual active tags
    Object.keys(screens).forEach(key => {
      if (screens[key]) {
        if (key === tabName) {
          screens[key].classList.add('active');
        } else {
          screens[key].classList.remove('active');
        }
      }
    });

    Object.keys(navItems).forEach(key => {
      if (navItems[key]) {
        if (key === tabName) {
          navItems[key].classList.add('active');
        } else {
          navItems[key].classList.remove('active');
        }
      }
    });

    // Screen-specific hooks
    if (tabName === 'home') {
      Components.animateZenRing(State.state.zenScore);
    } else if (tabName === 'analytics') {
      Components.drawWeeklyChart(State.state.weeklyHours);
    } else if (tabName === 'history') {
      Components.renderHistoryList(State.state.history);
    }
  };

  const setupNavigation = () => {
    Object.keys(navItems).forEach(key => {
      if (navItems[key]) {
        navItems[key].addEventListener('click', () => navigateTo(key));
      }
    });
  };

  // --- HOME SCORE RECALIBRATOR ---
  const setupScoreRecalibrate = () => {
    const button = document.getElementById('zen-ring-trigger');
    if (!button) return;

    button.addEventListener('click', () => {
      const scoreNum = document.getElementById('zen-score-value');
      const badgeText = document.getElementById('zen-status-text');
      const ring = document.getElementById('zen-ring-fill');
      
      if (!scoreNum || !badgeText || !ring) return;

      badgeText.innerText = "CALCULATING FOCUS SCORE...";
      scoreNum.style.filter = "blur(1px)";
      
      let counter = 0;
      const interval = setInterval(() => {
        scoreNum.innerText = Math.round(Math.random() * 99) + "%";
        ring.style.strokeDashoffset = Math.random() * 534;
        counter++;
        
        if (counter > 25) {
          clearInterval(interval);
          
          // Generate new high focus score
          const finalScore = Math.floor(Math.random() * 8) + 91;
          State.state.zenScore = finalScore;
          State.saveState();
          
          scoreNum.style.filter = "none";
          badgeText.innerText = "YOUR FOCUS PATTERNS ARE READY";
          
          Components.animateZenRing(finalScore);
          State.unlockAchievement('quantum_harmonizer');
          State.notify();
        }
      }, 60);
    });
  };

  // --- AI INSIGHT REFRESH TYPEWRITER ---
  const typewriteInsight = (text) => {
    const textContainer = document.getElementById('ai-insight-text');
    if (!textContainer) return;

    textContainer.innerHTML = '';
    let index = 0;
    const speed = 20;

    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const tempElement = document.createElement('div');
    tempElement.innerHTML = formattedText;
    
    const childNodes = Array.from(tempElement.childNodes);
    let currentChildIndex = 0;
    let currentCharIndex = 0;
    
    const typeNextChar = () => {
      if (currentChildIndex >= childNodes.length) {
        const refreshBtn = document.getElementById('ai-sync-btn');
        if (refreshBtn) refreshBtn.classList.remove('spinning');
        return;
      }
      
      const node = childNodes[currentChildIndex];
      
      if (node.nodeType === Node.TEXT_NODE) {
        if (currentCharIndex < node.textContent.length) {
          textContainer.appendChild(document.createTextNode(node.textContent[currentCharIndex]));
          currentCharIndex++;
          setTimeout(typeNextChar, speed);
        } else {
          currentChildIndex++;
          currentCharIndex = 0;
          setTimeout(typeNextChar, speed);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        let boldWrapper = textContainer.querySelector('.typing-bold-wrap');
        if (!boldWrapper) {
          boldWrapper = document.createElement('strong');
          boldWrapper.className = 'typing-bold-wrap';
          textContainer.appendChild(boldWrapper);
        }
        
        if (currentCharIndex < node.textContent.length) {
          boldWrapper.appendChild(document.createTextNode(node.textContent[currentCharIndex]));
          currentCharIndex++;
          setTimeout(typeNextChar, speed);
        } else {
          boldWrapper.className = '';
          currentChildIndex++;
          currentCharIndex = 0;
          setTimeout(typeNextChar, speed);
        }
      }
    };
    
    typeNextChar();
  };

  const regenerateInsight = async () => {
    const refreshBtn = document.getElementById('ai-sync-btn');
    if (refreshBtn) refreshBtn.classList.add('spinning');

    const textContainer = document.getElementById('ai-insight-text');
    if (textContainer) {
      textContainer.innerText = "Analyzing focus logs and preparing tips...";
    }

    if (State.state.settings.geminiKey) {
      try {
        const historyContext = State.state.history.slice(0, 10).map(item => 
          `- ${item.title} (${item.type}): duration=${item.duration}, status=${item.status}, score=${item.focusScore || "N/A"}`
        ).join("\n");

        const prompt = `User current Focus score: ${State.state.zenScore}%. Streak: ${State.state.streak} days.
Recent history context:
${historyContext}

Generate 3 dynamic, mindful focus tips analyzing these trends, providing friendly encouragement. Format each bullet point as a markdown paragraph. Start each bullet point with simple, warm bold highlights like '**Best Focus Time**:' or '**Soundscape Tip**:'. Keep the tone extremely friendly, modern, lifestyle-focused, and warm (like Headspace). Avoid sci-fi, robotic, or technical terminology. Max 3 concise sentences total in output.`;

        const response = await Services.callGeminiAPI(prompt);
        typewriteInsight(response);
      } catch (e) {
        console.error("Gemini insights sync failed:", e);
        const randomIndex = Math.floor(Math.random() * Constants.AI_INSIGHTS.length);
        typewriteInsight(Constants.AI_INSIGHTS[randomIndex]);
      }
    } else {
      // Offline fallback
      setTimeout(() => {
        const dynamicInsightText = Services.generateDynamicOfflineInsight(State.state);
        typewriteInsight(dynamicInsightText + "\n\n**Demo Mode Tip**: Enter your Gemini key in Settings to unlock personalized real-time AI insights.");
      }, 700);
    }
  };

  const setupAiRefresh = () => {
    const btn = document.getElementById('ai-sync-btn');
    if (btn) {
      btn.addEventListener('click', regenerateInsight);
    }
  };

  // --- INTERACTIVE AI COACH CHAT CONTROL ---
  const initAIChatSystem = () => {
    const tabCoach = document.getElementById('ai-tab-coach');
    const tabInsights = document.getElementById('ai-tab-insights');
    const chatContainer = document.getElementById('ai-chat-container');
    const insightsContainer = document.getElementById('ai-insights-container');
    const cardTitle = document.getElementById('ai-card-title');

    const chatInput = document.getElementById('ai-chat-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const chatViewport = document.getElementById('ai-chat-viewport');

    if (tabCoach && tabInsights && chatContainer && insightsContainer) {
      tabCoach.addEventListener('click', () => {
        tabCoach.classList.add('active');
        tabCoach.style.borderColor = 'var(--neon-blue)';
        tabCoach.style.background = 'rgba(6, 182, 212, 0.1)';
        tabCoach.style.color = 'var(--text-primary)';

        tabInsights.classList.remove('active');
        tabInsights.style.borderColor = 'rgba(255,255,255,0.06)';
        tabInsights.style.background = 'transparent';
        tabInsights.style.color = 'var(--text-secondary)';

        chatContainer.style.display = 'block';
        chatContainer.classList.add('active');
        insightsContainer.style.display = 'none';
        insightsContainer.classList.remove('active');

        if (cardTitle) cardTitle.innerText = "FOCUSZEN AI • COACH";
      });

      tabInsights.addEventListener('click', () => {
        tabInsights.classList.add('active');
        tabInsights.style.borderColor = 'var(--neon-blue)';
        tabInsights.style.background = 'rgba(6, 182, 212, 0.1)';
        tabInsights.style.color = 'var(--text-primary)';

        tabCoach.classList.remove('active');
        tabCoach.style.borderColor = 'rgba(255,255,255,0.06)';
        tabCoach.style.background = 'transparent';
        tabCoach.style.color = 'var(--text-secondary)';

        insightsContainer.style.display = 'block';
        insightsContainer.classList.add('active');
        chatContainer.style.display = 'none';
        chatContainer.classList.remove('active');

        if (cardTitle) cardTitle.innerText = "FOCUSZEN AI • COACH";
      });
    }

    const appendMessage = (sender, text) => {
      if (!chatViewport) return null;
      
      const msgDiv = document.createElement('div');
      msgDiv.className = `ai-msg ${sender}`;
      
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'ai-msg-avatar';
      avatarDiv.innerHTML = sender === 'coach' 
        ? `<i data-lucide="sparkles" style="width:12px; height:12px;"></i>`
        : `<i data-lucide="user" style="width:12px; height:12px;"></i>`;
        
      const textDiv = document.createElement('div');
      textDiv.className = 'ai-msg-text';
      textDiv.innerText = text;
      
      msgDiv.appendChild(avatarDiv);
      msgDiv.appendChild(textDiv);
      chatViewport.appendChild(msgDiv);
      
      if (window.lucide) window.lucide.createIcons();
      chatViewport.scrollTop = chatViewport.scrollHeight;

      return textDiv;
    };

    const appendTypingIndicator = () => {
      if (!chatViewport) return null;
      
      const indicatorDiv = document.createElement('div');
      indicatorDiv.className = 'ai-msg coach typing-indicator-msg';
      
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'ai-msg-avatar';
      avatarDiv.innerHTML = `<i data-lucide="sparkles" style="width:12px; height:12px;"></i>`;
      
      const textDiv = document.createElement('div');
      textDiv.className = 'ai-msg-text';
      textDiv.style.padding = '4px 8px';
      textDiv.innerHTML = `
        <div class="ai-typing-indicator">
          <div class="ai-typing-dot"></div>
          <div class="ai-typing-dot"></div>
          <div class="ai-typing-dot"></div>
        </div>
      `;
      
      indicatorDiv.appendChild(avatarDiv);
      indicatorDiv.appendChild(textDiv);
      chatViewport.appendChild(indicatorDiv);
      
      if (window.lucide) window.lucide.createIcons();
      chatViewport.scrollTop = chatViewport.scrollHeight;
      
      return indicatorDiv;
    };

    const handleSend = async () => {
      const query = chatInput.value.trim();
      if (!query) return;

      appendMessage('user', query);
      chatInput.value = '';

      State.state.chatLog.push({ role: 'user', content: query });

      const typingIndicator = appendTypingIndicator();

      if (State.state.settings.geminiKey) {
        try {
          const memory = State.state.chatLog.slice(-6).map(m => 
            `${m.role === 'user' ? 'Shreya' : 'Coach'}: ${m.content}`
          ).join("\n");

          const prompt = `User metrics context: Focus score is ${State.state.zenScore}%, streak is ${State.state.streak} days, focus history has ${State.state.history.filter(h => h.status === 'completed').length} completed sessions.
Conversational log memory:
${memory}

Shreya's query: "${query}"

Provide your professional coaching response. Respond in a warm, encouraging, and mindful tone. Keep the answer extremely concise (max 3 sentences) and conversational. Do not use robotic or technical jargon.`;

          const response = await Services.callGeminiAPI(prompt);
          
          if (typingIndicator) typingIndicator.remove();

          const textDiv = appendMessage('coach', '');
          State.state.chatLog.push({ role: 'model', content: response });

          let charIndex = 0;
          const typeSpeed = 15;
          const typeText = () => {
            if (charIndex < response.length) {
              textDiv.appendChild(document.createTextNode(response[charIndex]));
              charIndex++;
              chatViewport.scrollTop = chatViewport.scrollHeight;
              setTimeout(typeText, typeSpeed);
            }
          };
          typeText();

        } catch (e) {
          console.error("Gemini chat error:", e);
          if (typingIndicator) typingIndicator.remove();
          appendMessage('coach', "Sorry, I'm having trouble connecting to the server. Let's try again in a moment!");
        }
      } else {
        // Dynamic offline context-aware fallback
        setTimeout(() => {
          if (typingIndicator) typingIndicator.remove();
          const reply = Services.generateOfflineCoachReply(query, State.state);
          appendMessage('coach', reply);
        }, 1000);
      }
    };

    if (sendBtn && chatInput) {
      sendBtn.addEventListener('click', handleSend);
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleSend();
        }
      });
    }
  };

  // --- guided BREATHING PACER COACH ---
  let breathingInterval = null;
  let breathingTimer = null;
  let breathingTimerRemaining = 60;
  let breathingActive = false;

  const setupBreathingCoach = () => {
    const breathBtn = document.getElementById('wellness-breath-btn');
    if (breathBtn) {
      breathBtn.addEventListener('click', startBreathingPortal);
    }
    
    const closeBtn = document.getElementById('breathing-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', stopBreathingPortal);
    }

    const actionBtn = document.getElementById('breathing-portal-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', stopBreathingPortal);
    }
  };

  const startBreathingPortal = () => {
    Services.getAudioContext();
    breathingActive = true;
    breathingTimerRemaining = 60;
    
    const portal = document.getElementById('breathing-portal');
    const actionBtn = document.getElementById('breathing-portal-action');
    
    if (portal) {
      portal.style.display = 'flex';
      portal.classList.add('active');
    }
    
    if (actionBtn) {
      actionBtn.innerText = 'Pause Breathing';
      actionBtn.className = 'portal-btn pause';
    }

    updateBreathingTimerDisplay(breathingTimerRemaining);

    const steps = [
      { state: 'inhale', text: 'Breathe In', sub: 'Slowly fill your lungs with fresh air' },
      { state: 'hold', text: 'Hold', sub: 'Rest in a moment of quiet stillness' },
      { state: 'exhale', text: 'Breathe Out', sub: 'Gently let go of tension and stress' },
      { state: 'empty-hold', text: 'Hold', sub: 'Enjoy the calm space between breaths' }
    ];
    
    let currentIdx = 0;
    const orb = document.getElementById('breathing-orb');
    const stateText = document.getElementById('breathing-portal-state');
    const subText = document.getElementById('breathing-portal-sub');

    const runStep = () => {
      if (!breathingActive) return;

      const step = steps[currentIdx];
      
      if (orb) {
        orb.className = 'breathing-orb-sphere';
        orb.classList.add(step.state);
      }
      
      if (stateText) stateText.innerText = step.text;
      if (subText) subText.innerText = step.sub;

      if (State.state.settings.soundEnabled) {
        Services.playBreathingSound(step.state);
      }

      currentIdx = (currentIdx + 1) % steps.length;
      breathingInterval = setTimeout(runStep, 4000);
    };

    runStep();

    breathingTimer = setInterval(() => {
      breathingTimerRemaining--;
      updateBreathingTimerDisplay(breathingTimerRemaining);

      if (breathingTimerRemaining <= 0) {
        completeBreathingSession();
      }
    }, 1000);
  };

  const updateBreathingTimerDisplay = (seconds) => {
    const timerEl = document.getElementById('breathing-portal-timer');
    if (timerEl) {
      timerEl.innerText = Utils.formatTime(seconds);
    }
  };

  const stopBreathingPortal = () => {
    breathingActive = false;
    
    if (breathingInterval) {
      clearTimeout(breathingInterval);
      breathingInterval = null;
    }
    if (breathingTimer) {
      clearInterval(breathingTimer);
      breathingTimer = null;
    }

    Services.stopBreathingSound();

    const portal = document.getElementById('breathing-portal');
    if (portal) {
      portal.style.display = 'none';
      portal.classList.remove('active');
    }
  };

  const completeBreathingSession = () => {
    stopBreathingPortal();
    State.gainXP(25);
    
    const dateText = "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const logItem = {
      id: Date.now(),
      title: 'Deep Breath Alignment',
      time: dateText,
      duration: '1m',
      status: 'completed',
      focusScore: `${State.state.zenScore}%`,
      type: 'breathing'
    };
    State.state.history.unshift(logItem);
    State.saveState();
    
    State.triggerNotification(
      'break',
      'Breathing Exercise Complete',
      'Great job! You completed a mindful breathing session. (+25 XP earned)'
    );
  };

  // --- IMMERSIVE POMODORO FOCUS TIMER ---
  const focusPortal = document.getElementById('focus-portal');
  const startSessionBtn = document.getElementById('start-focus-btn');
  const closePortalBtn = document.getElementById('portal-close');
  const pausePortalBtn = document.getElementById('portal-pause');
  const cancelPortalBtn = document.getElementById('portal-cancel');

  const updateCountdownDisplay = (seconds) => {
    const timeDisplay = document.getElementById('portal-time-display');
    if (timeDisplay) {
      timeDisplay.innerText = Utils.formatTime(seconds);
    }
  };

  let portalBreathingInterval = null;
  const runPortalBreathingSphere = () => {
    const ring = document.getElementById('portal-breath-ring');
    if (!ring) return;

    const steps = ['inhale', 'hold', 'exhale'];
    let idx = 0;

    const stepDuration = 4000;
    const runStep = () => {
      ring.className = 'portal-breathing-ring';
      ring.classList.add(steps[idx]);
      idx = (idx + 1) % steps.length;
      portalBreathingInterval = setTimeout(runStep, stepDuration);
    };

    runStep();
  };

  const updatePortalProgressRing = () => {
    const ring = document.getElementById('portal-ring-fill');
    if (!ring) return;
    const circumference = 590.6;
    const percent = State.state.timerRemaining / State.state.timerDuration;
    const offset = circumference - (circumference * percent);
    ring.style.strokeDashoffset = offset;
  };

  const startFocusTimer = (category) => {
    State.state.activeCategory = category || 'deep-work';
    State.state.timerRemaining = State.state.timerDuration;
    State.state.timerPaused = false;
    State.state.focusActive = true;
    
    updateCountdownDisplay(State.state.timerRemaining);
    updatePortalProgressRing();
    runPortalBreathingSphere();
    Storage.saveActiveSession({
      remaining: State.state.timerRemaining,
      duration: State.state.timerDuration,
      paused: State.state.timerPaused,
      timestamp: Date.now()
    });

    // Auto-enable Rain Sounds if sound is muted and focus sounds allowed
    if (State.state.settings.soundEnabled && 
        !State.state.ambientSoundActive.brownnoise && 
        !State.state.ambientSoundActive.rain &&
        !State.state.ambientSoundActive.ocean &&
        !State.state.ambientSoundActive.lofi) {
      const defaultToggle = document.getElementById('toggle-rain');
      if (defaultToggle) {
        defaultToggle.checked = true;
        toggleSound('rain', true);
      }
    }

    State.state.timerInterval = setInterval(() => {
      if (!State.state.timerPaused) {
        State.state.timerRemaining--;
        updateCountdownDisplay(State.state.timerRemaining);
        updatePortalProgressRing();
        
        Storage.saveActiveSession({
          remaining: State.state.timerRemaining,
          duration: State.state.timerDuration,
          paused: State.state.timerPaused,
          timestamp: Date.now()
        });

        if (State.state.timerRemaining <= 0) {
          completeFocusSession();
        }
      }
    }, 1000);
  };

  const stopFocusTimer = () => {
    clearInterval(State.state.timerInterval);
    State.state.timerInterval = null;
    clearTimeout(portalBreathingInterval);
    portalBreathingInterval = null;
    State.state.focusActive = false;
  };

  const pauseFocusTimer = () => {
    State.state.timerPaused = true;
    Storage.saveActiveSession({
      remaining: State.state.timerRemaining,
      duration: State.state.timerDuration,
      paused: State.state.timerPaused,
      timestamp: Date.now()
    });
    if (pausePortalBtn) {
      pausePortalBtn.innerText = 'RESUME FOCUS';
      pausePortalBtn.className = 'portal-btn resume';
    }
  };

  const resumeFocusTimer = () => {
    State.state.timerPaused = false;
    Storage.saveActiveSession({
      remaining: State.state.timerRemaining,
      duration: State.state.timerDuration,
      paused: State.state.timerPaused,
      timestamp: Date.now()
    });
    if (pausePortalBtn) {
      pausePortalBtn.innerText = 'PAUSE SECURE';
      pausePortalBtn.className = 'portal-btn pause';
    }
  };

  const cancelFocusSession = () => {
    stopFocusTimer();
    Storage.clearActiveSession();
    
    // Log interrupted session in history with actual elapsed time!
    const elapsedSecs = State.state.timerDuration - State.state.timerRemaining;
    const elapsedMins = Math.floor(elapsedSecs / 60);
    const dateText = "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const categoryTitles = {
      'deep-work': 'Deep Work Focus',
      'study': 'Study Session',
      'coding': 'Coding Sprint',
      'reading': 'Reading Flow',
      'meditation': 'Mindful Meditation'
    };
    const activeCat = State.state.activeCategory || 'deep-work';
    const logTitle = (categoryTitles[activeCat] || 'Focus Session') + ' (Interrupted)';

    const logItem = {
      id: Date.now(),
      title: logTitle,
      time: dateText,
      duration: `${elapsedMins}m`,
      status: 'interrupted',
      focusScore: '0%',
      type: 'focus'
    };
    State.state.history.unshift(logItem);
    State.saveState();
    
    if (focusPortal) focusPortal.classList.remove('active');
    navigateTo('home');
    State.notify();
  };

  const completeFocusSession = () => {
    stopFocusTimer();
    Storage.clearActiveSession();

    State.state.streak += 1;
    
    const dateText = "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sessionDurationMinutes = State.state.settings.focusDuration || 25;
    
    const categoryTitles = {
      'deep-work': 'Deep Work Focus',
      'study': 'Study Session',
      'coding': 'Coding Sprint',
      'reading': 'Reading Flow',
      'meditation': 'Mindful Meditation'
    };
    const activeCat = State.state.activeCategory || 'deep-work';
    const logTitle = categoryTitles[activeCat] || 'Deep Focus Session';

    const logItem = {
      id: Date.now(),
      title: logTitle,
      time: dateText,
      duration: `${sessionDurationMinutes}m`,
      status: 'completed',
      focusScore: `${State.state.zenScore}%`, 
      type: 'focus'
    };
    State.state.history.unshift(logItem);

    // Dynamic focus score calculation from history logs
    State.state.zenScore = Utils.calculateDynamicZenScore(State.state.history, State.state.streak);
    logItem.focusScore = `${State.state.zenScore}%`;
    
    State.gainXP(100);

    // Update rewards labels dynamically
    const rewardTimeVal = document.getElementById('reward-time-val');
    const rewardScoreVal = document.getElementById('reward-score-val');
    const rewardStreakVal = document.getElementById('reward-streak-val');

    if (rewardTimeVal) rewardTimeVal.innerText = `+${sessionDurationMinutes}m`;
    if (rewardScoreVal) {
      const increase = Math.floor(Math.random() * 3) + 3; // +3% to +5%
      rewardScoreVal.innerText = `+${increase}%`;
    }
    if (rewardStreakVal) {
      rewardStreakVal.innerText = `🔥 ${State.state.streak}d`;
    }

    // Screen flash
    triggerBiometricFlash();
    
    const streakVal = document.getElementById('metric-streak-value');
    if (streakVal) {
      streakVal.innerText = `${State.state.streak} Days`;
      streakVal.style.textShadow = "0 0 15px var(--neon-purple-glow)";
      setTimeout(() => { streakVal.style.textShadow = ""; }, 1500);
    }
    
    Components.animateZenRing(State.state.zenScore);

    const aiTextEl = document.getElementById('completion-ai-text');
    if (aiTextEl) aiTextEl.innerText = "Preparing your reflection note...";

    const msgContainer = document.querySelector('#completion-popup .completion-card p');
    if (msgContainer) {
      msgContainer.innerHTML = "You stayed calm and focused all session.";
    }

    if (State.state.settings.geminiKey) {
      const activeSounds = [];
      if (State.state.ambientSoundActive.brownnoise) activeSounds.push("Brown Noise");
      if (State.state.ambientSoundActive.rain) activeSounds.push("Rain Sounds");
      if (State.state.ambientSoundActive.ocean) activeSounds.push("Ocean Waves");
      if (State.state.ambientSoundActive.lofi) activeSounds.push("Lo-Fi Focus");
      
      const prompt = `Focus session duration: ${sessionDurationMinutes} minutes completed.
Selected ambient audio: ${activeSounds.join(" + ") || "None (Muted)"}.
Current Focus Score: ${State.state.zenScore}%.
Streak: ${State.state.streak} days.

Construct a hyper-personalized, warm, and friendly 2-sentence congratulation for Shreya. Congratulate her on completing a focus session, suggest taking a well-deserved break, and keep the tone very human, natural, encouraging, and warm (like Headspace or Endel). Do not use sci-fi, robotic, or technical words. Output ONLY the 2 sentences.`;

      Services.callGeminiAPI(prompt)
        .then(reflection => {
          if (aiTextEl) {
            aiTextEl.innerText = "";
            let idx = 0;
            const type = () => {
              if (idx < reflection.length) {
                aiTextEl.appendChild(document.createTextNode(reflection[idx]));
                idx++;
                setTimeout(type, 15);
              }
            };
            type();
          }
        })
        .catch(e => {
          console.error("Reflection error:", e);
          if (aiTextEl) aiTextEl.innerText = "Focus session complete! Your concentration is strong and steady. You did an amazing job today.";
        });
    } else {
      setTimeout(() => {
        if (aiTextEl) {
          const idx = Math.floor(Math.random() * Constants.AI_COMPLETION_MESSAGES.length);
          aiTextEl.innerHTML = `${Constants.AI_COMPLETION_MESSAGES[idx]}<br><span style="font-size:9px; opacity:0.6; display:block; margin-top:6px; font-family:'JetBrains Mono',monospace;">Demo Mode: Add your Gemini key in settings to unlock personalized coaching reflections.</span>`;
        }
      }, 800);
    }

    const popup = document.getElementById('completion-popup');
    if (popup) {
      popup.classList.add('active');
    }

    if (focusPortal) focusPortal.classList.remove('active');

    // Trigger Break Reminder 5 seconds later
    setTimeout(() => {
      State.triggerNotification(
        'break',
        'Time for a Break',
        'Great work! Your focus session is complete. Take a 5-minute break, stretch, or do a quick breathing exercise.'
      );
    }, 5000);

    State.notify();
  };

  const setupCompletionPopup = () => {
    const claimBtn = document.getElementById('completion-claim-btn');
    const popup = document.getElementById('completion-popup');
    
    if (claimBtn) {
      claimBtn.addEventListener('click', () => {
        if (popup) popup.classList.remove('active');
        navigateTo('home');
      });
    }
  };

  const setupFocusPortalControls = () => {
    // 1. Show category selector instead of starting session immediately
    if (startSessionBtn) {
      startSessionBtn.addEventListener('click', () => {
        const selectPopup = document.getElementById('category-select-popup');
        if (selectPopup) {
          Services.getAudioContext();
          selectPopup.style.display = 'flex';
          setTimeout(() => selectPopup.classList.add('active'), 10);
        }
      });
    }

    // Bind Category options click handlers inside grid
    const categoryOptions = document.querySelectorAll('.category-options-grid .goal-option');
    categoryOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        categoryOptions.forEach(o => {
          o.classList.remove('active');
          o.style.background = 'rgba(255, 255, 255, 0.02)';
          o.style.borderColor = 'rgba(255, 255, 255, 0.04)';
          o.style.color = 'var(--text-secondary)';
          o.style.boxShadow = 'none';
        });
        opt.classList.add('active');
        const cat = opt.getAttribute('data-category');
        const categoryColors = {
          'deep-work': 'var(--neon-purple)',
          'study': 'var(--neon-pink)',
          'coding': 'var(--neon-blue)',
          'reading': '#10b981',
          'meditation': '#f59e0b'
        };
        const color = categoryColors[cat];
        opt.style.background = 'rgba(255, 255, 255, 0.05)';
        opt.style.borderColor = color;
        opt.style.color = color;
        opt.style.boxShadow = `0 0 10px ${color}1a`;
      });
    });

    // Cancel category select
    const cancelSelectBtn = document.getElementById('category-select-cancel-btn');
    if (cancelSelectBtn) {
      cancelSelectBtn.addEventListener('click', () => {
        const selectPopup = document.getElementById('category-select-popup');
        if (selectPopup) {
          selectPopup.classList.remove('active');
          setTimeout(() => {
            selectPopup.style.display = 'none';
          }, 300);
        }
      });
    }

    // Confirm category select and launch portal timer
    const confirmSelectBtn = document.getElementById('category-select-confirm-btn');
    if (confirmSelectBtn) {
      confirmSelectBtn.addEventListener('click', () => {
        const selectPopup = document.getElementById('category-select-popup');
        if (selectPopup) {
          selectPopup.classList.remove('active');
          selectPopup.style.display = 'none';
        }

        const activeOpt = document.querySelector('.category-options-grid .goal-option.active');
        const cat = activeOpt ? activeOpt.getAttribute('data-category') : 'deep-work';

        // Stash selected category in dynamic state
        State.state.activeCategory = cat;

        const categoryMeta = {
          'deep-work': { title: 'Deep Work Session', icon: 'brain', accent: 'var(--neon-purple)', desc: 'You are in deep flow. Take deep, steady breaths.' },
          'study': { title: 'Study Session', icon: 'book-open', accent: 'var(--neon-pink)', desc: 'Learning and expanding your mind. Stay steady.' },
          'coding': { title: 'Coding Sprint', icon: 'terminal', accent: 'var(--neon-blue)', desc: 'Solving puzzles and building. Shield distractions.' },
          'reading': { title: 'Reading Flow', icon: 'book', accent: '#10b981', desc: 'Absorbing knowledge in quiet space.' },
          'meditation': { title: 'Mindful Meditation', icon: 'heart', accent: '#f59e0b', desc: 'Resting in silent awareness.' }
        };

        const meta = categoryMeta[cat];
        const portalTitleEl = document.getElementById('portal-category-title');
        const portalIconEl = document.getElementById('portal-category-icon');
        const portalDescEl = document.querySelector('.portal-desc');

        if (portalTitleEl) portalTitleEl.innerText = meta.title;
        if (portalDescEl) portalDescEl.innerText = meta.desc;
        if (portalIconEl) {
          portalIconEl.setAttribute('data-lucide', meta.icon);
          portalIconEl.style.color = meta.accent;
          if (window.lucide) window.lucide.createIcons();
        }

        if (focusPortal) {
          focusPortal.classList.add('active');
          startFocusTimer(cat);
        }
      });
    }

    if (closePortalBtn) {
      closePortalBtn.addEventListener('click', cancelFocusSession);
    }

    if (pausePortalBtn) {
      pausePortalBtn.addEventListener('click', () => {
        if (State.state.timerPaused) {
          resumeFocusTimer();
        } else {
          pauseFocusTimer();
        }
      });
    }

    const resetBtn = document.getElementById('portal-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        State.state.timerRemaining = State.state.timerDuration;
        updateCountdownDisplay(State.state.timerRemaining);
        updatePortalProgressRing();
        
        Storage.saveActiveSession({
          remaining: State.state.timerRemaining,
          duration: State.state.timerDuration,
          paused: State.state.timerPaused,
          timestamp: Date.now()
        });
        
        const timeDisplay = document.getElementById('portal-time-display');
        if (timeDisplay) {
          timeDisplay.style.textShadow = "0 0 15px var(--neon-blue-glow)";
          setTimeout(() => { timeDisplay.style.textShadow = ""; }, 1000);
        }
      });
    }

    if (cancelPortalBtn) {
      cancelPortalBtn.addEventListener('click', cancelFocusSession);
    }
  };

  // --- AMBIENT SOUND COGNITIVE SYNTHS ---
  const toggleSound = (soundType, checked) => {
    if (checked && !State.state.settings.soundEnabled) {
      const checkbox = document.getElementById(`toggle-${soundType}`);
      if (checkbox) checkbox.checked = false;
      State.state.ambientSoundActive[soundType] = false;
      return;
    }

    State.state.ambientSoundActive[soundType] = checked;
    
    const card = document.getElementById(`card-${soundType}`);
    if (card) {
      const wave = card.querySelector('.sound-wave-anim');
      if (checked) {
        card.classList.add('active');
        if (wave) wave.style.display = 'flex';
      } else {
        card.classList.remove('active');
        if (wave) wave.style.display = 'none';
      }
    }

    if (checked) {
      Services.startSound(soundType);
      updatePortalSoundIndicator();
    } else {
      Services.stopSound(soundType);
      updatePortalSoundIndicator();
    }

    // Dynamic listening tracking
    trackAmbientAudioDuration(soundType, checked);
    State.notify();
  };

  const trackAmbientAudioDuration = (soundType, checked) => {
    const isAnyActiveBefore = State.state.ambientSoundActive.brownnoise || 
                              State.state.ambientSoundActive.rain || 
                              State.state.ambientSoundActive.ocean || 
                              State.state.ambientSoundActive.lofi;
    
    const isAnyActiveAfter = State.state.ambientSoundActive.brownnoise || 
                             State.state.ambientSoundActive.rain || 
                             State.state.ambientSoundActive.ocean || 
                             State.state.ambientSoundActive.lofi;
    
    if (!isAnyActiveBefore && isAnyActiveAfter) {
      audioStartTime = Date.now();
    } else if (isAnyActiveBefore && !isAnyActiveAfter) {
      if (audioStartTime) {
        const elapsedSecs = Math.floor((Date.now() - audioStartTime) / 1000);
        const elapsedMins = Math.max(1, Math.round(elapsedSecs / 60));
        
        if (elapsedSecs >= 8) {
          const dateText = "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const logItem = {
            id: Date.now(),
            title: 'Focus Sounds Session',
            time: dateText,
            duration: `${elapsedMins}m`,
            status: 'completed',
            focusScore: `${State.state.zenScore}%`,
            type: 'meditation'
          };
          State.state.history.unshift(logItem);
          State.saveState();
          State.gainXP(20);
        }
        audioStartTime = null;
      }
    }
  };

  const setupSoundToggles = () => {
    ['brownnoise', 'rain', 'ocean', 'lofi'].forEach(id => {
      const checkbox = document.getElementById(`toggle-${id}`);
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          toggleSound(id, e.target.checked);
        });
      }
    });

    // Volume sliders binders
    ['brownnoise', 'rain', 'ocean', 'lofi'].forEach(id => {
      const slider = document.getElementById(`vol-${id}`);
      if (slider) {
        slider.addEventListener('input', (e) => {
          Services.adjustVolume(id, parseFloat(e.target.value));
        });
      }
    });
  };

  const updateNowPlayingFeedback = () => {
    const textEl = document.getElementById('now-playing-status-text');
    const dotEl = document.querySelector('#soundscapes-now-playing-banner .pulsing-dot');
    const bannerEl = document.getElementById('soundscapes-now-playing-banner');
    
    if (!textEl) return;
    
    const activeSounds = [];
    if (State.state.ambientSoundActive.brownnoise) activeSounds.push("Brown Noise");
    if (State.state.ambientSoundActive.rain) activeSounds.push("Rain Sounds");
    if (State.state.ambientSoundActive.ocean) activeSounds.push("Ocean Waves");
    if (State.state.ambientSoundActive.lofi) activeSounds.push("Lo-Fi Focus");
    
    if (activeSounds.length > 0) {
      textEl.innerText = "Playing: " + activeSounds.join(" + ");
      textEl.style.color = "var(--neon-blue)";
      if (dotEl) {
        dotEl.style.backgroundColor = "var(--neon-blue)";
        dotEl.style.boxShadow = "0 0 8px var(--neon-blue-glow)";
        dotEl.style.animation = "pulseGlow 1.2s infinite alternate";
      }
      if (bannerEl) {
        bannerEl.style.background = "rgba(6, 182, 212, 0.08)";
        bannerEl.style.borderColor = "rgba(6, 182, 212, 0.25)";
        bannerEl.style.opacity = "1";
      }
    } else {
      textEl.innerText = "All Focus Sounds Paused";
      textEl.style.color = "var(--text-secondary)";
      if (dotEl) {
        dotEl.style.backgroundColor = "var(--text-muted)";
        dotEl.style.boxShadow = "none";
        dotEl.style.animation = "none";
      }
      if (bannerEl) {
        bannerEl.style.background = "rgba(0, 0, 0, 0.2)";
        bannerEl.style.borderColor = "rgba(255, 255, 255, 0.04)";
        bannerEl.style.opacity = "0.7";
      }
    }
  };

  const updatePortalSoundIndicator = () => {
    const indicatorText = document.getElementById('portal-sound-text');
    const indicatorIcon = document.getElementById('portal-sound-icon');
    
    const activeSounds = [];
    if (State.state.ambientSoundActive.brownnoise) activeSounds.push("Brown Noise");
    if (State.state.ambientSoundActive.rain) activeSounds.push("Rain Sounds");
    if (State.state.ambientSoundActive.ocean) activeSounds.push("Ocean Waves");
    if (State.state.ambientSoundActive.lofi) activeSounds.push("Lo-Fi Focus");
    
    if (indicatorText && indicatorIcon) {
      if (activeSounds.length > 0) {
        indicatorText.innerText = "Sound: " + activeSounds.join(" + ");
        indicatorIcon.style.display = "inline-block";
      } else {
        indicatorText.innerText = "Sound Muted";
        indicatorIcon.style.display = "none";
      }
    }

    updateNowPlayingFeedback();
  };

  // --- BIOMETRIC NEON SHIELD FLASH ---
  const triggerBiometricFlash = () => {
    if (!State.state.settings.notificationsEnabled) return;

    const shell = document.querySelector('.phone-shell');
    if (!shell) return;

    const flashOverlay = document.createElement('div');
    flashOverlay.style.position = 'absolute';
    flashOverlay.style.top = '0';
    flashOverlay.style.left = '0';
    flashOverlay.style.width = '100%';
    flashOverlay.style.height = '100%';
    flashOverlay.style.background = 'radial-gradient(circle, rgba(6, 182, 212, 0.8) 0%, rgba(168, 85, 247, 0.8) 50%, transparent 100%)';
    flashOverlay.style.zIndex = '9999';
    flashOverlay.style.pointerEvents = 'none';
    flashOverlay.style.transition = 'opacity 1.5s cubic-bezier(0.16, 1, 0.3, 1)';
    flashOverlay.style.opacity = '1';
    flashOverlay.style.mixBlendMode = 'screen';
    flashOverlay.style.boxShadow = 'inset 0 0 80px rgba(6, 182, 212, 1), 0 0 100px rgba(168, 85, 247, 1)';

    shell.appendChild(flashOverlay);

    setTimeout(() => {
      flashOverlay.style.opacity = '0';
      setTimeout(() => flashOverlay.remove(), 1500);
    }, 100);
  };

  // --- LOCAL ACCOUNT DECRYPT AUTHENTICATION ---
  const initAuthSystem = () => {
    const loginCard = document.getElementById('auth-login-card');
    const signupCard = document.getElementById('auth-signup-card');
    const goToSignup = document.getElementById('go-to-signup');
    const goToLogin = document.getElementById('go-to-login');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginError = document.getElementById('login-error-msg');
    const signupError = document.getElementById('signup-error-msg');

    if (goToSignup) {
      goToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginCard && signupCard) {
          loginCard.style.opacity = '0';
          loginCard.style.transform = 'translateY(10px)';
          loginCard.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
          
          setTimeout(() => {
            loginCard.style.display = 'none';
            loginCard.classList.remove('active');
            
            signupCard.style.display = 'block';
            signupCard.style.opacity = '0';
            signupCard.style.transform = 'translateY(10px)';
            signupCard.offsetHeight;
            
            signupCard.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            signupCard.style.opacity = '1';
            signupCard.style.transform = 'translateY(0)';
            signupCard.classList.add('active');
          }, 250);
        }
        if (loginError) loginError.style.display = 'none';
        if (signupError) signupError.style.display = 'none';
      });
    }

    if (goToLogin) {
      goToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        if (loginCard && signupCard) {
          signupCard.style.opacity = '0';
          signupCard.style.transform = 'translateY(10px)';
          signupCard.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
          
          setTimeout(() => {
            signupCard.style.display = 'none';
            signupCard.classList.remove('active');
            
            loginCard.style.display = 'block';
            loginCard.style.opacity = '0';
            loginCard.style.transform = 'translateY(10px)';
            loginCard.offsetHeight;
            
            loginCard.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            loginCard.style.opacity = '1';
            loginCard.style.transform = 'translateY(0)';
            loginCard.classList.add('active');
          }, 250);
        }
        if (loginError) loginError.style.display = 'none';
        if (signupError) signupError.style.display = 'none';
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const decryptCode = document.getElementById('login-password').value.trim();

        if (loginError) loginError.style.display = 'none';

        // Robust form validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          if (loginError) {
            loginError.innerText = "Sign in failed: Please enter a valid email address.";
            loginError.style.display = 'block';
          }
          return;
        }

        if (decryptCode.length === 0) {
          if (loginError) {
            loginError.innerText = "Sign in failed: Password cannot be empty.";
            loginError.style.display = 'block';
          }
          return;
        }

        let users = [];
        try {
          const storedUsers = localStorage.getItem('focuszen_users');
          if (storedUsers) users = JSON.parse(storedUsers);
        } catch (err) {}

        const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        const isDefaultUser = email.toLowerCase() === 'shreya@focuszen.ai' && decryptCode === '123456';

        if (matchedUser && matchedUser.password === decryptCode) {
          State.state.currentUser = { username: matchedUser.username, email: matchedUser.email };
          localStorage.setItem('focuszen_current_user', JSON.stringify(State.state.currentUser));
          syncCurrentUserUI();
          navigateTo('home');
        } else if (isDefaultUser) {
          State.state.currentUser = { username: 'Shreya', email: 'shreya@focuszen.ai' };
          localStorage.setItem('focuszen_current_user', JSON.stringify(State.state.currentUser));
          syncCurrentUserUI();
          navigateTo('home');
        } else {
          if (loginError) {
            loginError.innerText = "Sign in failed: Please check your email and password.";
            loginError.style.display = 'block';
          }
        }
      });
    }

    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('signup-username').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const encryptCode = document.getElementById('signup-password').value.trim();

        if (signupError) signupError.style.display = 'none';

        // Robust form validation
        if (username.length < 2) {
          if (signupError) {
            signupError.innerText = "Registration failed: Username must be at least 2 characters.";
            signupError.style.display = 'block';
          }
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          if (signupError) {
            signupError.innerText = "Registration failed: Please enter a valid email address.";
            signupError.style.display = 'block';
          }
          return;
        }

        if (encryptCode.length < 6) {
          if (signupError) {
            signupError.innerText = "Registration failed: Password must be at least 6 characters long.";
            signupError.style.display = 'block';
          }
          return;
        }

        let users = [];
        try {
          const storedUsers = localStorage.getItem('focuszen_users');
          if (storedUsers) users = JSON.parse(storedUsers);
        } catch (err) {}

        const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (userExists) {
          if (signupError) {
            signupError.innerText = "Registration failed: An account with this email already exists.";
            signupError.style.display = 'block';
          }
          return;
        }

        users.push({ username, email, password: encryptCode });
        localStorage.setItem('focuszen_users', JSON.stringify(users));

        State.state.currentUser = { username, email };
        localStorage.setItem('focuszen_current_user', JSON.stringify(State.state.currentUser));
        syncCurrentUserUI();
        navigateTo('home');
      });
    }
  };

  const syncCurrentUserUI = () => {
    const userGreeting = document.getElementById('user-greeting');
    const settingsName = document.getElementById('settings-profile-name');
    const settingsEmail = document.getElementById('settings-profile-email');

    if (State.state.currentUser) {
      if (userGreeting) userGreeting.innerText = `Welcome, ${State.state.currentUser.username}`;
      if (settingsName) settingsName.innerText = State.state.currentUser.username;
      if (settingsEmail) settingsEmail.innerText = State.state.currentUser.email.toLowerCase();
    } else {
      if (userGreeting) userGreeting.innerText = `Welcome, Friend`;
      if (settingsName) settingsName.innerText = "Guest";
      if (settingsEmail) settingsEmail.innerText = "unauthenticated@focuszen.ai";
    }
  };

  // --- SYSTEM PREFERENCE SETTINGS ---
  const initSettingsSystem = () => {
    const durationBtns = document.querySelectorAll('.settings-duration-grid .duration-btn');
    const toggleAi = document.getElementById('settings-toggle-ai');
    const toggleSoundBtn = document.getElementById('settings-toggle-sound');
    const toggleNotif = document.getElementById('settings-toggle-notifications');
    const toggleDark = document.getElementById('settings-toggle-dark-theme');
    const logoutBtn = document.getElementById('settings-logout-btn');
    const backBtn = document.getElementById('settings-back-btn');
    const homeSettingsBtn = document.getElementById('home-settings-btn');
    const homeAvatarBtn = document.getElementById('home-avatar-btn');

    if (homeSettingsBtn) {
      homeSettingsBtn.addEventListener('click', () => navigateTo('settings'));
    }
    if (homeAvatarBtn) {
      homeAvatarBtn.addEventListener('click', () => navigateTo('settings'));
    }
    if (backBtn) {
      backBtn.addEventListener('click', () => navigateTo('home'));
    }

    durationBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const mins = parseInt(btn.getAttribute('data-duration')) || 25;
        State.state.settings.focusDuration = mins;
        
        if (!State.state.focusActive) {
          State.state.timerDuration = mins * 60;
          State.state.timerRemaining = State.state.timerDuration;
          updateCountdownDisplay(State.state.timerRemaining);
          updatePortalProgressRing();
        }

        durationBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        State.saveState();
      });
    });

    if (toggleAi) {
      toggleAi.addEventListener('change', (e) => {
        State.state.settings.aiEnabled = e.target.checked;
        const aiCard = document.querySelector('.ai-insight-card');
        if (aiCard) {
          aiCard.style.display = State.state.settings.aiEnabled ? 'block' : 'none';
        }
        State.saveState();
      });
    }

    if (toggleSoundBtn) {
      toggleSoundBtn.addEventListener('change', (e) => {
        State.state.settings.soundEnabled = e.target.checked;
        if (!State.state.settings.soundEnabled) {
          Services.stopAllSoundscapes();
          // Reset switches UI
          ['brownnoise', 'rain', 'ocean', 'lofi'].forEach(id => {
            const cb = document.getElementById(`toggle-${id}`);
            const card = document.getElementById(`card-${id}`);
            if (cb) cb.checked = false;
            if (card) card.classList.remove('active');
            State.state.ambientSoundActive[id] = false;
          });
          updatePortalSoundIndicator();
        }
        State.saveState();
        State.notify();
      });
    }

    if (toggleNotif) {
      toggleNotif.addEventListener('change', (e) => {
        State.state.settings.notificationsEnabled = e.target.checked;
        State.saveState();
      });
    }

    if (toggleDark) {
      toggleDark.addEventListener('change', (e) => {
        State.state.settings.ultraDarkEnabled = e.target.checked;
        const shell = document.querySelector('.phone-shell');
        if (shell) {
          if (State.state.settings.ultraDarkEnabled) shell.classList.add('ultra-dark');
          else shell.classList.remove('ultra-dark');
        }
        State.saveState();
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        State.state.currentUser = null;
        localStorage.removeItem('focuszen_current_user');
        Services.stopAllSoundscapes();
        // Reset switches UI
        ['brownnoise', 'rain', 'ocean', 'lofi'].forEach(id => {
          const cb = document.getElementById(`toggle-${id}`);
          const card = document.getElementById(`card-${id}`);
          if (cb) cb.checked = false;
          if (card) card.classList.remove('active');
          State.state.ambientSoundActive[id] = false;
        });
        updatePortalSoundIndicator();
        syncCurrentUserUI();
        navigateTo('auth');
      });
    }

    // Danger Zone Hard data wiper
    const resetDataBtn = document.getElementById('settings-reset-data-btn');
    if (resetDataBtn) {
      resetDataBtn.addEventListener('click', () => {
        if (confirm("Are you absolutely sure you want to reset all data? This will permanently clear your focus logs, streak progress, achievements, and settings.")) {
          Storage.clearAllData();
          
          // Re-initialize state parameters to defaults
          State.state.zenScore = 85;
          state.streak = 0;
          State.state.weeklyHours = [0, 0, 0, 0, 0, 0, 0];
          State.state.xp = 0;
          State.state.level = 1;
          State.state.unlockedBadges = [];
          State.state.notifications = [
            { id: Date.now(), type: 'flow', title: 'System Initialized', message: "Welcome to FocusZen. Let's make today a calm and focused one!", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          ];
          State.state.history = [];
          
          State.state.settings = {
            focusDuration: 25,
            aiEnabled: true,
            soundEnabled: true,
            notificationsEnabled: true,
            ultraDarkEnabled: true,
            geminiKey: "",
            breakAlerts: true,
            streakAlerts: true,
            aiAlerts: true
          };

          State.state.timerDuration = 25 * 60;
          State.state.timerRemaining = 25 * 60;

          State.saveState();
          syncSettingsUI();
          syncCurrentUserUI();
          Services.stopAllSoundscapes();
          // Reset switches UI
          ['brownnoise', 'rain', 'ocean', 'lofi'].forEach(id => {
            const cb = document.getElementById(`toggle-${id}`);
            const card = document.getElementById(`card-${id}`);
            if (cb) cb.checked = false;
            if (card) card.classList.remove('active');
            State.state.ambientSoundActive[id] = false;
          });
          updatePortalSoundIndicator();
          
          alert("All FocusZen data has been reset successfully.");

          localStorage.removeItem('focuszen_current_user');
          State.state.currentUser = null;
          navigateTo('auth');
          
          const onboardingOverlay = document.getElementById('onboarding-overlay');
          if (onboardingOverlay) {
            onboardingOverlay.classList.remove('fade-out');
            onboardingOverlay.style.display = 'flex';
            const slides = onboardingOverlay.querySelectorAll('.onboarding-slide');
            slides.forEach(slide => slide.classList.remove('active'));
            const firstSlide = document.getElementById('onboard-slide-1');
            if (firstSlide) firstSlide.classList.add('active');
          }
        }
      });
    }

    // Gemini API saving/clearing
    const geminiKeyInput = document.getElementById('settings-gemini-key');
    const saveGeminiKeyBtn = document.getElementById('save-gemini-key-btn');
    const clearGeminiKeyBtn = document.getElementById('clear-gemini-key-btn');

    if (saveGeminiKeyBtn && geminiKeyInput) {
      saveGeminiKeyBtn.addEventListener('click', () => {
        const key = geminiKeyInput.value.trim();
        State.state.settings.geminiKey = key;
        State.saveState();
        Services.playNotificationChime();
        
        saveGeminiKeyBtn.style.textShadow = "0 0 10px var(--neon-blue-glow)";
        saveGeminiKeyBtn.innerText = "KEY SAVED";
        setTimeout(() => {
          saveGeminiKeyBtn.style.textShadow = "";
          saveGeminiKeyBtn.innerText = "Save Key";
        }, 1500);
        
        State.notify();
      });
    }

    if (clearGeminiKeyBtn && geminiKeyInput) {
      clearGeminiKeyBtn.addEventListener('click', () => {
        geminiKeyInput.value = "";
        State.state.settings.geminiKey = "";
        State.saveState();
        
        clearGeminiKeyBtn.style.background = "rgba(244, 63, 94, 0.15)";
        setTimeout(() => {
          clearGeminiKeyBtn.style.background = "transparent";
        }, 800);
        
        State.notify();
      });
    }
  };

  const syncSettingsUI = () => {
    const durationBtns = document.querySelectorAll('.settings-duration-grid .duration-btn');
    durationBtns.forEach(btn => {
      const duration = parseInt(btn.getAttribute('data-duration'));
      if (duration === State.state.settings.focusDuration) btn.classList.add('active');
      else btn.classList.remove('active');
    });

    const toggleAi = document.getElementById('settings-toggle-ai');
    const toggleSoundBtn = document.getElementById('settings-toggle-sound');
    const toggleNotif = document.getElementById('settings-toggle-notifications');
    const toggleDark = document.getElementById('settings-toggle-dark-theme');

    if (toggleAi) toggleAi.checked = State.state.settings.aiEnabled;
    if (toggleSoundBtn) toggleSoundBtn.checked = State.state.settings.soundEnabled;
    if (toggleNotif) toggleNotif.checked = State.state.settings.notificationsEnabled;
    if (toggleDark) toggleDark.checked = State.state.settings.ultraDarkEnabled;

    const aiCard = document.querySelector('.ai-insight-card');
    if (aiCard) {
      aiCard.style.display = State.state.settings.aiEnabled ? 'block' : 'none';
    }

    const shell = document.querySelector('.phone-shell');
    if (shell) {
      if (State.state.settings.ultraDarkEnabled) shell.classList.add('ultra-dark');
      else shell.classList.remove('ultra-dark');
    }

    const geminiKeyInput = document.getElementById('settings-gemini-key');
    if (geminiKeyInput) {
      geminiKeyInput.value = State.state.settings.geminiKey || "";
    }
  };

  // --- NOTIFICATIONS center feed setup ---
  const setupNotificationsSystem = () => {
    const homeBtn = document.getElementById('home-notification-btn');
    const backBtn = document.getElementById('notifications-back-btn');
    const clearBtn = document.getElementById('clear-notifications-btn');
    const badge = document.getElementById('notification-badge');

    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        navigateTo('notifications');
        if (badge) badge.style.display = 'none';
      });
    }

    if (backBtn) {
      backBtn.addEventListener('click', () => navigateTo('home'));
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        State.state.notifications = [];
        State.saveState();
        State.notify();
      });
    }

    const toggleBreak = document.getElementById('notif-toggle-break');
    const toggleStreak = document.getElementById('notif-toggle-streak');
    const toggleAiNotif = document.getElementById('notif-toggle-ai');

    if (toggleBreak) {
      toggleBreak.checked = State.state.settings.breakAlerts;
      toggleBreak.addEventListener('change', (e) => {
        State.state.settings.breakAlerts = e.target.checked;
        State.saveState();
      });
    }

    if (toggleStreak) {
      toggleStreak.checked = State.state.settings.streakAlerts;
      toggleStreak.addEventListener('change', (e) => {
        State.state.settings.streakAlerts = e.target.checked;
        State.saveState();
      });
    }

    if (toggleAiNotif) {
      toggleAiNotif.checked = State.state.settings.aiAlerts;
      toggleAiNotif.addEventListener('change', (e) => {
        State.state.settings.aiAlerts = e.target.checked;
        State.saveState();
      });
    }
  };

  // --- periodic background coaching notifications ---
  const setupAICoachingInterval = () => {
    setInterval(() => {
      if (State.state.settings.aiAlerts && State.state.settings.notificationsEnabled) {
        if (State.state.settings.geminiKey) {
          const prompt = `User current Focus streak is ${State.state.streak} days, Focus Score is ${State.state.zenScore}%.
          Generate a single, warm, friendly, and motivational 1-sentence coaching alert that sounds like a push notification from a wellness app.
          Keep it brief (max 15 words), calming, and extremely encouraging. Output ONLY the 1 sentence.`;
          
          Services.callGeminiAPI(prompt)
            .then(motivationalText => {
               State.triggerNotification('coach', 'Mindful Tip', motivationalText);
            })
            .catch(e => {
               console.error("AI coaching notifier failed:", e);
               State.triggerNotification('coach', 'Mindful Tip', 'You are doing great today. Take a deep breath and stay in your flow.');
            });
        } else {
          const offlineCoachingMsgs = [
            "You are doing amazing today. Take a moment to appreciate your effort!",
            "Stay in your flow! A deep breath can help you recenter your focus.",
            "Enjoy the quiet and stay focused on what matters to you right now."
          ];
          const msg = offlineCoachingMsgs[Math.floor(Math.random() * offlineCoachingMsgs.length)];
          State.triggerNotification('coach', 'Mindful Tip', msg);
        }
      }
    }, 600000); // Checks every 10 minutes
  };

  // --- PREMIUM SYSTEM STARTUP LOADER SEQUENCE ---
  const runSystemStartupLoading = () => {
    const loader = document.getElementById('system-startup-loader');
    const bar = document.getElementById('startup-progress-bar');
    const statusText = document.getElementById('startup-loader-status');

    if (!loader || !bar) return;

    const logStates = [
      "Preparing your focus space...",
      "Loading your personal dashboard...",
      "Setting up calming focus sounds...",
      "Loading your focus goals...",
      "Focus space ready. Welcome back, Shreya!"
    ];

    let progress = 0;
    let logIdx = 0;
    
    const interval = setInterval(() => {
      progress += 2;
      if (bar) bar.style.width = `${progress}%`;

      if (progress % 20 === 0 && logIdx < logStates.length - 1) {
        logIdx++;
        if (statusText) statusText.innerText = logStates[logIdx];
      }

      if (progress >= 100) {
        clearInterval(interval);
        if (statusText) statusText.innerText = logStates[logStates.length - 1];
        
        setTimeout(() => {
          loader.style.opacity = '0';
          setTimeout(() => {
            loader.classList.add('hidden');
            loader.style.display = 'none';
          }, 600);
        }, 400);
      }
    }, 30);
  };

  // --- ONBOARDING OVERLAY CONTROLS ---
  const setupOnboarding = () => {
    const overlay = document.getElementById('onboarding-overlay');
    if (!overlay) return;

    const isOnboarded = localStorage.getItem('focuszen_onboarded');
    if (isOnboarded === 'true') {
      overlay.style.display = 'none';
      return;
    }

    overlay.style.display = 'flex';

    const slides = overlay.querySelectorAll('.onboarding-slide');
    const nextBtns = overlay.querySelectorAll('.next-btn');
    const finishBtn = document.getElementById('onboard-finish-btn');
    const goalOptions = overlay.querySelectorAll('.goal-option');

    goalOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        goalOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        const selectedGoal = opt.getAttribute('data-goal');
        localStorage.setItem('focuszen_user_goal', selectedGoal);
      });
    });

    nextBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const nextSlideId = btn.getAttribute('data-next');
        slides.forEach(slide => slide.classList.remove('active'));
        const nextSlide = document.getElementById(`onboard-slide-${nextSlideId}`);
        if (nextSlide) nextSlide.classList.add('active');
      });
    });

    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        localStorage.setItem('focuszen_onboarded', 'true');
        
        overlay.classList.add('fade-out');
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 600);

        State.triggerNotification('flow', 'Welcome to FocusZen', 'Your onboarding is complete. Let\'s start a wonderful focus journey today!');
      });
    }
  };

  // --- DYNAMIC STATUS BAR CLOCK ---
  const setupDynamicClock = () => {
    const updateTime = () => {
      const timeEl = document.getElementById('status-bar-time');
      if (timeEl) {
        const now = new Date();
        const hrs = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        timeEl.innerText = `${hrs}:${mins}`;
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  };

  const checkStreakDecay = () => {
    const lastFocusSession = State.state.history.find(item => item.status === 'completed' && item.type === 'focus' && item.id > 100000);
    if (lastFocusSession) {
      const elapsedHours = (Date.now() - lastFocusSession.id) / (1000 * 60 * 60);
      if (elapsedHours > 18 && State.state.streak > 0) {
        State.triggerNotification(
          'streak',
          'Streak Reminder',
          `Your focus streak of ${State.state.streak} days is in danger of ending! Start a session today to keep it going.`
        );
      }
    }
  };

  // --- BOOT COORDINATOR INITIALIZER ---
  const init = () => {
    State.loadState();
    
    // Normalize mock lists if empty on first startup
    if (State.state.history.length === 0) {
      const now = Date.now();
      State.state.history = [
        { id: now - 2.5 * 3600 * 1000, title: 'Deep Work Focus', time: 'Today, 2:15 PM', duration: '25m', status: 'completed', focusScore: '92%', type: 'focus' },
        { id: now - 6.5 * 3600 * 1000, title: 'Relaxing Ambient Sound', time: 'Today, 9:30 AM', duration: '10m', status: 'completed', focusScore: '88%', type: 'meditation' },
        { id: now - 24.5 * 3600 * 1000, title: 'Evening Wind-down', time: 'Yesterday, 8:40 PM', duration: '15m', status: 'completed', focusScore: '85%', type: 'meditation' },
        { id: now - 28.5 * 3600 * 1000, title: 'Creative Session', time: 'Yesterday, 11:00 AM', duration: '25m', status: 'completed', focusScore: '90%', type: 'focus' },
        { id: now - 2 * 24 * 3600 * 1000 - 3 * 3600 * 1000, title: 'Quick Breathing Session', time: '2 days ago', duration: '4m', status: 'completed', focusScore: '94%', type: 'breathing' },
        { id: now - 3 * 24 * 3600 * 1000 - 4 * 3600 * 1000, title: 'Zen Morning Focus', time: '3 days ago', duration: '25m', status: 'completed', focusScore: '91%', type: 'focus' },
        { id: now - 4 * 24 * 3600 * 1000 - 2 * 3600 * 1000, title: 'Calming Soundscape', time: '4 days ago', duration: '20m', status: 'completed', focusScore: '87%', type: 'meditation' },
        { id: now - 5 * 24 * 3600 * 1000 - 5 * 3600 * 1000, title: 'Deep Focus Sprint', time: '5 days ago', duration: '25m', status: 'completed', focusScore: '93%', type: 'focus' },
        { id: now - 6 * 24 * 3600 * 1000 - 1 * 3600 * 1000, title: 'Midweek Breathing', time: '6 days ago', duration: '6m', status: 'completed', focusScore: '95%', type: 'breathing' },
        { id: now - 7 * 24 * 3600 * 1000 - 8 * 3600 * 1000, title: 'Sunday Focus Session', time: '7 days ago', duration: '25m', status: 'completed', focusScore: '89%', type: 'focus' },
        { id: now - 8 * 24 * 3600 * 1000 - 2 * 3600 * 1000, title: 'Late Night Flow', time: '8 days ago', duration: '25m', status: 'completed', focusScore: '86%', type: 'focus' },
        { id: now - 9 * 24 * 3600 * 1000 - 3 * 3600 * 1000, title: 'Afternoon Mindful Breath', time: '9 days ago', duration: '5m', status: 'completed', focusScore: '92%', type: 'breathing' },
        { id: now - 10 * 24 * 3600 * 1000 - 1 * 3600 * 1000, title: 'Early Morning Ritual', time: '10 days ago', duration: '40m', status: 'completed', focusScore: '96%', type: 'focus' }
      ];
      State.saveState();
    }

    // Set up sub-controllers
    initAuthSystem();
    initSettingsSystem();
    initAIChatSystem();
    setupNotificationsSystem();
    
    // Set up coordinators
    setupNavigation();
    setupScoreRecalibrate();
    setupAiRefresh();
    setupFocusPortalControls();
    setupSoundToggles();
    setupBreathingCoach();
    setupCompletionPopup();
    setupOnboarding();
    setupDynamicClock();

    // Re-synchronize Dynamic Hours & Trends
    State.state.weeklyHours = Utils.getWeeklyHoursFromHistory(State.state.history);
    State.state.streak = Utils.calculateStreak(State.state.history);
    State.state.zenScore = Utils.calculateDynamicZenScore(State.state.history, State.state.streak);
    State.saveState();

    syncCurrentUserUI();
    syncSettingsUI();

    // Restore interrupted active timer state on unexpected tabs reload
    try {
      const activeSession = Storage.loadActiveSession();
      if (activeSession && activeSession.remaining > 0) {
        State.state.timerDuration = activeSession.duration;
        State.state.timerPaused = activeSession.paused;
        
        if (!activeSession.paused) {
          const elapsed = Math.floor((Date.now() - activeSession.timestamp) / 1000);
          State.state.timerRemaining = Math.max(0, activeSession.remaining - elapsed);
        } else {
          State.state.timerRemaining = activeSession.remaining;
        }

        if (State.state.timerRemaining > 0) {
          State.state.focusActive = true;
          if (focusPortal) {
            Services.getAudioContext();
            focusPortal.classList.add('active');
            updateCountdownDisplay(State.state.timerRemaining);
            updatePortalProgressRing();
            runPortalBreathingSphere();
            
            if (State.state.timerPaused) {
              if (pausePortalBtn) {
                pausePortalBtn.innerText = 'RESUME FOCUS';
                pausePortalBtn.className = 'portal-btn resume';
              }
            }

            State.state.timerInterval = setInterval(() => {
              if (!State.state.timerPaused) {
                State.state.timerRemaining--;
                updateCountdownDisplay(State.state.timerRemaining);
                updatePortalProgressRing();
                
                Storage.saveActiveSession({
                  remaining: State.state.timerRemaining,
                  duration: State.state.timerDuration,
                  paused: State.state.timerPaused,
                  timestamp: Date.now()
                });

                if (State.state.timerRemaining <= 0) {
                  completeFocusSession();
                }
              }
            }, 1000);
          }
        } else {
          Storage.clearActiveSession();
          completeFocusSession();
        }
      }
    } catch (e) {
      console.error("State Error: Failed to restore active focus session:", e);
    }

    checkStreakDecay();
    setupAICoachingInterval();

    // Trigger greeting tip
    setTimeout(() => {
      if (State.state.currentUser && State.state.settings.aiAlerts && State.state.settings.notificationsEnabled) {
        State.triggerNotification(
          'coach', 
          'AI Coach Online', 
          "Welcome back, Shreya! Your personal AI coach is online and ready to help you stay focused today."
        );
      }
    }, 15000);

    // Boot real-time visualizers Spectrogram Loop
    Components.renderVisualizerSpectrograms();

    // Dynamic initial renders
    Components.animateZenRing(State.state.zenScore);
    regenerateInsight();
    Components.drawWeeklyChart(State.state.weeklyHours);
    updatePortalSoundIndicator();
    State.notify();

    // Routing navigation lockdown check
    navigateTo(State.state.currentUser ? 'home' : 'auth');

    // Run system boot loader sequence
    runSystemStartupLoading();
  };

  init();
});
