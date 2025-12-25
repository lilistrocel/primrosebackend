import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { ShoppingCart, Plus, Minus, Coffee, Heart, Star, ArrowLeft, Check, X, Maximize, Minimize, Printer, AlertTriangle, RefreshCw, ShoppingBag } from 'lucide-react';
import { receiptPrinter } from '../utils/receiptPrinter';
import CustomizationModal from '../components/Kiosk/CustomizationModal';
import { getApiUrl, getApiBaseUrl, getImageUrl, API_ENDPOINTS } from '../utils/config';
import currencyUtils from '../utils/currency';
import webSocketClient from '../utils/websocket';
import { useLanguage } from '../contexts/LanguageContext';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const Container = styled.div`
  height: 100vh;
  background: #f8f9fb;
  display: flex;
  font-family: 'Figtree', 'Inter', 'Segoe UI', sans-serif;
  position: relative;
  overflow: hidden;
  direction: ${props => props.$isRTL ? 'rtl' : 'ltr'};
`;

const LeftPanel = styled.div`
  flex: 1;
  padding: 40px;
  padding-right: 420px; /* Space for fixed right panel (380px + 40px padding) */
  background: white;
  overflow-y: auto;
  height: 100vh;

  /* Mobile: Add padding at bottom for footer */
  @media (max-width: 768px) {
    padding: 20px;
    padding-right: 20px;
    padding-bottom: 45vh; /* Space for fixed footer */
    height: auto;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding: 20px 0;
  border-bottom: 2px solid #f1f5f9;
  
  .logo {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;
    
    .logo-icon {
      width: 100px;
      height: 80px;
      background: transparent;
      border-radius: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2d3748;
      font-size: 32px;
      font-weight: bold;
      transition: all 0.3s ease;
      position: relative;
      padding: 20px;
      
      &:hover {
        transform: translateY(-2px);
      }
    }
    
    .brand-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      .brand-name {
        font-size: 36px;
        font-weight: 800;
        color: #2d3748;
        letter-spacing: -0.8px;
        line-height: 1;
        background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .brand-tagline {
        font-size: 14px;
        font-weight: 500;
        color: #718096;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }
    }
  }
  
  .language-selector {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    
    &:hover {
      background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .flag {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      background: linear-gradient(to bottom, #1e40af, #3b82f6, #ef4444);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    span {
      font-size: 16px;
      font-weight: 600;
      color: #4a5568;
      letter-spacing: 0.2px;
    }
  }
  
  .header-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .fullscreen-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    color: #4a5568;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    
    &:hover {
      background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
      color: #2d3748;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .fullscreen-icon {
      width: 20px;
      height: 20px;
    }
  }

  .mobile-refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
    border: 1px solid #ff6b35;
    border-radius: 12px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%);
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
    }
    
    .refresh-icon {
      width: 20px;
      height: 20px;
    }
  }
  
  /* Responsive design for different screen sizes */
  @media (max-width: 768px) {
    padding: 16px 0;
    
    .logo {
      gap: 16px;
      
      .logo-icon {
        width: 80px;
        height: 64px;
        border-radius: 0;
        padding: 16px;
        background: transparent;
      }
      
      .brand-info {
        .brand-name {
          font-size: 28px;
          letter-spacing: -0.6px;
        }
        
        .brand-tagline {
          font-size: 12px;
        }
      }
    }
    
    .language-selector {
      padding: 10px 16px;
      
      .flag {
        width: 20px;
        height: 20px;
      }
      
      span {
        font-size: 14px;
      }
    }
  }
  
  @media (max-width: 480px) {
    flex-direction: column;
    gap: 20px;
    align-items: flex-start;
    
    .logo {
      gap: 12px;
      
      .logo-icon {
        width: 70px;
        height: 56px;
        border-radius: 0;
        padding: 14px;
        background: transparent;
      }
      
      .brand-info {
        .brand-name {
          font-size: 24px;
          letter-spacing: -0.4px;
        }
        
        .brand-tagline {
          font-size: 11px;
        }
      }
    }
  }
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 24px;
  letter-spacing: -0.3px;
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  padding: 8px;
  background: #f8f9fb;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  .category-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 12px;
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    min-width: max-content;
    
    &:hover {
      background: rgba(255, 107, 53, 0.1);
      color: #ff6b35;
      transform: translateY(-1px);
    }
    
    &.active {
      background: #ff6b35;
      color: white;
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
      
      &:hover {
        background: #e55a2b;
        transform: translateY(-1px);
      }
    }
    
    .category-icon {
      width: 16px;
      height: 16px;
    }
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 40px;

  /* Large screens: 3 columns */
  @media (min-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  /* Mobile: 2 columns with smaller gap */
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  /* Very small screens: Keep 2 columns but smaller gap */
  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  /* Tiny screens: Fall back to 1 column */
  @media (max-width: 360px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const ProductCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  animation: ${fadeIn} 0.5s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 320px; /* Fixed height for consistency */
  
  /* Mobile: Compact card for 2-column layout */
  @media (max-width: 768px) {
    height: auto;
    min-height: 240px;
    padding: 12px;
    border-radius: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 10px;
    border-radius: 14px;
  }
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 40px rgba(255, 107, 53, 0.15);
    border-color: #ff6b35;
    
    /* Mobile: Reduce hover effect */
    @media (max-width: 768px) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(255, 107, 53, 0.1);
    }
    
    .product-image {
      transform: scale(1.05);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
      
      /* Mobile: Reduce scale effect */
      @media (max-width: 768px) {
        transform: scale(1.02);
      }
    }
  }
  
  &:active {
    transform: translateY(-3px);
    
    /* Mobile: Reduce active effect */
    @media (max-width: 768px) {
      transform: translateY(-1px);
    }
  }
  
  /* Unavailable state */
  &.unavailable {
    background: #f7f7f7;
    border-color: #d1d5db;
    cursor: not-allowed;
    opacity: 0.6;
    
    &:hover {
      transform: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border-color: #d1d5db;
      
      .product-image {
        transform: none;
        box-shadow: none;
      }
    }
    
    .product-image {
      filter: grayscale(100%);
      opacity: 0.5;
    }
    
    .product-name, .product-price {
      color: #9ca3af;
    }
    
    .add-to-cart-btn {
      background: #e5e7eb;
      color: #9ca3af;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
      
      &:hover {
        background: #e5e7eb;
        transform: none;
        box-shadow: none;
      }
    }
  }
  
  .product-image {
    width: 100%;
    height: 160px; /* Much larger image area */
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #ffeaa7, #fab1a0);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    /* Mobile: Smaller image */
    @media (max-width: 768px) {
      height: 120px;
      margin-bottom: 10px;
      border-radius: 12px;
    }
    
    @media (max-width: 480px) {
      height: 100px;
      margin-bottom: 8px;
    }
    font-size: 3rem;
    position: relative;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    /* Image container for better presentation */
    img {
      transition: all 0.3s ease;
      filter: brightness(1.05) contrast(1.1);
    }
    
    &:hover img {
      filter: brightness(1.1) contrast(1.15);
    }
    
    &.espresso { 
      background: linear-gradient(135deg, #8b4513, #a0522d);
      color: white;
    }
    &.cappuccino { 
      background: linear-gradient(135deg, #deb887, #d2b48c);
      color: #654321;
    }
    &.latte { 
      background: linear-gradient(135deg, #f5deb3, #daa520);
      color: #8b4513;
    }
    &.americano { 
      background: linear-gradient(135deg, #696969, #708090);
      color: white;
    }
  }
  
  .product-name {
    font-size: 20px;
    font-weight: 700;
    color: #2d3748;
    margin-bottom: 6px;
    text-align: center;
    line-height: 1.2;
    flex-shrink: 0;
    
    /* Mobile: Smaller text */
    @media (max-width: 768px) {
      font-size: 16px;
      margin-bottom: 4px;
    }
    
    @media (max-width: 480px) {
      font-size: 14px;
      line-height: 1.3;
    }
  }
  
  .product-price {
    font-size: 18px;
    font-weight: 800;
    color: #ff6b35;
    text-align: center;
    margin-bottom: 12px;
    flex-shrink: 0;
    
    /* Mobile: Smaller text */
    @media (max-width: 768px) {
      font-size: 16px;
      margin-bottom: 8px;
    }
    
    @media (max-width: 480px) {
      font-size: 14px;
      margin-bottom: 6px;
    }
  }
  
  .add-to-cart-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto; /* Push to bottom */
    padding-top: 8px;
    
    /* Mobile: Smaller gap */
    @media (max-width: 768px) {
      gap: 6px;
      padding-top: 6px;
    }
    
    .add-to-cart-btn {
      width: 100%;
      height: 44px;
      border-radius: 12px;
      border: none;
      background: #ff6b35;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      
      /* Mobile: Smaller button */
      @media (max-width: 768px) {
        height: 40px;
        font-size: 14px;
        border-radius: 10px;
      }
      
      @media (max-width: 480px) {
        height: 36px;
        font-size: 13px;
        border-radius: 8px;
      }
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);
      
      &:hover {
        background: #e55a2b;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
      }
      
      &:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);
      }
      
      &:disabled {
        background: #e5e7eb;
        color: #9ca3af;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
        
        &:hover {
          background: #e5e7eb;
          transform: none;
          box-shadow: none;
        }
      }
      
      .cart-icon {
        width: 18px;
        height: 18px;
      }
    }
    
    .unavailable-message {
      text-align: center;
      font-size: 12px;
      color: #ef4444;
      font-weight: 500;
      margin-top: 4px;
    }
  }
  
  .favorite-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(255, 107, 53, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 1);
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.2);
      border-color: #ff6b35;
    }
    
    .heart-icon {
      width: 18px;
      height: 18px;
    }
  }
`;

const AvailabilityBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 5;
  
  &.available {
    background: #10b981;
    color: white;
    display: none; /* Only show when unavailable */
  }
  
  &.unavailable {
    background: #ef4444;
    color: white;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .icon {
    width: 12px;
    height: 12px;
  }
`;

const RightPanel = styled.div`
  width: 380px;
  min-width: 380px;
  background: #2d3748;
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  z-index: 50;

  /* Mobile: Move to bottom as footer */
  @media (max-width: 768px) {
    position: fixed;
    bottom: 0;
    top: auto;
    left: 0;
    right: 0;
    width: 100%;
    min-width: unset;
    height: auto;
    max-height: 40vh;
    z-index: 100;
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
  }
`;

const QueueSection = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #4a5568;
  
  /* Mobile: Compact layout */
  @media (max-width: 768px) {
    padding: 12px 16px;
    max-height: 15vh;
    overflow-y: auto;
  }
  
  .queue-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    
    /* Mobile: Smaller spacing */
    @media (max-width: 768px) {
      margin-bottom: 8px;
    }
    
    h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      color: #e2e8f0;
      
      /* Mobile: Smaller text */
      @media (max-width: 768px) {
        font-size: 14px;
      }
    }
    
    .queue-count {
      background: #ff6b35;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      
      /* Mobile: Smaller badge */
      @media (max-width: 768px) {
        padding: 2px 6px;
        font-size: 10px;
      }
    }
  }
  
  .queue-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 120px;
    overflow-y: auto;
    
    /* Mobile: Smaller max height */
    @media (max-width: 768px) {
      max-height: 80px;
      gap: 6px;
    }
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: #4a5568;
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #718096;
      border-radius: 4px;
    }
  }
  
  .queue-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    font-size: 14px;
    
    /* Mobile: Compact item */
    @media (max-width: 768px) {
      padding: 6px 10px;
      font-size: 12px;
    }
    
    .order-info {
      flex: 1;
      
      .order-num {
        font-weight: 600;
        color: #ff6b35;
        font-size: 12px;
        
        /* Mobile: Smaller text */
        @media (max-width: 768px) {
          font-size: 11px;
        }
      }
      
      .order-items {
        color: #cbd5e0;
        font-size: 12px;
        margin-top: 2px;
        
        /* Mobile: Smaller text */
        @media (max-width: 768px) {
          font-size: 10px;
        }
      }
    }
    
    .order-status {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      
      /* Mobile: Smaller badge */
      @media (max-width: 768px) {
        font-size: 9px;
        padding: 2px 4px;
      }
      
      &.queuing {
        background: rgba(59, 130, 246, 0.2);
        color: #93c5fd;
      }
      
      &.processing {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
      }
    }
  }
  
  .empty-queue {
    text-align: center;
    color: #718096;
    font-size: 14px;
    padding: 20px 0;
    
    /* Mobile: Compact empty state */
    @media (max-width: 768px) {
      font-size: 12px;
      padding: 12px 0;
    }
  }
`;

const CartHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #4a5568;
  
  /* Mobile: Compact header */
  @media (max-width: 768px) {
    padding: 12px 16px;
  }
  
  .cart-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    
    /* Mobile: Smaller gap */
    @media (max-width: 768px) {
      gap: 8px;
      margin-bottom: 4px;
    }
    
    .cart-icon {
      width: 24px;
      height: 24px;
      
      /* Mobile: Smaller icon */
      @media (max-width: 768px) {
        width: 20px;
        height: 20px;
      }
    }
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      
      /* Mobile: Smaller text */
      @media (max-width: 768px) {
        font-size: 16px;
      }
    }
    
    .item-badge {
      background: #ff6b35;
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      
      /* Mobile: Smaller badge */
      @media (max-width: 768px) {
        padding: 2px 8px;
        font-size: 10px;
      }
    }
  }
  
  .eat-in-toggle {
    font-size: 14px;
    color: #a0aec0;
    
    /* Mobile: Smaller text */
    @media (max-width: 768px) {
      font-size: 12px;
    }
  }
