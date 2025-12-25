import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -40%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
`;

const shake = keyframes`
  0%, 100% { transform: translate(-50%, -50%); }
  10%, 30%, 50%, 70%, 90% { transform: translate(-52%, -50%); }
  20%, 40%, 60%, 80% { transform: translate(-48%, -50%); }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  animation: ${props => props.hasError ? shake : slideUp} 0.4s ease-out;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 8px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
`;

const PinDisplay = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const PinDot = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => props.filled ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e0e0e0'};
  transition: all 0.2s ease;
  box-shadow: ${props => props.filled ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none'};
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 20px;
  padding: 10px;
  background: rgba(231, 76, 60, 0.1);
  border-radius: 8px;
`;

const NumberPad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 280px;
  margin: 0 auto;
`;

const NumberButton = styled.button`
  width: 80px;
  height: 60px;
  border: none;
  border-radius: 12px;
  font-size: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${props => props.variant === 'clear' ? '#ffebee' : props.variant === 'back' ? '#e3f2fd' : '#f5f5f5'};
  color: ${props => props.variant === 'clear' ? '#e74c3c' : props.variant === 'back' ? '#2196f3' : '#333'};

  &:hover {
    transform: scale(1.05);
    background: ${props => props.variant === 'clear' ? '#ffcdd2' : props.variant === 'back' ? '#bbdefb' : '#eeeeee'};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Logo = styled.div`
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
`;

const LogoImage = styled.img`
  width: 50px;
  height: 50px;
  border-radius: 12px;
`;

const LogoText = styled.span`
  font-size: 24px;
  font-weight: 700;
`;

const AdminPinModal = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const { verifyPin } = useAdminAuth();

  const handleNumberClick = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      // Auto-submit when 4 digits entered
      if (newPin.length === 4) {
        setTimeout(() => {
          const success = verifyPin(newPin);
          if (!success) {
            setError(true);
            setPin('');
          }
        }, 200);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <ModalOverlay>
      <Logo>
        <LogoImage src="/K2-logo.jpg" alt="K2" onError={(e) => { e.target.style.display = 'none'; }} />
        <LogoText>K2 Machine Manager</LogoText>
      </Logo>

      <ModalContent hasError={error}>
        <Header>
          <IconWrapper>
            <Shield size={40} color="white" />
          </IconWrapper>
          <Title>Admin Access</Title>
          <Subtitle>Enter PIN to access the admin panel</Subtitle>
        </Header>

        <PinDisplay>
          {[0, 1, 2, 3].map((i) => (
            <PinDot key={i} filled={pin.length > i} />
          ))}
        </PinDisplay>

        {error && (
          <ErrorMessage>
            <AlertCircle size={16} />
            Incorrect PIN. Please try again.
          </ErrorMessage>
        )}

        <NumberPad>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <NumberButton key={num} onClick={() => handleNumberClick(String(num))}>
              {num}
            </NumberButton>
          ))}
          <NumberButton variant="clear" onClick={handleClear}>C</NumberButton>
          <NumberButton onClick={() => handleNumberClick('0')}>0</NumberButton>
          <NumberButton variant="back" onClick={handleBackspace}>
            <Lock size={20} />
          </NumberButton>
        </NumberPad>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AdminPinModal;
