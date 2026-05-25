/* components.js - Modular UI Components & Reactive View Renderers */

(function () {
  const Utils = window.FocusZenUtils;
  const Constants = window.FocusZenConstants;

  // --- 1. CIRCULAR ZEN RING SCORE ---
  
  function animateZenRing(targetPercent) {
    const ring = document.getElementById('zen-ring-fill');
    const scoreNum = document.getElementById('zen-score-value');
    if (!ring || !scoreNum) return;

    const circumference = 534; // 2 * PI * 85
    ring.style.strokeDasharray = circumference;

    let currentPercent = 0;
    const duration = 1200; // ms
    const stepTime = 15;
    const steps = duration / stepTime;
    const increment = targetPercent / steps;

    const timer = setInterval(() => {
      currentPercent += increment;
      if (currentPercent >= targetPercent) {
        currentPercent = targetPercent;
        clearInterval(timer);
      }
      
      const roundedPercent = Math.round(currentPercent);
      scoreNum.innerText = `${roundedPercent}%`;
      
      const offset = circumference - (circumference * roundedPercent / 100);
      ring.style.strokeDashoffset = offset;
    }, stepTime);
  }

  // --- 2. WEEKLY SVG LINE SPLINE CHART ---

  function drawWeeklyChart(weeklyHours) {
    const container = document.getElementById('analytics-chart-wrap');
    if (!container) return;

    const width = container.clientWidth || 372;
    const height = 180;
    const padding = { top: 20, right: 15, bottom: 25, left: 20 };
    
    const data = weeklyHours || [0, 0, 0, 0, 0, 0, 0];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    
    const maxVal = 8; // Max hours y anchor
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    
    // Generate coordinate pairs
    const points = data.map((val, idx) => {
      const x = padding.left + (idx * (graphWidth / (data.length - 1)));
      const y = padding.top + graphHeight - (val / maxVal * graphHeight);
      return { x, y, val, day: days[idx] };
    });

    // Cubic Spline path
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cpX1 = points[i].x + (points[i+1].x - points[i].x) / 2;
      const cpY1 = points[i].y;
      const cpX2 = points[i].x + (points[i+1].x - points[i].x) / 2;
      const cpY2 = points[i+1].y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i+1].x} ${points[i+1].y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

    const svgContent = `
      <svg class="chart-svg" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#a855f7" />
            <stop offset="100%" stop-color="#06b6d4" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#a855f7" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0" />
          </linearGradient>
        </defs>
        
        <!-- Y Grid Lines -->
        <line class="chart-grid-line" x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" />
        <line class="chart-grid-line" x1="${padding.left}" y1="${padding.top + graphHeight / 2}" x2="${width - padding.right}" y2="${padding.top + graphHeight / 2}" />
        <line class="chart-grid-line" x1="${padding.left}" y1="${padding.top + graphHeight}" x2="${width - padding.right}" y2="${padding.top + graphHeight}" />
        
        <!-- Daily Goal dashed indicator line at 4 hours -->
        <line class="chart-goal-line" x1="${padding.left}" y1="${padding.top + graphHeight / 2}" x2="${width - padding.right}" y2="${padding.top + graphHeight / 2}" stroke="var(--neon-blue)" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6" />
        <text x="${width - padding.right - 60}" y="${padding.top + graphHeight / 2 - 4}" fill="var(--neon-blue)" font-size="7" font-family="'JetBrains Mono', monospace" opacity="0.8">GOAL (4h)</text>
        
        <!-- Area fill path -->
        <path class="chart-area" d="${areaD}" />
        
        <!-- Main Curve spline path -->
        <path class="chart-line" d="${pathD}" />
        
        <!-- Interactivity dot nodes -->
        ${points.map((pt, idx) => `
          <circle 
            class="chart-dot-active" 
            cx="${pt.x}" 
            cy="${pt.y}" 
            r="5" 
            data-index="${idx}"
            data-day="${pt.day}"
            data-val="${pt.val}"
          />
          <circle 
            class="chart-interactive-overlay" 
            cx="${pt.x}" 
            cy="${pt.y}" 
            r="16" 
            fill="transparent"
            data-index="${idx}"
            data-day="${pt.day}"
            data-val="${pt.val}"
          />
        `).join('')}
      </svg>
      <div id="chart-hover-tooltip" class="chart-tooltip">
        <span class="day-label">MON</span>
        <span class="val-label">3.5 hrs</span>
      </div>
    `;

    container.innerHTML = svgContent;

    // Hover interactive behaviors setup
    const tooltip = document.getElementById('chart-hover-tooltip');
    const dots = container.querySelectorAll('.chart-interactive-overlay, .chart-dot-active');

    dots.forEach(dot => {
      const showTooltip = (e) => {
        const day = dot.getAttribute('data-day');
        const val = dot.getAttribute('data-val');
        const index = dot.getAttribute('data-index');
        const pt = points[parseInt(index)];
        
        if (tooltip) {
          tooltip.querySelector('.day-label').innerText = `${day} FOCUS`;
          tooltip.querySelector('.val-label').innerText = `${val} hrs`;
          tooltip.style.opacity = '1';
          tooltip.style.left = `${pt.x}px`;
          tooltip.style.top = `${pt.y}px`;
        }
      };

      const hideTooltip = () => {
        if (tooltip) tooltip.style.opacity = '0';
      };

      dot.addEventListener('mouseenter', showTooltip);
      dot.addEventListener('mouseleave', hideTooltip);
      dot.addEventListener('touchstart', (e) => {
        e.preventDefault();
        showTooltip(e);
      });
      dot.addEventListener('touchend', hideTooltip);
    });
  }

  // --- 3. GAMIFIED ACHIEVEMENTS GRID ---

  function getBadgeProgressHint(badgeId, state) {
    const focusSessions = state.history.filter(item => item.type === 'focus');
    const completedFocus = focusSessions.filter(item => item.status === 'completed').length;
    const breathingSessions = state.history.filter(item => item.type === 'breathing' && item.status === 'completed').length;

    switch (badgeId) {
      case 'coherence_pioneer':
        return `Focus Session: ${completedFocus > 0 ? 1 : 0}/1`;
      case 'resonance_master':
        return `Breathing: ${breathingSessions > 0 ? 1 : 0}/1`;
      case 'quantum_harmonizer':
        return `Recalibrate Zen Score: ${state.unlockedBadges.includes('quantum_harmonizer') ? 1 : 0}/1`;
      case 'telemetry_novice':
        return `Reach Level 2 (Current: ${state.level}/2)`;
      case 'deep_state_archmage':
        return `Reach Level 5 (Current: ${state.level}/5)`;
      case 'zen_overlord':
        return `Streak: ${state.streak}/5 Days`;
      default:
        return '';
    }
  }

  function getBadgeProgressPercent(badgeId, state) {
    const focusSessions = state.history.filter(item => item.type === 'focus');
    const completedFocus = focusSessions.filter(item => item.status === 'completed').length;
    const breathingSessions = state.history.filter(item => item.type === 'breathing' && item.status === 'completed').length;

    switch (badgeId) {
      case 'coherence_pioneer':
        return completedFocus > 0 ? 100 : 0;
      case 'resonance_master':
        return breathingSessions > 0 ? 100 : 0;
      case 'quantum_harmonizer':
        return state.unlockedBadges.includes('quantum_harmonizer') ? 100 : 0;
      case 'telemetry_novice':
        return Math.min(100, Math.round((state.level / 2) * 100));
      case 'deep_state_archmage':
        return Math.min(100, Math.round((state.level / 5) * 100));
      case 'zen_overlord':
        return Math.min(100, Math.round((state.streak / 5) * 100));
      default:
        return 0;
    }
  }

  function renderAchievementsGrid(state) {
    const container = document.getElementById('achievements-cards-grid');
    if (!container) return;

    container.innerHTML = Constants.ACHIEVEMENTS_CATALOG.map(badge => {
      const isUnlocked = state.unlockedBadges.includes(badge.id);
      const cardClass = isUnlocked ? `achievement-card unlocked ${badge.color}` : 'achievement-card locked';
      
      const iconName = isUnlocked ? badge.icon : 'lock';
      const progressHint = getBadgeProgressHint(badge.id, state);
      const percent = getBadgeProgressPercent(badge.id, state);
      const accentColor = `var(--neon-${badge.color})`;
      const glowEffect = `0 0 6px var(--neon-${badge.color}-glow)`;

      return `
        <div class="${cardClass}" title="${badge.desc}">
          <div class="achievement-icon-container">
            <i data-lucide="${iconName}" style="width: 16px; height: 16px;"></i>
          </div>
          <span class="achievement-title">${badge.title}</span>
          <span class="achievement-xp">+${badge.xp} XP</span>
          <span class="achievement-progress">${progressHint}</span>
          
          <div style="height: 3px; background: rgba(255,255,255,0.03); border-radius: 1.5px; overflow: hidden; margin-top: 6px; width: 100%; border: 1px solid rgba(255,255,255,0.04); display: block;">
            <div style="width: ${percent}%; height: 100%; background: ${isUnlocked ? accentColor : 'var(--text-muted)'}; box-shadow: ${isUnlocked ? glowEffect : 'none'}; transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);"></div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- 4. NOTIFICATIONS FEED ---

  function renderNotificationFeed(notifications) {
    const container = document.getElementById('notification-items-wrap');
    if (!container) return;

    if (!notifications || notifications.length === 0) {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 220px; opacity: 0.7; text-align: center; gap: 12px; padding: 20px;">
          <i data-lucide="bell-off" style="width: 32px; height: 32px; color: var(--neon-pink); filter: drop-shadow(0 0 6px var(--neon-pink-glow));"></i>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Inbox Clear</span>
            <span style="font-size: 11px; color: var(--text-secondary);">No new alerts. Your coach will notify you with streaks and mindful reminders!</span>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = notifications.map(item => {
      let typeClass = 'flow';
      let iconName = 'bell';
      if (item.type === 'streak') { typeClass = 'streak'; iconName = 'flame'; }
      else if (item.type === 'break') { typeClass = 'break'; iconName = 'battery-charging'; }
      else if (item.type === 'coach') { typeClass = 'coach'; iconName = 'sparkles'; }
      else if (item.type === 'flow') { typeClass = 'flow'; iconName = 'activity'; }

      return `
        <div class="notification-item ${typeClass}" data-id="${item.id}">
          <div class="notif-icon-wrap">
            <i data-lucide="${iconName}" style="width: 14px; height: 14px;"></i>
          </div>
          <div class="notif-details">
            <div class="notif-header-line">
              <span class="notif-tag">${item.type}</span>
              <span class="notif-time">${item.timestamp}</span>
            </div>
            <span class="notif-title">${item.title}</span>
            <p class="notif-msg">${item.message}</p>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- 5. VAULT HISTORY LIST ---

  function renderHistoryList(history) {
    const container = document.getElementById('history-items-wrap');
    if (!container) return;

    if (!history || history.length === 0) {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 220px; opacity: 0.7; text-align: center; gap: 12px; padding: 20px;">
          <i data-lucide="archive" style="width: 32px; height: 32px; color: var(--neon-blue); filter: drop-shadow(0 0 6px var(--neon-blue-glow));"></i>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--text-primary);">No Sessions Yet</span>
            <span style="font-size: 11px; color: var(--text-secondary);">Complete your first deep focus timer or breathing exercise to begin logging history!</span>
          </div>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.innerHTML = history.map(item => `
      <div class="history-item ${item.status}">
        <div class="history-details-left">
          <div class="history-icon-box">
            <i data-lucide="${item.status === 'completed' ? 'check-circle-2' : 'x-circle'}"></i>
          </div>
          <div class="history-info">
            <span class="history-title">${item.title}</span>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              <span class="history-time">${item.time}</span>
              ${item.focusScore && item.status === 'completed' ? `<span class="tech-label" style="font-size: 8px; margin: 0; color: var(--neon-blue); background: rgba(6, 182, 212, 0.08); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(6, 182, 212, 0.15);">${item.focusScore} Zen</span>` : ''}
            </div>
          </div>
        </div>
        <span class="history-duration ${item.status}">${item.duration}</span>
      </div>
    `).join('');

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- 6. REACTIVE XP BAR UI ---

  function updateXPBarUI(state) {
    const xpBar = document.getElementById('user-xp-bar');
    const xpLabel = document.getElementById('user-xp-label');
    const levelLabel = document.getElementById('user-level-label');
    
    if (xpBar && xpLabel && levelLabel) {
      const prevTarget = (state.level - 1) * 500;
      const nextTarget = state.level * 500;
      const currentLevelXP = state.xp - prevTarget;
      const targetXP = nextTarget - prevTarget;
      const percent = Math.min(100, Math.max(0, (currentLevelXP / targetXP) * 100));
      
      xpBar.style.width = `${percent}%`;
      xpLabel.innerText = `${state.xp} / ${nextTarget} XP`;
      levelLabel.innerText = `LEVEL ${state.level}`;
    }
  }

  // --- 7. WEB AUDIO FFT CANVAS SPECTROGRAMS ---

  function renderVisualizerSpectrograms() {
    const canvasZen = document.getElementById('sound-visualizer-canvas');
    const canvasPortal = document.getElementById('portal-visualizer-canvas');
    
    if (!canvasZen && !canvasPortal) {
      requestAnimationFrame(renderVisualizerSpectrograms);
      return;
    }

    const state = window.FocusZenState.state;
    const isAudioActive = state.ambientSoundActive.brownnoise || 
                          state.ambientSoundActive.rain || 
                          state.ambientSoundActive.ocean || 
                          state.ambientSoundActive.lofi;

    const audioStuff = window.FocusZenServices.getAudioContext();
    const analyserNode = audioStuff.analyser;
    const dataArray = analyserNode ? new Uint8Array(analyserNode.frequencyBinCount) : null;
    
    if (analyserNode && isAudioActive && dataArray) {
      analyserNode.getByteFrequencyData(dataArray);
    }

    const drawCanvas = (canvas) => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      // Draw underlying grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      if (analyserNode && isAudioActive && dataArray) {
        if (canvas.width !== canvas.clientWidth) {
          canvas.width = canvas.clientWidth;
        }
        if (canvas.height !== canvas.clientHeight) {
          canvas.height = canvas.clientHeight;
        }

        const barWidth = (width / dataArray.length) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          barHeight = (dataArray[i] / 255) * height * 0.95;

          const hue = 220 + (i / dataArray.length) * 100;
          ctx.fillStyle = `hsla(${hue}, 85%, 65%, 0.8)`;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

          ctx.fillStyle = `hsla(${hue}, 95%, 75%, 1)`;
          ctx.fillRect(x, height - barHeight - 1.5, barWidth - 1, 1.5);

          x += barWidth;
        }
      } else {
        // Fallback breathing sinusoidal wave
        if (canvas.width !== canvas.clientWidth) {
          canvas.width = canvas.clientWidth;
        }
        if (canvas.height !== canvas.clientHeight) {
          canvas.height = canvas.clientHeight;
        }

        const time = Date.now() * 0.002;
        ctx.beginPath();
        ctx.lineWidth = 2;
        
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#a855f7');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#06b6d4');
        ctx.strokeStyle = gradient;

        for (let x = 0; x < width; x++) {
          const breathAmp = 6 + Math.sin(Date.now() * 0.001) * 3;
          const y = height / 2 + Math.sin(x * 0.04 + time) * breathAmp;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    };

    drawCanvas(canvasZen);
    drawCanvas(canvasPortal);

    requestAnimationFrame(renderVisualizerSpectrograms);
  }

  // --- RECONCILE STATE UPDATES DYNAMICALLY ---
  
  function initializeUIBindings() {
    window.FocusZenState.subscribe(state => {
      // 1. Render all listing views reactive to state changes
      renderHistoryList(state.history);
      renderNotificationFeed(state.notifications);
      renderAchievementsGrid(state);
      updateXPBarUI(state);

      // 2. Re-sync Dashboard status indicators dynamically
      const homeStreakEl = document.getElementById('metric-streak-value');
      if (homeStreakEl) {
        homeStreakEl.innerText = `${state.streak} Days`;
      }
      
      const scoreValEl = document.getElementById('stats-avg-score');
      if (scoreValEl) {
        scoreValEl.innerText = `${state.zenScore}%`;
      }

      const totalHoursEl = document.getElementById('stats-total-hours');
      const weeklySum = state.weeklyHours.reduce((acc, curr) => acc + curr, 0);
      if (totalHoursEl) {
        totalHoursEl.innerText = `${weeklySum.toFixed(1)} hrs`;
      }
      
      const deepRatioValEl = document.getElementById('metric-deep-ratio-value');
      if (deepRatioValEl) {
        const deepRatio = Utils.calculateDynamicDeepRatio(state.history);
        deepRatioValEl.innerText = `${deepRatio}%`;
      }
      
      const zenStatusEl = document.getElementById('zen-status-text');
      if (zenStatusEl) {
        zenStatusEl.innerText = Utils.getFocusScoreStatusLabel(state.zenScore);
      }

      // 3. Update Today's Mini Stats dynamically
      const sessionsCountEl = document.getElementById('daily-sessions-count');
      const focusTimeEl = document.getElementById('daily-focus-time');
      const consistencyEl = document.getElementById('daily-focus-consistency');
      const interruptionsEl = document.getElementById('daily-focus-interruptions');

      if (sessionsCountEl || focusTimeEl || consistencyEl || interruptionsEl) {
        const today = new Date().toDateString();
        
        const todayItems = state.history.filter(item => {
          if (!item.id) return false;
          const itemDate = new Date(item.id).toDateString();
          return itemDate === today;
        });

        const focusSessions = todayItems.filter(item => item.type === 'focus');
        const completed = focusSessions.filter(item => item.status === 'completed');
        const interrupted = focusSessions.filter(item => item.status === 'interrupted');

        const totalMinutes = completed.reduce((sum, item) => sum + (parseInt(item.duration) || 0), 0);
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const focusTimeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

        let flowRate = 92; // default fallback flow rate
        if (focusSessions.length > 0) {
          flowRate = Math.round((completed.length / focusSessions.length) * 100);
        } else if (state.history.length > 0) {
          const allFocus = state.history.filter(item => item.type === 'focus');
          const allCompleted = allFocus.filter(item => item.status === 'completed');
          if (allFocus.length > 0) {
            flowRate = Math.round((allCompleted.length / allFocus.length) * 100);
          }
        }

        if (sessionsCountEl) sessionsCountEl.innerText = completed.length;
        if (focusTimeEl) focusTimeEl.innerText = focusTimeStr;
        if (consistencyEl) consistencyEl.innerText = `${flowRate}%`;
        if (interruptionsEl) interruptionsEl.innerText = interrupted.length;
      }
    });
  }

  // Register Components Namespace
  window.FocusZenComponents = {
    animateZenRing,
    drawWeeklyChart,
    renderAchievementsGrid,
    renderNotificationFeed,
    renderHistoryList,
    updateXPBarUI,
    renderVisualizerSpectrograms,
    initializeUIBindings
  };
})();
