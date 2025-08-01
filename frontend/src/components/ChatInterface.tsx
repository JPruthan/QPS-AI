import React, { useState } from 'react';
import WelcomeScreen from './WelcomeScreen';
import PromptInput from './PromptInput';
import './styles.css';

interface Message {
  type: 'question' | 'answer';
  text: string;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setMessages([{ type: 'question', text: `Processing ${file.name}...` }]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.detail || 'Upload failed');

      const questions = uploadData.questions;
      const formattedQuestions = `Extracted Questions:\n\n${questions.join('\n\n')}`;
      setMessages([{ type: 'question', text: formattedQuestions }]);

      const solveResponse = await fetch('http://localhost:8000/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questions }),
      });
      const solveData = await solveResponse.json();
      if (!solveResponse.ok) throw new Error(solveData.detail || 'Solving failed');

      setMessages(prev => [...prev, { type: 'answer', text: solveData.answer }]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setMessages([{ type: 'answer', text: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-content">
        {messages.length === 0 && !isLoading ? (
          <WelcomeScreen />
        ) : (
          <div className="message-list">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                <p>{msg.text.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>
              </div>
            ))}
            {isLoading && <div className="message answer">Thinking...</div>}
          </div>
        )}
      </div>
      <PromptInput onFileUpload={handleFileUpload} />
    </div>
  );
};

export default ChatInterface;