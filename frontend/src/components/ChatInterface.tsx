import React, { useState } from 'react';
import WelcomeScreen from './WelcomeScreen';
import PromptInput from './PromptInput';
import './styles.css';

interface QnaPair {
  question: string;
  answer: string;
}

const ChatInterface: React.FC = () => {
  const [qnaPairs, setQnaPairs] = useState<QnaPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    setStatusMessage(`Processing ${file.name}...`);
    setQnaPairs([]);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const uploadResponse = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.detail || 'Upload failed');
      const initialPairs = uploadData.questions.map((q: string) => ({ question: q, answer: '' }));
      setQnaPairs(initialPairs);
      setStatusMessage(`Extracted ${initialPairs.length} questions.`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setStatusMessage(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSolveQuestion = async (questionIndex: number) => {
     const targetQuestion = qnaPairs[questionIndex].question;
    const updatedPairs = [...qnaPairs];
    updatedPairs[questionIndex].answer = 'Getting answer from AI...';
    setQnaPairs(updatedPairs);
    try {
      const solveResponse = await fetch('http://localhost:8000/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: [targetQuestion] }),
      });
      const solveData = await solveResponse.json();
      if (!solveResponse.ok) throw new Error(solveData.detail || 'Solving failed');
      const finalPairs = [...qnaPairs];
      finalPairs[questionIndex].answer = solveData.answer;
      setQnaPairs(finalPairs);
    } catch {
       const finalPairs = [...qnaPairs];
       finalPairs[questionIndex].answer = 'Error: Could not get answer.';
       setQnaPairs(finalPairs);
    }
  };

  const handleCopyAnswer = (textToCopy: string, index: number) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  return (
    <div className="chat-interface">
      {qnaPairs.length === 0 && !isLoading ? (
        <div className="centered-content">
          <WelcomeScreen />
          <PromptInput onFileUpload={handleFileUpload} />
          {statusMessage && <p className="status-message">{statusMessage}</p>}
        </div>
      ) : (
        <div className="message-list">
          {qnaPairs.map((pair, index) => (
            <div key={index} className="qna-pair">
              <div className="message question">{pair.question}</div>
              {pair.answer ? (
                <div className="message answer">
                  <p>{pair.answer.split('\n').map((line, i) => <span key={i}>{line}<br/></span>)}</p>
                  <button 
                    className="copy-button" 
                    onClick={() => handleCopyAnswer(pair.answer, index)}
                  >
                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ) : (
                <button className="solve-button" onClick={() => handleSolveQuestion(index)}>
                  Solve this Question
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatInterface;