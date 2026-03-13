import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const DEFAULT_WORK = 25 * 60; // 25 minutes
const DEFAULT_BREAK = 5 * 60; // 5 minutes

export const useFocusStore = create(
    persist(
        (set, get) => ({
            isOpen: false,
            isRunning: false,
            mode: 'work', // 'work' | 'break'
            timeLeft: DEFAULT_WORK,
            task: '',
            sessionStartTime: null,

            // UI Actions
            toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
            setTask: (t) => set({ task: t }),

            // Timer Actions
            toggleTimer: () => {
                const { isRunning, mode, startSession } = get();
                if (!isRunning) {
                    if (!get().sessionStartTime && mode === 'work') startSession();
                    set({ isRunning: true });
                } else {
                    set({ isRunning: false });
                }
            },

            tick: () => {
                const { isRunning, timeLeft, mode, completeSession } = get();
                if (!isRunning) return;

                if (timeLeft <= 1) {
                    // Timer finished
                    if (mode === 'work') {
                        completeSession();
                        set({ mode: 'break', timeLeft: DEFAULT_BREAK, isRunning: false, sessionStartTime: null });
                        // Optional: Play a sound or show a system notification here
                        alert('Focus session complete! Take a break.');
                    } else {
                        // Break finished
                        set({ mode: 'work', timeLeft: DEFAULT_WORK, isRunning: false });
                        alert('Break is over! Ready to focus?');
                    }
                } else {
                    set({ timeLeft: timeLeft - 1 });
                }
            },

            resetTimer: () => {
                const { mode } = get();
                set({
                    isRunning: false,
                    timeLeft: mode === 'work' ? DEFAULT_WORK : DEFAULT_BREAK,
                    sessionStartTime: null,
                });
            },

            switchMode: (newMode) => {
                set({
                    mode: newMode,
                    isRunning: false,
                    timeLeft: newMode === 'work' ? DEFAULT_WORK : DEFAULT_BREAK,
                    sessionStartTime: null,
                });
            },

            // Backend Sync
            startSession: () => set({ sessionStartTime: Date.now() }),

            completeSession: async () => {
                const { sessionStartTime, task } = get();
                if (!sessionStartTime) return;

                const endTime = Date.now();
                const duration = Math.floor((endTime - sessionStartTime) / 1000);

                // Only save sessions that lasted at least 1 minute to prevent spam
                if (duration < 60) return;

                try {
                    const token = localStorage.getItem('auth-storage') ? JSON.parse(localStorage.getItem('auth-storage')).state?.accessToken : null;
                    if (!token) return;

                    await fetch(`${API}/focus`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            startTime: new Date(sessionStartTime),
                            endTime: new Date(endTime),
                            duration,
                            task,
                            status: 'completed'
                        })
                    });
                } catch (err) {
                    console.error('Failed to save focus session:', err);
                }
            }
        }),
        {
            name: 'focus-storage',
            partialize: (state) => ({
                isOpen: state.isOpen,
                mode: state.mode,
                timeLeft: state.timeLeft,
                task: state.task,
                // Do NOT persist isRunning — if they reload the page, the timer pauses intentionally
                // to avoid complicated background sync logic for V1.
            }),
        }
    )
);