`;

const CartItems = styled.div`
  flex: 1;
  padding: 0 24px;
  padding-bottom: 16px;
  overflow-y: auto;

  /* Mobile: Scrollable with limited height */
  @media (max-width: 768px) {
    padding: 0 16px;
    padding-bottom: 12px;
    max-height: 25vh;
  }
  
  .empty-cart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #718096;
    text-align: center;
    
    /* Mobile: Compact empty state */
    @media (max-width: 768px) {
      padding: 12px 0;
      min-height: 100px;
    }
    
    .empty-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
      
      /* Mobile: Smaller icon */
      @media (max-width: 768px) {
        width: 40px;
        height: 40px;
        margin-bottom: 8px;
      }
    }
    
    p {
      font-size: 16px;
      margin: 0;
      
      /* Mobile: Smaller text */
      @media (max-width: 768px) {
        font-size: 12px;
      }
    }
  }
  
  .cart-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid #4a5568;
    animation: ${slideIn} 0.3s ease;
    
    &:last-child {
      border-bottom: none;
    }
    
    .item-image {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ffeaa7, #fab1a0);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    
    .item-details {
      flex: 1;
      
      .item-name {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 4px;
        color: white;
      }
      
      .item-price {
        font-size: 14px;
        color: #a0aec0;
      }
    }
    
    .item-quantity {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .qty-btn {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        border: 1px solid #4a5568;
        background: transparent;
        color: #a0aec0;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover {
          background: #4a5568;
          color: white;
        }
      }
      
      .qty-number {
        font-size: 16px;
        font-weight: 600;
        min-width: 20px;
        text-align: center;
      }
    }
    
    .remove-btn {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: transparent;
      border: 1px solid #4a5568;
      color: #e53e3e;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: #e53e3e;
        color: white;
      }
    }
  }
