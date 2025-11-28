import React, { useState, useRef, useEffect } from 'react';
import './CustomSelect.css';

const CustomSelect = ({ value, onChange, options, placeholder, className = '', label }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // 找到當前選中的選項物件
  const selectedOption = options.find(opt => opt.value === value);

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`custom-select-container ${className}`} ref={containerRef}>
      {label && <label className="custom-select-label">{label}</label>}
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'value-text' : 'placeholder-text'}>
          {selectedOption ? selectedOption.label : placeholder || '請選擇'}
        </span>
        <div className="arrow-icon">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      
      {isOpen && (
        <div className="custom-select-options">
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-option ${value === option.value ? 'selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
              {value === option.value && (
                <span className="check-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </span>
              )}
            </div>
          ))}
          {options.length === 0 && (
            <div className="custom-option no-options">無選項</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;

