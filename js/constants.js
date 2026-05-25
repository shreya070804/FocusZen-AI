/* constants.js - Central HUD Static Parameters & Keys */

(function () {
  const LOCAL_STORAGE_KEY = 'focuszen_state';
  const SETTINGS_STORAGE_KEY = 'focuszen_settings';
  const NOTIFS_STORAGE_KEY = 'focuszen_notifications';
  const ACTIVE_SESSION_STORAGE_KEY = 'focuszen_active_session';

  const SYSTEM_COACH_INSTRUCTION = "You are FocusZen Coach, a supportive, mindful, and warm daily productivity and well-being coach. You are talking to Shreya, a dedicated user aiming to stay focused, mindful, and balanced. Speak like a friendly human companion (similar to headspace or calm). Avoid technical jargon, sci-fi buzzwords, or robotic phrases like 'neural synchronization', 'cognitive coherence', 'biometric feedback', 'duplex profiles', 'quantum nodes', etc. Instead, use warm, friendly, natural human terms like 'mindfulness', 'steady focus', 'gentle breath', 'calming environment', 'taking a short rest', 'healthy balance', and 'distraction-free space'. Always be positive, encouraging, conversational, and clear. Keep chat replies concise (max 3 sentences).";

  const ACHIEVEMENTS_CATALOG = [
    { id: 'coherence_pioneer', title: 'Focus Explorer', desc: 'Complete your first focus session.', xp: 100, icon: 'shield-check', color: 'blue' },
    { id: 'resonance_master', title: 'Breathing Guide', desc: 'Complete your first mindful breathing exercise.', xp: 50, icon: 'wind', color: 'purple' },
    { id: 'quantum_harmonizer', title: 'Habit Builder', desc: 'Recalibrate your daily Zen Score.', xp: 25, icon: 'zap', color: 'pink' },
    { id: 'telemetry_novice', title: 'Focus Achiever', desc: 'Reach Level 2.', xp: 150, icon: 'trending-up', color: 'blue' },
    { id: 'deep_state_archmage', title: 'Zen Master', desc: 'Reach Level 5.', xp: 300, icon: 'brain', color: 'purple' },
    { id: 'zen_overlord', title: 'Focus Champion', desc: 'Maintain a 5-day focus streak.', xp: 200, icon: 'award', color: 'pink' }
  ];

  const AI_INSIGHTS = [
    "You focus best between **8:30 AM and 11:00 AM**. This is a great window for your most important work.",
    "Using the **Rain Sounds** focus sound helped you stay focused for **18% longer** this week.",
    "Your focus score went up by **6%** after your morning breathing exercise. You're off to a great start!",
    "Your focus streak is strong! Completing just one more **25-minute session** today will help you hit your daily goal.",
    "Take a moment to reset: we noticed your focus might be drifting. We recommend a quick **4-minute breathing break** to recharge."
  ];

  const AI_COMPLETION_MESSAGES = [
    "Wonderful job! Shreya, you stayed focused and in flow. Keep up this great energy!",
    "Session completed! You stayed deeply focused and did amazing work today.",
    "Great focus, Shreya! You did a wonderful job filtering out distractions. Enjoy a well-deserved rest!",
    "Focus session complete! You did fantastic. We recommend taking a quick 4-minute breathing break now.",
    "Awesome job! You maintained great focus throughout. You're making wonderful progress!"
  ];

  window.FocusZenConstants = {
    LOCAL_STORAGE_KEY,
    SETTINGS_STORAGE_KEY,
    NOTIFS_STORAGE_KEY,
    ACTIVE_SESSION_STORAGE_KEY,
    SYSTEM_COACH_INSTRUCTION,
    ACHIEVEMENTS_CATALOG,
    AI_INSIGHTS,
    AI_COMPLETION_MESSAGES
  };
})();
