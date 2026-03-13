import { useEffect } from 'react';
import { useFocusStore } from '../../stores/focusStore';
import { Play, Pause, Square, X, Coffee, Brain } from 'lucide-react';

export default function FocusTimerWidget() {
    const {
        isOpen,
        isRunning,
        mode,
        timeLeft,
        task,
        toggleOpen,
        setTask,
        toggleTimer,
        resetTimer,
        switchMode,
        tick,
    } = useFocusStore();

    // Timer loop
    useEffect(() => {
        let interval;
        if (isRunning) {
            interval = setInterval(() => {
                tick();
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, tick]);

    if (!isOpen) return null;

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const isWork = mode === 'work';

    return (
        <div className="focus-widget animate-slide-up">
            <div className="focus-header">
                <div className="focus-tabs">
                    <button
                        className={`focus-tab ${isWork ? 'active' : ''}`}
                        onClick={() => switchMode('work')}
                    >
                        <Brain size={14} /> Focus
                    </button>
                    <button
                        className={`focus-tab ${!isWork ? 'active' : ''}`}
                        onClick={() => switchMode('break')}
                    >
                        <Coffee size={14} /> Break
                    </button>
                </div>
                <button className="focus-close" onClick={toggleOpen}>
                    <X size={16} />
                </button>
            </div>

            <div className="focus-body">
                <div className={`focus-time-display ${isWork ? 'text-accent' : 'text-success'}`}>
                    {formatTime(timeLeft)}
                </div>

                {isWork && (
                    <input
                        className="focus-task-input"
                        placeholder="What are you working on?"
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        disabled={isRunning}
                    />
                )}

                <div className="focus-controls">
                    <button
                        className={`focus-play-btn ${isRunning ? 'running' : ''}`}
                        onClick={toggleTimer}
                    >
                        {isRunning ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
                    </button>
                    <button className="focus-stop-btn" onClick={resetTimer} disabled={!isRunning && timeLeft === (isWork ? 25 * 60 : 5 * 60)}>
                        <Square size={16} />
                    </button>
                </div>
            </div>

            <style>{widgetStyles}</style>
        </div>
    );
}

const widgetStyles = `
.focus-widget {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 320px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    z-index: 1000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.animate-slide-up {
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

.focus-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border);
}

.focus-tabs {
    display: flex;
    gap: 4px;
    background: var(--bg-primary);
    padding: 4px;
    border-radius: 8px;
}

.focus-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.focus-tab.active {
    background: var(--bg-secondary);
    color: var(--text-primary);
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.focus-close {
    border: none;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s;
}

.focus-close:hover {
    background: rgba(255,255,255,0.1);
    color: var(--text-primary);
}

.focus-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.focus-time-display {
    font-size: 4rem;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    font-family: 'JetBrains Mono', monospace;
}

.text-accent { color: var(--accent); }
.text-success { color: #4caf50; }

.focus-task-input {
    width: 100%;
    padding: 10px 14px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 0.9rem;
    text-align: center;
    outline: none;
    transition: all 0.2s;
}

.focus-task-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 20%, transparent);
}

.focus-task-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.focus-controls {
    display: flex;
    align-items: center;
    gap: 16px;
}

.focus-play-btn {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: none;
    background: var(--accent);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 40%, transparent);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.focus-play-btn:hover {
    transform: scale(1.05);
}

.focus-play-btn:active {
    transform: scale(0.95);
}

.focus-play-btn.running {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    box-shadow: none;
    border: 2px solid var(--border);
}

.focus-stop-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.focus-stop-btn:hover:not(:disabled) {
    border-color: #ff5252;
    color: #ff5252;
}

.focus-stop-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.ml-1 { margin-left: 4px; }
`;
