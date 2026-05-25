/* state.js - Central State Hub & XP Progression Store */

(function () {
  const Storage = window.FocusZenStorage;
  const Utils = window.FocusZenUtils;
  const Services = window.FocusZenServices;

  // Central Application State baseline defaults
  const state = {
    currentTab: 'home',
    currentUser: null,
    zenScore: 85,
    streak: 0,
    weeklyHours: [0, 0, 0, 0, 0, 0, 0],
    focusActive: false,
    timerDuration: 25 * 60,
    timerRemaining: 25 * 60,
    timerInterval: null,
    timerPaused: false,
    ambientSoundActive: {
      brownnoise: false,
      rain: false,
      ocean: false,
      lofi: false
    },
    settings: {
      focusDuration: 25,
      aiEnabled: true,
      soundEnabled: true,
      notificationsEnabled: true,
      ultraDarkEnabled: true,
      geminiKey: "",
      breakAlerts: true,
      streakAlerts: true,
      aiAlerts: true
    },
    xp: 0,
    level: 1,
    unlockedBadges: [],
    notifications: [],
    chatLog: [],
    history: []
  };

  // Pub/Sub subscribers list
  const subscribers = [];

  function subscribe(callback) {
    if (typeof callback === 'function') {
      subscribers.push(callback);
    }
  }

  function notify() {
    subscribers.forEach(cb => {
      try { cb(state); } catch(e) { console.error("Subscriber execution failed:", e); }
    });
  }

  function loadState() {
    // 1. Establish session authentication from localStorage
    try {
      const savedUser = localStorage.getItem('focuszen_current_user');
      if (savedUser) {
        state.currentUser = JSON.parse(savedUser);
      }
    } catch (e) {
      console.error("State Error: Failed to restore user session:", e);
    }

    // 2. Load storage configurations
    const loadedData = Storage.loadState({
      zenScore: 85,
      streak: 0,
      weeklyHours: [0, 0, 0, 0, 0, 0, 0],
      history: [],
      xp: 0,
      level: 1,
      unlockedBadges: []
    });

    state.zenScore = loadedData.zenScore;
    state.streak = loadedData.streak;
    state.weeklyHours = loadedData.weeklyHours;
    state.history = loadedData.history;
    state.xp = loadedData.xp;
    state.level = loadedData.level;
    state.unlockedBadges = loadedData.unlockedBadges;

    // Load Settings
    state.settings = Storage.loadSettings(state.settings);

    // Load Notifications
    const defaultNotif = [
      { 
        id: Date.now() - 10 * 60 * 1000, 
        type: 'coach', 
        title: 'AI Productivity Tip', 
        message: "Focus on one item at a time. Multi-tasking decreases your efficiency.", 
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }
    ];
    state.notifications = Storage.loadNotifications(defaultNotif);

    // Sync timer config parameters
    state.timerDuration = state.settings.focusDuration * 60;
    state.timerRemaining = state.timerDuration;
    
    notify();
  }

  function saveState() {
    Storage.saveState(state);
    Storage.saveSettings(state.settings);
    Storage.saveNotifications(state.notifications);
  }

  // --- XP & Progression Systems ---

  function gainXP(amount) {
    state.xp += amount;
    const currentLevelTarget = state.level * 500;
    
    if (state.xp >= currentLevelTarget) {
      state.level += 1;
      Services.playLevelChime();
      triggerNotification(
        'flow',
        'Level Up!',
        `Congratulations! You reached Level ${state.level}. You are building great focus habits!`
      );
    }
    
    saveState();
    notify();
    checkAchievements();
  }

  function unlockAchievement(badgeId) {
    if (state.unlockedBadges.includes(badgeId)) return;
    state.unlockedBadges.push(badgeId);
    
    const badge = window.FocusZenConstants.ACHIEVEMENTS_CATALOG.find(b => b.id === badgeId);
    if (!badge) return;

    Services.playUnlockChime();
    state.xp += badge.xp;
    
    const popup = document.getElementById('achievement-unlock-popup');
    const badgeNameEl = document.getElementById('unlock-badge-name');
    const badgeDescEl = document.getElementById('unlock-badge-desc');

    if (popup && badgeNameEl && badgeDescEl) {
      badgeNameEl.innerText = badge.title;
      badgeDescEl.innerText = `${badge.desc} (+${badge.xp} XP Granted)`;

      popup.classList.add('active');
      
      if (window.unlockTimeout) clearTimeout(window.unlockTimeout);
      window.unlockTimeout = setTimeout(() => {
        popup.classList.remove('active');
      }, 5000);
    }
    
    triggerNotification(
      'coach',
      'Achievement Unlocked!',
      `You unlocked the [${badge.title}] badge! (+${badge.xp} XP earned)`
    );
    saveState();
    notify();
  }

  function checkAchievements() {
    let newlyUnlocked = false;

    window.FocusZenConstants.ACHIEVEMENTS_CATALOG.forEach(badge => {
      if (state.unlockedBadges.includes(badge.id)) return;

      let criteriaMet = false;

      if (badge.id === 'coherence_pioneer') {
        criteriaMet = state.history.some(item => item.status === 'completed' && item.type === 'focus');
      } else if (badge.id === 'resonance_master') {
        criteriaMet = state.history.some(item => item.status === 'completed' && item.type === 'breathing');
      } else if (badge.id === 'quantum_harmonizer') {
        // Recalibrated Zen score triggers directly in recalibrate handler
      } else if (badge.id === 'telemetry_novice') {
        criteriaMet = state.level >= 2;
      } else if (badge.id === 'deep_state_archmage') {
        criteriaMet = state.level >= 5;
      } else if (badge.id === 'zen_overlord') {
        criteriaMet = state.streak >= 5;
      }

      if (criteriaMet) {
        unlockAchievement(badge.id);
        newlyUnlocked = true;
      }
    });

    if (newlyUnlocked) {
      saveState();
      notify();
    }
  }

  // --- Notifications Dispenser ---

  function triggerNotification(type, title, message) {
    if (type === 'break' && !state.settings.breakAlerts) return;
    if (type === 'streak' && !state.settings.streakAlerts) return;
    if (type === 'coach' && !state.settings.aiAlerts) return;
    if (!state.settings.notificationsEnabled) return;

    const now = Date.now();
    const timestamp = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newAlert = {
      id: now,
      type, // 'break', 'streak', 'coach', 'flow'
      title,
      message,
      timestamp
    };
    state.notifications.unshift(newAlert);
    saveState();
    
    const badge = document.getElementById('notification-badge');
    if (badge) {
      badge.style.display = 'block';
    }
    
    Services.playNotificationChime();

    const toast = document.getElementById('neon-toast-alert');
    const toastIcon = document.getElementById('toast-icon');
    const toastTag = document.getElementById('toast-tag');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');

    if (toast && toastTag && toastTitle && toastMessage) {
      toastTag.innerText = type === 'streak' ? 'Focus Streak' : (type === 'break' ? 'Time for a Rest' : 'Mindful Reflection');
      toastTitle.innerText = title;
      toastMessage.innerText = message;

      let iconName = 'bell-ring';
      if (type === 'streak') iconName = 'flame';
      else if (type === 'break') iconName = 'battery-charging';
      else if (type === 'coach') iconName = 'sparkles';
      else if (type === 'flow') iconName = 'activity';
      
      if (toastIcon) {
        toastIcon.setAttribute('data-lucide', iconName);
        if (window.lucide) window.lucide.createIcons();
      }

      toast.classList.add('active');

      if (window.toastTimeout) clearTimeout(window.toastTimeout);
      window.toastTimeout = setTimeout(() => {
        toast.classList.remove('active');
      }, 4500);
    }

    notify();
  }

  // Export State Namespace
  window.FocusZenState = {
    state,
    subscribe,
    notify,
    loadState,
    saveState,
    gainXP,
    unlockAchievement,
    checkAchievements,
    triggerNotification
  };
})();
