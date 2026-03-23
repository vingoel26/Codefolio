import React, { useEffect, useState } from 'react';

const SplashScreen = () => {
    const [message, setMessage] = useState('Initializing Codefolio...');
    const [showWakeupText, setShowWakeupText] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMessage('Waking up the server...');
            setShowWakeupText(true);
        }, 3000); // If it takes more than 3 seconds, show wake up text

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="splash-screen">
            <div className="splash-content">
                <div className="splash-logo-container">
                    <div className="splash-logo">CF</div>
                    <div className="splash-pulse" />
                </div>
                
                <h1 className="splash-title">Codefolio</h1>
                <p className="splash-message">{message}</p>
                
                <div className="splash-loader">
                    <div className="loader-progress" />
                </div>

                {showWakeupText && (
                    <p className="splash-hint">
                        Our free-tier server takes a few seconds to wake up. <br />
                        Hang tight, we're almost there!
                    </p>
                )}
            </div>

            <style>{`
                .splash-screen {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: #0f172a; /* Dark sleek background */
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    color: white;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }

                .splash-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    gap: 24px;
                }

                .splash-logo-container {
                    position: relative;
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .splash-logo {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, #6c5ce7, #00cec9);
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: 800;
                    color: white;
                    z-index: 2;
                    box-shadow: 0 10px 30px rgba(108, 92, 231, 0.4);
                }

                .splash-pulse {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: rgba(108, 92, 231, 0.4);
                    border-radius: 20px;
                    z-index: 1;
                    animation: pulse 2s infinite ease-out;
                }

                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.8); opacity: 0; }
                }

                .splash-title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    letter-spacing: -0.05em;
                    margin: 0;
                    background: linear-gradient(to right, #fff, #94a3b8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .splash-message {
                    font-size: 1.1rem;
                    color: #94a3b8;
                    font-weight: 500;
                    margin: 0;
                }

                .splash-loader {
                    width: 200px;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    overflow: hidden;
                }

                .loader-progress {
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(to right, #6c5ce7, #00cec9);
                    animation: progress 2s infinite ease-in-out;
                    transform-origin: left;
                }

                @keyframes progress {
                    0% { transform: scaleX(0); }
                    50% { transform: scaleX(0.7); }
                    100% { transform: scaleX(1); opacity: 0; }
                }

                .splash-hint {
                    margin-top: 20px;
                    font-size: 0.85rem;
                    line-height: 1.5;
                    color: #64748b;
                    max-width: 300px;
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
