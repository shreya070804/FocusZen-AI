/* utils.js - Mathematical Formulas, Streaks, & Formatters */

(function () {
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday-start week
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  }

  function calculateStreak(history) {
    const completedDates = new Set();
    history.forEach(item => {
      if (item.status === 'completed' && item.id > 100000) {
        const date = new Date(item.id);
        const dateStr = date.toISOString().split('T')[0];
        completedDates.add(dateStr);
      }
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let currentStreak = 0;

    if (completedDates.has(todayStr)) {
      currentStreak = 1;
      let daysAgo = 1;
      while (true) {
        const prevDate = new Date();
        prevDate.setDate(prevDate.getDate() - daysAgo);
        const prevDateStr = prevDate.toISOString().split('T')[0];
        if (completedDates.has(prevDateStr)) {
          currentStreak++;
          daysAgo++;
        } else {
          break;
        }
      }
    } else if (completedDates.has(yesterdayStr)) {
      currentStreak = 1;
      let daysAgo = 2;
      while (true) {
        const prevDate = new Date();
        prevDate.setDate(prevDate.getDate() - daysAgo);
        const prevDateStr = prevDate.toISOString().split('T')[0];
        if (completedDates.has(prevDateStr)) {
          currentStreak++;
          daysAgo++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }

    return currentStreak;
  }

  function getWeeklyHoursFromHistory(history) {
    const weeklyHours = [0, 0, 0, 0, 0, 0, 0];
    const startOfWeek = getStartOfWeek(new Date());
    const startOfWeekMs = startOfWeek.getTime();
    const endOfWeekMs = startOfWeekMs + 7 * 24 * 60 * 60 * 1000;

    history.forEach(item => {
      const timestamp = item.id;
      if (timestamp >= startOfWeekMs && timestamp < endOfWeekMs && item.status === 'completed') {
        const date = new Date(timestamp);
        let dayIndex = date.getDay() - 1; // 0 (Mon) to 6 (Sun)
        if (dayIndex === -1) dayIndex = 6; // Sunday is index 6
        
        const mins = parseInt(item.duration) || 0;
        const hours = mins / 60;
        weeklyHours[dayIndex] += hours;
      }
    });

    return weeklyHours.map(h => parseFloat(h.toFixed(1)));
  }

  function getPreviousWeekHours(history) {
    const startOfCurrentWeek = getStartOfWeek(new Date());
    const startOfCurrentWeekMs = startOfCurrentWeek.getTime();
    const startOfPreviousWeekMs = startOfCurrentWeekMs - 7 * 24 * 60 * 60 * 1000;
    
    let totalMins = 0;
    history.forEach(item => {
      const timestamp = item.id;
      if (timestamp >= startOfPreviousWeekMs && timestamp < startOfCurrentWeekMs && item.status === 'completed' && item.type === 'focus') {
        totalMins += parseInt(item.duration) || 0;
      }
    });
    return totalMins / 60;
  }

  function calculateDynamicZenScore(history, streak) {
    const focusSessions = history.filter(item => item.type === 'focus');
    if (focusSessions.length === 0) {
      return 85; // Default score if no focus sessions registered
    }

    const completed = focusSessions.filter(item => item.status === 'completed');
    const interrupted = focusSessions.filter(item => item.status === 'interrupted');
    const completionRate = completed.length / focusSessions.length;

    // Total focus time weight
    const totalFocusMins = completed.reduce((sum, item) => sum + (parseInt(item.duration) || 0), 0);

    // Active streak factor
    let streakFactor = 0.8;
    if (streak > 0) {
      streakFactor = 0.8 + Math.min(0.25, streak * 0.03); // Max 1.05x boost
    }

    // Interruption penalties
    const interruptionPenalty = interrupted.length * 5;

    // Score synthesis
    let score = (completionRate * 95) * streakFactor - interruptionPenalty;

    // Focus time bonus
    const timeBonus = Math.min(10, (totalFocusMins / 60) * 1.5);
    score += timeBonus;

    // Clamp score between 50 and 100
    return Math.min(100, Math.max(50, Math.round(score)));
  }

  function calculateDynamicDeepRatio(history) {
    const focusSessions = history.filter(item => item.type === 'focus');
    if (focusSessions.length === 0) {
      return 90; // Default deep ratio
    }
    const completed = focusSessions.filter(item => item.status === 'completed');
    return Math.round((completed.length / focusSessions.length) * 100);
  }

  function getFocusScoreStatusLabel(score) {
    if (score < 60) {
      return "BUILDING MOMENTUM";
    } else if (score <= 85) {
      return "IN THE ZONE";
    } else {
      return "CALM AND STEADY";
    }
  }

  window.FocusZenUtils = {
    formatTime,
    getStartOfWeek,
    calculateStreak,
    getWeeklyHoursFromHistory,
    getPreviousWeekHours,
    calculateDynamicZenScore,
    calculateDynamicDeepRatio,
    getFocusScoreStatusLabel
  };
})();
