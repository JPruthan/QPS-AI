import React, { useRef } from 'react';
import type { ChangeEvent } from 'react';
import './styles.css';

interface PromptInputProps {
  onFileUpload: (file: File) => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onFileUpload(event.target.files[0]);
    }
  };

  return (
    <div className="prompt-input-container">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: 'none' }}
        accept=".pdf, image/*"
      />
      <div className="prompt-form">
        <button type="button" className="icon-button" onClick={handleFileButtonClick}>
          📎 File upload
        </button>
        <button type="submit" className="send-button">➤</button>
      </div>
    </div>
  );
};

export default PromptInput;