`;

const CartFooter = styled.div`
  padding: 20px 24px;
  border-top: 1px solid #4a5568;
  background: #2d3748;
  position: sticky;
  bottom: 0;
  z-index: 10;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.2);

  /* Mobile: Compact footer */
  @media (max-width: 768px) {
    padding: 12px 16px;
  }

  .total-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .total-label {
      font-size: 14px;
      color: #a0aec0;
    }

    .total-amount {
      font-size: 28px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;

      /* Mobile: Smaller text */
      @media (max-width: 768px) {
        font-size: 22px;
      }
    }
  }

  .order-button {
    width: 100%;
    background: #ff6b35;
    color: white;
    border: none;
    padding: 16px 24px;
    border-radius: 12px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    letter-spacing: -0.2px;

    /* Mobile: Slightly smaller */
    @media (max-width: 768px) {
      padding: 14px 20px;
      font-size: 16px;
    }

    &:hover {
      background: #e55a2b;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
    }

    &:active {
      transform: translateY(0);
    }

    &:disabled {
      background: #4a5568;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }
`;

const SuccessModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .modal-content {
    background: white;
    border-radius: 20px;
    padding: 40px;
    text-align: center;
    max-width: 480px;
    margin: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    animation: ${fadeIn} 0.4s ease;
    
    .success-icon {
      width: 80px;
      height: 80px;
      color: #38a169;
      margin: 0 auto 24px;
      animation: ${pulse} 0.8s ease;
    }
    
    .success-title {
      font-size: 28px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    
    .success-message {
      font-size: 16px;
      color: #718096;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    
    .order-number {
      background: linear-gradient(135deg, #38a169, #2f855a);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      margin: 20px 0;
      display: inline-block;
      letter-spacing: 0.5px;
    }
    
    .modal-actions {
      display: flex;
      gap: 16px;
      margin-top: 32px;
      
      .modal-btn {
        flex: 1;
        padding: 14px 24px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        border: none;
        
        &.primary {
          background: #ff6b35;
          color: white;
          
          &:hover {
            background: #e55a2b;
            transform: translateY(-2px);
          }
        }
        
        &.secondary {
          background: #f8f9fa;
          color: #495057;
          border: 2px solid #dee2e6;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-right: 12px;
          
          &:hover:not(:disabled) {
            background: #e9ecef;
            border-color: #adb5bd;
            transform: translateY(-1px);
          }
          
          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }
      }
    }
  }
`;

// Emoji mapping for product types when no image is available
const getProductEmoji = (goodsNameEn, type) => {
  const name = goodsNameEn.toLowerCase();
  if (name.includes('espresso')) return "☕";
  if (name.includes('cappuccino')) return "🥛";
  if (name.includes('latte')) return "🤎";
  if (name.includes('americano')) return "☕";
  if (type === 2) return "☕"; // Coffee default
  if (type === 1) return "🧋"; // Tea default
  if (type === 3) return "🍦"; // Ice cream default
  return "☕"; // Default
};

// CSS class mapping for gradients
const getImageClass = (goodsNameEn) => {
  const name = goodsNameEn.toLowerCase();
  if (name.includes('espresso')) return "espresso";
  if (name.includes('cappuccino')) return "cappuccino";
  if (name.includes('latte')) return "latte";
  if (name.includes('americano')) return "americano";
  return "espresso"; // Default
};

function KioskOrder() {
  const { currentLanguage, isRTL, toggleLanguage, t, getProductName } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([
    { id: 'All', name: 'All Items', icon: '🍽️' }
  ]);
  const [orderQueue, setOrderQueue] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [frontendStatus, setFrontendStatus] = useState({ enabled: true, message: null });
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [paymentEnabled, setPaymentEnabled] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);

  // New single-item ordering state (replaces cart)
  const [orderItem, setOrderItem] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-enter fullscreen on page load
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        // Check if already in fullscreen
        if (!document.fullscreenElement) {
          console.log('🖥️ KIOSK: Auto-entering fullscreen mode...');
          await document.documentElement.requestFullscreen();
          console.log('🖥️ KIOSK: Fullscreen mode activated');
        }
      } catch (error) {
        // Fullscreen might be blocked by browser policy (e.g., must be triggered by user interaction)
        console.warn('🖥️ KIOSK: Auto-fullscreen blocked (user interaction may be required):', error.message);
        // This is expected behavior in some browsers, user can still use the fullscreen button
      }
    };

    // Delay slightly to ensure page is fully loaded
    const timer = setTimeout(enterFullscreen, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter products by category
  const getFilteredProducts = () => {
    if (selectedCategory === 'All') {
      return products;
    }
    
    return products.filter(product => {
      // Use the actual category field from the database
      if (product.category) {
        return product.category === selectedCategory;
      }
      
      // Fallback to name-based categorization for existing products without category
      const name = product.goodsNameEn.toLowerCase();
      switch (selectedCategory) {
        case 'Classics':
          return name.includes('espresso') || name.includes('cappuccino') || name.includes('americano');
        case 'Latte Art':
          return name.includes('latte') || name.includes('macchiato');
        case 'Specialty':
          return name.includes('specialty') || name.includes('signature');
        case 'Cold Brew':
          return name.includes('cold') || name.includes('iced') || name.includes('frappé');
        case 'Seasonal':
          return name.includes('seasonal') || name.includes('limited');
        default:
          return true;
      }
    });
  };

  // Sort products by display order
  const getSortedProducts = (products) => {
    return products.sort((a, b) => {
      // Use displayOrder field, fallback to ID for sorting
      const orderA = a.displayOrder !== undefined ? a.displayOrder : a.id;
      const orderB = b.displayOrder !== undefined ? b.displayOrder : b.id;
      return orderA - orderB;
    });
  };

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiUrl = getApiUrl('/api/motong/categories');
        console.log('🏷️ KIOSK: Fetching categories from:', apiUrl);
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        if (result.code === 0 && result.data) {
          console.log('🏷️ KIOSK: Found', result.data.length, 'categories');
          
          // Filter categories to only include those with products
          const categoriesWithProducts = result.data.filter(category => {
            const categoryProducts = products.filter(product => 
              product.category === category.name || 
              (product.category === null && category.name === 'Classics')
            );
            return categoryProducts.length > 0;
          });
          
          console.log('🏷️ KIOSK: Categories with products:', categoriesWithProducts.length);
          
          const allCategories = [
            { id: 'All', name: t('allItems'), icon: '🍽️' },
            ...categoriesWithProducts.map(cat => ({ id: cat.name, name: cat.name, icon: cat.icon }))
          ];
          setCategories(allCategories);
        } else {
          console.error('🏷️ KIOSK: Failed to fetch categories:', result.msg);
        }
      } catch (error) {
        console.error('🏷️ KIOSK: Error fetching categories:', error);
      }
    };

    // Only fetch categories after products are loaded
    if (products.length > 0) {
      fetchCategories();
    }
  }, [products, t]);

  // Check frontend status
  const checkFrontendStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await fetch(getApiUrl('/api/motong/system-settings/status/frontend'));
      const result = await response.json();

      if (result.code === 0) {
        setFrontendStatus(result.data);
        console.log('📱 Frontend status:', result.data.enabled ? 'ENABLED' : 'DISABLED');
      } else {
        console.error('Failed to check frontend status:', result.msg);
        // Default to enabled if we can't check
        setFrontendStatus({ enabled: true, message: null });
      }
    } catch (error) {
      console.error('Error checking frontend status:', error);
      // Default to enabled if we can't check
      setFrontendStatus({ enabled: true, message: null });
    } finally {
      setCheckingStatus(false);
    }
  };

  // Check payment status for PIN mode
  const checkPaymentStatus = async () => {
    try {
      const response = await fetch(getApiUrl('/api/motong/system-settings/kiosk/payment-status'));
      const result = await response.json();

      if (result.code === 0) {
        setPaymentEnabled(result.data.paymentEnabled);
        console.log('💳 Payment status:', result.data.paymentEnabled ? 'ENABLED' : 'PIN MODE');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      // Default to payment enabled if we can't check
      setPaymentEnabled(true);
    }
  };

  // Verify daily PIN (integrated into confirm modal)
  const verifyPin = async () => {
    if (pinInput.length !== 4) {
      setPinError('Please enter a 4-digit PIN');
      return;
    }

    setVerifyingPin(true);
    setPinError('');

    try {
      const response = await fetch(getApiUrl('/api/motong/system-settings/verify-pin'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput })
      });

      const result = await response.json();

      if (result.code === 0 && result.data.valid) {
        // PIN is correct, proceed with order
        setPinInput('');
        setPinError('');
        // Actually submit the order
        await processOrder();
      } else {
        setPinError('Invalid PIN. Please try again.');
        setPinInput('');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      setPinError('Error verifying PIN. Please try again.');
    } finally {
      setVerifyingPin(false);
    }
  };

  // Handle PIN input (only allow digits)
  const handlePinInput = (digit) => {
    if (pinInput.length < 4) {
      setPinInput(prev => prev + digit);
      setPinError('');
    }
  };

  const handlePinBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setPinError('');
  };

  const handlePinClear = () => {
    setPinInput('');
    setPinError('');
  };

  // Fetch order queue from both coffee (device 1) and ice cream (device 4) machines
  const fetchOrderQueue = async () => {
    try {
      const apiUrl = getApiUrl('api/motong/deviceOrderQueueList');

      // Fetch from both devices in parallel
      const [coffeeResponse, iceCreamResponse] = await Promise.all([
        fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: '1' })
        }),
        fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: '4' })
        })
      ]);

      const [coffeeResult, iceCreamResult] = await Promise.all([
        coffeeResponse.json(),
        iceCreamResponse.json()
      ]);

      // Merge orders from both devices and dedupe by order ID
      const allOrders = [];
      const seenIds = new Set();

      if (coffeeResult.code === 0 && coffeeResult.data) {
        coffeeResult.data.forEach(order => {
          if (!seenIds.has(order.id)) {
            seenIds.add(order.id);
            allOrders.push(order);
          }
        });
      }

      if (iceCreamResult.code === 0 && iceCreamResult.data) {
        iceCreamResult.data.forEach(order => {
          if (!seenIds.has(order.id)) {
            seenIds.add(order.id);
            allOrders.push(order);
          }
        });
      }

      // Sort by creation time (newest first)
      allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setOrderQueue(allOrders);
    } catch (error) {
      console.error('Error fetching order queue:', error);
    }
  };

  // Initialize WebSocket connection and event listeners
  useEffect(() => {
    // Connect to WebSocket
    webSocketClient.connect();

    // Set up event listeners
    const handleInitialStatus = (data) => {
      console.log('🔌 Initial status received:', data);
      setFrontendStatus({
        enabled: data.frontendEnabled,
        message: data.outOfOrderMessage
      });
      setCheckingStatus(false);
    };

    const handleFrontendStatusChange = (data) => {
      console.log('🔌 Frontend status changed:', data);
      setFrontendStatus({
        enabled: data.enabled,
        message: data.message
      });
    };

    const handleMatterCodesUpdate = (data) => {
      console.log('🔌 Matter codes updated, refreshing products...');
      fetchProducts(); // Refresh products to update availability
    };

    const handleProductsUpdate = (data) => {
      console.log('🔌 Products updated, refreshing...');
      fetchProducts();
    };

    // Register event listeners
    webSocketClient.on('initial_status', handleInitialStatus);
    webSocketClient.on('frontend_status_changed', handleFrontendStatusChange);
    webSocketClient.on('matter_codes_updated', handleMatterCodesUpdate);
    webSocketClient.on('products_updated', handleProductsUpdate);

    // Cleanup on unmount
    return () => {
      webSocketClient.off('initial_status', handleInitialStatus);
      webSocketClient.off('frontend_status_changed', handleFrontendStatusChange);
      webSocketClient.off('matter_codes_updated', handleMatterCodesUpdate);
      webSocketClient.off('products_updated', handleProductsUpdate);
      // Note: Don't disconnect WebSocket as other components might be using it
    };
  }, []);

  // Check frontend status periodically (fallback)
  useEffect(() => {
    checkFrontendStatus(); // Initial check
    checkPaymentStatus(); // Check payment status

    // Check status every 60 seconds as fallback (WebSocket should handle most updates)
    const statusInterval = setInterval(() => {
      checkFrontendStatus();
      checkPaymentStatus();
    }, 60000);
    return () => clearInterval(statusInterval);
  }, []);

  // Fetch order queue periodically
  useEffect(() => {
    fetchOrderQueue(); // Initial fetch
    const interval = setInterval(fetchOrderQueue, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiUrl(API_ENDPOINTS.PRODUCTS);
      console.log('🍕 KIOSK: Fetching products from:', apiUrl);
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      console.log('🍕 KIOSK: API Response:', result);
      
      if (result.code === 0 && result.data) {
        console.log('🍕 KIOSK: Found', result.data.length, 'products');
        // Transform products for kiosk display
        const transformedProducts = result.data.map(product => ({
          ...product,
          price: parseFloat(product.price),
          rePrice: parseFloat(product.rePrice),
          emoji: getProductEmoji(product.goodsNameEn, product.type),
          imageClass: getImageClass(product.goodsNameEn)
        }));
        setProducts(transformedProducts);
      } else {
        console.error('🍕 KIOSK: Failed to fetch products:', result.msg);
        console.error('🍕 KIOSK: Full result:', result);
      }
    } catch (error) {
      console.error('🍕 KIOSK: Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear all caches and force fresh data load
  const clearCachesAndReload = () => {
    console.log('🧹 KIOSK: Clearing all caches and forcing fresh data load...');
    
    // Clear browser caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    console.log('🧹 KIOSK: Caches cleared, forcing fresh data load');
  };

  // Force refresh for mobile devices
  const forceMobileRefresh = () => {
    console.log('📱 MOBILE: Force refreshing for mobile device');
    clearCachesAndReload();
    fetchProducts();
    fetchOrderQueue();
    checkFrontendStatus();
  };

  // Initial fetch and periodic refresh for products
  useEffect(() => {
    // Clear caches on kiosk load to ensure fresh data
    clearCachesAndReload();
    
    fetchProducts(); // Initial fetch
    
    // Auto-refresh products every 30 seconds to catch updates
    const interval = setInterval(() => {
      console.log('🔄 KIOSK: Auto-refreshing products...');
      fetchProducts();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const toggleFavorite = (productId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  // Show order confirmation modal for a product
  const showOrderConfirmation = (product) => {
    // For simple products (no customization), apply default cup code logic
    // ONLY for coffee products (type 2) - ice cream (type 3) doesn't use CupCode
    let processedProduct = product;

    const hasOptions = product.has_bean_options || product.has_milk_options ||
                      product.has_ice_options || product.has_shot_options;

    if (!hasOptions && !product.customization && product.type === 2) {
      const modifiedProduct = { ...product };

      try {
        // Parse and update jsonCodeVal with default cup code
        const jsonArray = JSON.parse(product.jsonCodeVal);
        const updatedJson = [...jsonArray];

        // Set default CupCode to 2 (regular cup) for simple coffee products
        const cupIndex = updatedJson.findIndex(item => item.CupCode !== undefined);
        if (cupIndex >= 0) {
          updatedJson[cupIndex].CupCode = "2";
        } else {
          updatedJson.push({ CupCode: "2" });
        }

        modifiedProduct.jsonCodeVal = JSON.stringify(updatedJson);
        console.log(`☕ Simple Coffee CupCode: ${product.goodsNameEn} → CupCode: 2 (No Ice Options)`);

        processedProduct = modifiedProduct;
      } catch (error) {
        console.error('Error updating simple product jsonCodeVal:', error);
      }
    }

    setOrderItem(processedProduct);
    setShowConfirmModal(true);
    setPinInput('');
    setPinError('');
  };

  // Close the confirm order modal
  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setOrderItem(null);
    setPinInput('');
    setPinError('');
  };

  const openCustomizationModal = (product) => {
    setSelectedProduct(product);
    setShowCustomization(true);
  };

  const closeCustomizationModal = () => {
    setShowCustomization(false);
    setSelectedProduct(null);
  };

  // Called when customization modal completes - show confirm modal
  const handleCustomizedAddToCart = (customizedProduct, quantity) => {
    showOrderConfirmation(customizedProduct);
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    return `KIOSK${timestamp.slice(-8)}`;
  };

  // Submit the order directly (for when payment is enabled or PIN verified)
  const submitOrder = async () => {
    if (!orderItem) return;

    // Check if payment is required
    if (!paymentEnabled) {
      // PIN should already be entered in the confirm modal
      // verifyPin will call processOrder after validation
      await verifyPin();
      return;
    }

    // Payment is enabled, proceed with order directly
    await processOrder();
  };

  // Actually process and submit the order (called after payment/PIN verification)
  const processOrder = async () => {
    if (!orderItem) return;

    setIsSubmitting(true);
    try {
      const orderNum = generateOrderNumber();
      const totalPrice = orderItem.price;

      console.log('🚀 KIOSK ORDER SUBMISSION DEBUG:');
      console.log('Order item:', orderItem);

      // Build option name based on customization
      let optionName = '无';
      let optionNameEn = 'NONE';

      if (orderItem.customization) {
        // For ice cream with toppings
        if (orderItem.type === 3 && orderItem.customization.toppingType !== undefined) {
          const toppingNames = {
            0: { cn: '无', en: 'NONE' },
            1: { cn: '奥利奥', en: 'Oreo Crumbs' },
            2: { cn: '碎坚果', en: 'Crushed Nuts' }
          };
          const topping = toppingNames[orderItem.customization.toppingType] || toppingNames[0];
          optionName = topping.cn;
          optionNameEn = topping.en;
        } else {
          // For coffee with customizations
          const options = [];
          if (orderItem.customization.beanCode) options.push(`Bean${orderItem.customization.beanCode}`);
          if (orderItem.customization.milkCode) options.push(`Milk${orderItem.customization.milkCode}`);
          if (orderItem.customization.ice) options.push('Iced');
          if (orderItem.customization.shots === 2) options.push('Double Shot');
          optionNameEn = options.length > 0 ? options.join(', ') : 'NONE';
          optionName = optionNameEn;
        }
      }

      const orderData = {
        orderNum,
        deviceId: 1,
        totalPrice,
        items: [{
          goodsId: orderItem.goodsId,
          deviceGoodsId: orderItem.deviceGoodsId,
          goodsName: orderItem.goodsName,
          goodsNameEn: orderItem.goodsNameEn,
          goodsNameOt: orderItem.goodsNameOt || '',
          type: orderItem.type,
          price: orderItem.price,
          rePrice: orderItem.rePrice,
          quantity: 1,
          totalPrice: orderItem.price,
          matterCodes: orderItem.matterCodes,
          jsonCodeVal: orderItem.jsonCodeVal,
          goodsOptionName: optionName,
          goodsOptionNameEn: optionNameEn,
          goodsImg: orderItem.goodsImg || 1,
          path: orderItem.path || '',
          goodsPath: orderItem.goodsPath || '',
          lhImgPath: orderItem.lhImgPath ? `${getApiBaseUrl()}${orderItem.lhImgPath}` : ''
        }]
      };

      console.log('📤 Final order data being sent:', orderData);

      const response = await fetch(getApiUrl(API_ENDPOINTS.CREATE_ORDER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 0) {
          setOrderNumber(orderNum);
          setShowConfirmModal(false);
          setShowSuccess(true);
          setOrderItem(null);
        } else {
          alert('Failed to create order: ' + result.msg);
        }
      } else {
        alert('Failed to submit order. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error submitting order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccess(false);
    setOrderNumber('');
  };

  const printReceipt = async () => {
    setIsPrinting(true);

    try {
      // Note: Receipt printing is simplified since we now do single-item orders
      // The order details would need to be stored if receipt printing is needed
      console.log('Receipt printing - Order:', orderNumber);

      // For now, just log success - receipt printing would need order data stored
      console.log('Receipt printing completed');
    } catch (error) {
      console.error('Error printing receipt:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Container $isRTL={isRTL}>
      <LeftPanel>
        <Header>
          <div className="logo">
            <div className="logo-icon">
              <img 
                src="/K2-logo.jpg" 
                alt="K2 Logo"
                style={{
                  width: 'calc(100% - 40px)',
                  height: 'calc(100% - 40px)',
                  objectFit: 'contain',
                  borderRadius: '0',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 3,
                  display: 'block'
                }}
                onLoad={() => {
                  console.log('✅ K2 Logo loaded successfully from:', '/K2-logo.jpg');
                }}
                onError={(e) => {
                  console.error('❌ K2 Logo failed to load from:', e.target.src);
                  console.log('🔄 Trying backend URL...');
                  // Try backend URL as fallback
                  if (e.target.src.includes('/K2-logo.jpg')) {
                    e.target.src = getApiUrl('public/K2-logo.jpg');
                  } else {
                    // If both fail, show K2 text instead
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div style="color: #2d3748; font-size: 24px; font-weight: bold; z-index: 3; position: relative;">K2</div>';
                  }
                }}
              />
            </div>
            <div className="brand-info">
              <div className="brand-name">{t('brandName')}</div>
              <div className="brand-tagline">{t('brandTagline')}</div>
            </div>
          </div>
          
          <div className="header-controls">
            <div className="language-selector" onClick={toggleLanguage}>
              <div className="flag"></div>
              <span>{t('language')}</span>
            </div>
            
            <div className="fullscreen-btn" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="fullscreen-icon" />
              ) : (
                <Maximize className="fullscreen-icon" />
              )}
            </div>
            
            {/* Refresh button - show on all devices for testing */}
            <div className="mobile-refresh-btn" onClick={forceMobileRefresh} title="Refresh Data">
              <RefreshCw className="refresh-icon" />
            </div>
          </div>
        </Header>

        <SectionTitle>{t('mainMenu')}</SectionTitle>
        
        <CategoryTabs>
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </CategoryTabs>
        
        <ProductGrid>
          {loading ? (
            // Loading placeholder
            [...Array(4)].map((_, index) => (
              <ProductCard key={`loading-${index}`}>
                <div className="product-image espresso">
                  <span>⏳</span>
                </div>
                <div className="product-name">{t('loading')}</div>
                <div className="product-price">{currencyUtils.formatPrice(0)}</div>
                <div className="quantity-controls">
                  <button className="quantity-btn minus" disabled>
                    <Minus size={16} />
                  </button>
                  <div className="quantity">1</div>
                  <button className="quantity-btn plus" disabled>
                    <Plus size={16} />
                  </button>
                </div>
              </ProductCard>
            ))
          ) : (
            getSortedProducts(getFilteredProducts()).map(product => {
              const isFavorite = favorites.has(product.id);
              const hasImage = product.goodsPath && product.goodsPath !== '';
              const dynamicImageUrl = hasImage ? getImageUrl(product.goodsPath) : '';
              
              // Check ingredient availability
              const isAvailable = product.available !== false; // Default to available if not specified  
              const missingIngredients = product.missingIngredients || [];
              
              // Debug logging for availability - ENHANCED DEBUGGING
              console.log('🔍 DETAILED Product availability check:', {
                name: product.goodsNameEn,
                productAvailableRaw: product.available,
                productAvailableType: typeof product.available,
                isAvailable: isAvailable,
                missingIngredients: missingIngredients,
                missingCount: missingIngredients.length,
                matterCodes: product.matterCodes,
                currentURL: window.location.href,
                apiURL: window.cachedApiUrl || 'not-detected'
              });
              
              const handleProductClick = (e) => {
                // Prevent action if product is unavailable
                if (!isAvailable) {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🚫 Product unavailable:', product.goodsNameEn, 'Missing:', missingIngredients.map(i => i.code).join(', '));
                  return;
                }

                // Only open modal if clicking on the card itself, not buttons
                if (e.target === e.currentTarget || e.target.closest('.product-image') || e.target.closest('.product-name') || e.target.closest('.product-price')) {
                  // Coffee options
                  const hasCoffeeOptions = product.has_bean_options || product.has_milk_options || product.has_ice_options || product.has_shot_options;
                  // Ice cream options - toppings or syrups
                  const hasIceCreamOptions = product.hasToppingOptions || product.has_topping_options ||
                    product.syrup1ClassCode || product.syrup2ClassCode || product.syrup3ClassCode;
                  // Latte art
                  const hasLatteArt = product.hasLatteArt;

                  const hasOptions = hasCoffeeOptions || hasIceCreamOptions || hasLatteArt;
                  console.log('🔄 Product card clicked:', product.goodsNameEn, 'Has options:', hasOptions,
                    '(coffee:', hasCoffeeOptions, 'icecream:', hasIceCreamOptions, 'latte art:', hasLatteArt, ')');
                  if (hasOptions) {
                    openCustomizationModal(product);
                  } else {
                    // Direct order confirmation for items without options
                    showOrderConfirmation(product);
                  }
                }
              };
              
              return (
                <ProductCard 
                  key={product.id}
                  className={!isAvailable ? 'unavailable' : ''}
                  onClick={handleProductClick}
                  style={{ cursor: isAvailable ? 'pointer' : 'not-allowed' }}
                >
                  <button
                    className="favorite-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product.id);
                    }}
                  >
                    <Heart 
                      className="heart-icon" 
                      fill={isFavorite ? '#ff6b35' : 'none'}
                      color={isFavorite ? '#ff6b35' : '#a0aec0'}
                    />
                  </button>
                  
                  {/* Availability Badge */}
                  {!isAvailable && (
                    <AvailabilityBadge className="unavailable">
                      <AlertTriangle className="icon" />
                      <span>Unavailable</span>
                    </AvailabilityBadge>
                  )}
                  
                  <div className={`product-image ${product.imageClass}`}>
                    {hasImage ? (
                      <>
                        <img 
                          src={dynamicImageUrl} 
                          alt={product.goodsNameEn}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '16px',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: 1
                          }}
                          onError={(e) => {
                            // Fallback to emoji if image fails to load
                            e.target.style.display = 'none';
                            e.target.parentElement.querySelector('.emoji-fallback').style.display = 'flex';
                          }}
                        />
                        {/* Subtle overlay for better text readability if needed */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(135deg, rgba(255,107,53,0.05) 0%, rgba(0,0,0,0.02) 100%)',
                          borderRadius: '16px',
                          zIndex: 2,
                          pointerEvents: 'none'
                        }} />
                      </>
                    ) : null}
                    <span 
                      className="emoji-fallback"
                      style={{ 
                        display: hasImage ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        fontSize: '4rem',
                        zIndex: 3,
                        position: 'relative'
                      }}
                    >
                      {product.emoji}
                    </span>
                  </div>
                  
                  <div className="product-name">{getProductName(product)}</div>
                  <div className="product-price">{currencyUtils.formatPrice(product.price)}</div>
                  
                  <div className="add-to-cart-section">
                    <button
                      className="add-to-cart-btn"
                      onClick={(e) => {
                        e.stopPropagation();

                        if (!isAvailable) {
                          console.log('🚫 Cannot order unavailable product:', product.goodsNameEn);
                          return;
                        }

                        // Check if product has options
                        const hasCoffeeOptions = product.has_bean_options || product.has_milk_options || product.has_ice_options || product.has_shot_options;
                        const hasIceCreamOptions = product.hasToppingOptions || product.has_topping_options ||
                          product.syrup1ClassCode || product.syrup2ClassCode || product.syrup3ClassCode;
                        const hasLatteArt = product.hasLatteArt;
                        const hasOptions = hasCoffeeOptions || hasIceCreamOptions || hasLatteArt;

                        console.log('🔄 Order button clicked:', product.goodsNameEn, 'Has options:', hasOptions);

                        if (hasOptions) {
                          openCustomizationModal(product);
                        } else {
                          showOrderConfirmation(product);
                        }
                      }}
                      disabled={!isAvailable}
                    >
                      <ShoppingBag className="cart-icon" />
                      {isAvailable ? t('orderNow') : t('unavailable')}
                    </button>

                    {!isAvailable && missingIngredients.length > 0 && (
                      <div className="unavailable-message">
                        {t('missing')}: {missingIngredients.map(ing => ing.name || ing.code).join(', ')}
                      </div>
                    )}
                  </div>
                </ProductCard>
              );
            })
          )}
        </ProductGrid>
      </LeftPanel>

      <RightPanel>
        <QueueSection style={{ flex: 1 }}>
          <div className="queue-title">
            <h4>{t('orderQueue')}</h4>
            {orderQueue.length > 0 && (
              <span className="queue-count">{orderQueue.length}</span>
            )}
          </div>

          {orderQueue.length > 0 ? (
            <div className="queue-list" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              {orderQueue.map((order, index) => (
                <div key={order.id} className="queue-item">
                  <div className="order-info">
                    <div className="order-num">#{index + 1} - {order.orderNum?.slice(-6) || order.id}</div>
                    <div className="order-items">
                      {[...order.typeList1, ...order.typeList2, ...order.typeList3, ...order.typeList4]
                        .map(item => item.goodsNameEn)
                        .join(', ')
                        .substring(0, 30)}
                      {[...order.typeList1, ...order.typeList2, ...order.typeList3, ...order.typeList4].length > 1 ? '...' : ''}
                    </div>
                  </div>
                  <div className={`order-status ${order.status === 3 ? 'queuing' : 'processing'}`}>
                    {order.status === 3 ? t('queuing') : t('making')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-queue" style={{ padding: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>☕</div>
              <p>{t('noOrders')}</p>
              <p style={{ fontSize: '12px', marginTop: '8px', color: '#718096' }}>
                {t('tapToOrder')}
              </p>
            </div>
          )}
        </QueueSection>
      </RightPanel>


      {showSuccess && (
        <SuccessModal>
          <div className="modal-content">
            <Check className="success-icon" />
            <h2 className="success-title">{t('orderPlaced')}</h2>
            <p className="success-message">
              {t('thankYou')}
            </p>
            <div className="order-number">Order #{orderNumber}</div>
            <div className="modal-actions">
              <button 
                className="modal-btn secondary" 
                onClick={printReceipt}
                disabled={isPrinting}
              >
                <Printer size={18} />
                {isPrinting ? t('printing') : t('printReceipt')}
              </button>
              <button className="modal-btn primary" onClick={closeSuccessModal}>
                {t('orderMore')}
              </button>
            </div>
          </div>
        </SuccessModal>
      )}

      {/* Customization Modal */}
      <CustomizationModal
        product={selectedProduct}
        isOpen={showCustomization}
        onClose={closeCustomizationModal}
        onAddToCart={handleCustomizedAddToCart}
      />

      {/* Confirm Order Modal (with integrated PIN) */}
      {showConfirmModal && orderItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Product Info */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                width: '120px',
                height: '120px',
                margin: '0 auto 16px',
                borderRadius: '20px',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #ffeaa7, #fab1a0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
              }}>
                {orderItem.goodsPath ? (
                  <img
                    src={getImageUrl(orderItem.goodsPath)}
                    alt={orderItem.goodsNameEn}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span style={{ fontSize: '4rem' }}>{orderItem.emoji}</span>
                )}
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937', marginBottom: '8px' }}>
                {getProductName(orderItem)}
              </h2>
              {orderItem.customization && (
                <p style={{ color: '#6B7280', fontSize: '0.9rem', marginBottom: '8px' }}>
                  {orderItem.customization.beanCode === 2 && 'Premium Roast '}
                  {orderItem.customization.milkCode === 2 && '• Oat Milk '}
                  {orderItem.customization.ice && '• Iced '}
                  {orderItem.customization.shots === 2 && '• Double Shot'}
                </p>
              )}
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: '#ff6b35',
                marginTop: '8px'
              }}>
                {currencyUtils.formatPrice(orderItem.price)}
              </div>
            </div>

            {/* Divider */}
            <div style={{
              height: '1px',
              background: '#E5E7EB',
              margin: '24px 0'
            }} />

            {/* PIN Section (only if payment disabled) */}
            {!paymentEnabled && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ color: '#6B7280', fontSize: '0.95rem', marginBottom: '16px' }}>
                    Enter PIN to confirm order
                  </p>

                  {/* PIN Display */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '10px',
                    marginBottom: '16px'
                  }}>
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} style={{
                        width: '45px',
                        height: '55px',
                        border: '2px solid',
                        borderColor: pinInput.length > i ? '#ff6b35' : '#E5E7EB',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#1F2937',
                        background: pinInput.length > i ? '#FFF5F0' : '#F9FAFB',
                        transition: 'all 0.2s'
                      }}>
                        {pinInput[i] ? '●' : ''}
                      </div>
                    ))}
                  </div>

                  {/* Error Message */}
                  {pinError && (
                    <div style={{
                      background: '#FEE2E2',
                      color: '#DC2626',
                      padding: '10px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}>
                      {pinError}
                    </div>
                  )}

                  {/* Number Pad */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    maxWidth: '240px',
                    margin: '0 auto'
                  }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '⌫'].map(key => (
                      <button
                        key={key}
                        onClick={() => {
                          if (key === 'C') handlePinClear();
                          else if (key === '⌫') handlePinBackspace();
                          else handlePinInput(key.toString());
                        }}
                        disabled={verifyingPin || isSubmitting}
                        style={{
                          padding: '14px',
                          fontSize: '1.25rem',
                          fontWeight: '600',
                          border: 'none',
                          borderRadius: '10px',
                          background: key === 'C' ? '#FEE2E2' : key === '⌫' ? '#FEF3C7' : '#F3F4F6',
                          color: key === 'C' ? '#DC2626' : key === '⌫' ? '#D97706' : '#1F2937',
                          cursor: (verifyingPin || isSubmitting) ? 'not-allowed' : 'pointer',
                          opacity: (verifyingPin || isSubmitting) ? 0.5 : 1,
                          transition: 'all 0.2s'
                        }}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={closeConfirmModal}
                disabled={verifyingPin || isSubmitting}
                style={{
                  flex: 1,
                  padding: '16px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  background: 'white',
                  color: '#6B7280',
                  cursor: (verifyingPin || isSubmitting) ? 'not-allowed' : 'pointer',
                  opacity: (verifyingPin || isSubmitting) ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitOrder}
                disabled={(!paymentEnabled && pinInput.length !== 4) || verifyingPin || isSubmitting}
                style={{
                  flex: 1,
                  padding: '16px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '12px',
                  background: (paymentEnabled || pinInput.length === 4) ? '#ff6b35' : '#E5E7EB',
                  color: (paymentEnabled || pinInput.length === 4) ? 'white' : '#9CA3AF',
                  cursor: ((paymentEnabled || pinInput.length === 4) && !verifyingPin && !isSubmitting) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
              >
                {isSubmitting ? 'Ordering...' : verifyingPin ? 'Verifying...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Out of Order Overlay */}
      {!frontendStatus.enabled && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          color: 'white',
          textAlign: 'center',
          padding: '40px'
        }}>
          <AlertTriangle size={80} style={{ color: '#F59E0B', marginBottom: '24px' }} />
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            marginBottom: '16px',
            color: '#F59E0B'
          }}>
            {t('outOfOrder')}
          </h1>
          <p style={{ 
            fontSize: '1.5rem', 
            lineHeight: '1.6', 
            maxWidth: '600px',
            color: '#E5E7EB'
          }}>
            {frontendStatus.message || t('sorryMessage')}
          </p>
          <div style={{
            marginTop: '32px',
            padding: '12px 24px',
            background: 'rgba(249, 115, 22, 0.1)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#FED7AA'
          }}>
            {t('maintenanceMode')}
          </div>
        </div>
      )}
    </Container>
  );
}

export default KioskOrder;
