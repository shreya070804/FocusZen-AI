/* storage.js - Persistent LocalStorage Engine Sandboxing */

(function () {
  const Keys = window.FocusZenConstants;

  function loadState(defaults) {
    try {
      const saved = localStorage.getItem(Keys.LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Storage Error: Failed to parse user state:", e);
    }
    return defaults;
  }

  function saveState(state) {
    try {
      const dataToSave = {
        zenScore: state.zenScore,
        streak: state.streak,
        weeklyHours: state.weeklyHours,
        history: state.history,
        xp: state.xp,
        level: state.level,
        unlockedBadges: state.unlockedBadges
      };
      localStorage.setItem(Keys.LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error("Storage Error: Failed to write user state:", e);
    }
  }

  function loadSettings(defaults) {
    try {
      const saved = localStorage.getItem(Keys.SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Storage Error: Failed to parse settings:", e);
    }
    return defaults;
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(Keys.SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Storage Error: Failed to write settings:", e);
    }
  }

  function loadNotifications(defaults) {
    try {
      const saved = localStorage.getItem(Keys.NOTIFS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Storage Error: Failed to parse notifications:", e);
    }
    return defaults;
  }

  function saveNotifications(notifications) {
    try {
      localStorage.setItem(Keys.NOTIFS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error("Storage Error: Failed to write notifications:", e);
    }
  }

  function loadActiveSession() {
    try {
      const saved = localStorage.getItem(Keys.ACTIVE_SESSION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Storage Error: Failed to read active session:", e);
    }
    return null;
  }

  function saveActiveSession(sessionData) {
    try {
      localStorage.setItem(Keys.ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.error("Storage Error: Failed to write active session:", e);
    }
  }

  function clearActiveSession() {
    try {
      localStorage.removeItem(Keys.ACTIVE_SESSION_STORAGE_KEY);
    } catch (e) {
      console.error("Storage Error: Failed to clear active session:", e);
    }
  }

  function clearAllData() {
    try {
      localStorage.removeItem(Keys.LOCAL_STORAGE_KEY);
      localStorage.removeItem(Keys.SETTINGS_STORAGE_KEY);
      localStorage.removeItem(Keys.NOTIFS_STORAGE_KEY);
      localStorage.removeItem(Keys.ACTIVE_SESSION_STORAGE_KEY);
      localStorage.removeItem('focuszen_onboarded');
      localStorage.removeItem('focuszen_user_goal');
      localStorage.removeItem('focuszen_current_user');
    } catch (e) {
      console.error("Storage Error: Failed to reset storage sandbox:", e);
    }
  }

  window.FocusZenStorage = {
    loadState,
    saveState,
    loadSettings,
    saveSettings,
    loadNotifications,
    saveNotifications,
    loadActiveSession,
    saveActiveSession,
    clearActiveSession,
    clearAllData
  };
})();
