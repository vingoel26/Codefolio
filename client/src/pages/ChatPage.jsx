import ChatInterface from '../components/chat/ChatInterface';

export default function ChatPage() {
    return (
        <div className="chat-page-wrapper">
            <div className="chat-page-container">
                <ChatInterface mode="page" />
            </div>

            <style>{`
                .chat-page-wrapper {
                    height: calc(100vh - 40px);
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                }

                .chat-page-container {
                    flex: 1;
                    min-height: 0;
                    box-shadow: var(--shadow-xl);
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                    background: var(--bg-secondary);
                }
            `}</style>
        </div>
    );
}
