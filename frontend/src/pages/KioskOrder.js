import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { ShoppingCart, Plus, Minus, Coffee, Heart, Star, ArrowLeft, Check, X, Maximize, Minimize } from 'lucide-react';
import CustomizationModal from '../components/Kiosk/CustomizationModal';
import { getApiUrl, API_ENDPOINTS } from '../utils/config';
import currencyUtils from '../utils/currency';

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
  min-height: 100vh;
  background: #f8f9fb;
  display: flex;
  font-family: 'Figtree', 'Inter', 'Segoe UI', sans-serif;
  position: relative;
`;

const LeftPanel = styled.div`
  flex: 2;
  padding: 40px;
  background: white;
  overflow-y: auto;
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 20px;
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
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 40px rgba(255, 107, 53, 0.15);
    border-color: #ff6b35;
    
    .product-image {
      transform: scale(1.05);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    }
  }
  
  &:active {
    transform: translateY(-3px);
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
  }
  
  .product-price {
    font-size: 18px;
    font-weight: 800;
    color: #ff6b35;
    text-align: center;
    margin-bottom: 12px;
    flex-shrink: 0;
  }
  
  .quantity-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-top: auto; /* Push to bottom */
    padding-top: 8px;
    
    .quantity-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: white;
      color: #4a5568;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      
      &:hover {
        background: #f7fafc;
        border-color: #cbd5e0;
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &.minus {
        color: #e53e3e;
      }
      
      &.plus {
        background: #ff6b35;
        border-color: #ff6b35;
        color: white;
        
        &:hover {
          background: #e55a2b;
        }
      }
    }
    
    .quantity {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      min-width: 24px;
      text-align: center;
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

const RightPanel = styled.div`
  flex: 1;
  background: #2d3748;
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const QueueSection = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid #4a5568;
  
  .queue-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    
    h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      color: #e2e8f0;
    }
    
    .queue-count {
      background: #ff6b35;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
  }
  
  .queue-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 120px;
    overflow-y: auto;
    
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
    justify-content: between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    font-size: 14px;
    
    .order-info {
      flex: 1;
      
      .order-num {
        font-weight: 600;
        color: #ff6b35;
        font-size: 12px;
      }
      
      .order-items {
        color: #cbd5e0;
        font-size: 12px;
        margin-top: 2px;
      }
    }
    
    .order-status {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      
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
  }
`;

const CartHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #4a5568;
  
  .cart-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    
    .cart-icon {
      width: 24px;
      height: 24px;
    }
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
    }
    
    .item-badge {
      background: #ff6b35;
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
  }
  
  .eat-in-toggle {
    font-size: 14px;
    color: #a0aec0;
  }
`;

const CartItems = styled.div`
  flex: 1;
  padding: 0 24px;
  overflow-y: auto;
  
  .empty-cart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #718096;
    text-align: center;
    
    .empty-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    p {
      font-size: 16px;
      margin: 0;
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
  padding: 24px;
  border-top: 1px solid #4a5568;
  
  .total-section {
    margin-bottom: 24px;
    
    .total-label {
      font-size: 14px;
      color: #a0aec0;
      margin-bottom: 4px;
    }
    
    .total-amount {
      font-size: 32px;
      font-weight: 700;
      color: white;
      letter-spacing: -0.5px;
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
          background: #f7fafc;
          color: #4a5568;
          border: 1px solid #e2e8f0;
          
          &:hover {
            background: #edf2f7;
            transform: translateY(-2px);
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});
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
          const allCategories = [
            { id: 'All', name: 'All Items', icon: '🍽️' },
            ...result.data.map(cat => ({ id: cat.name, name: cat.name, icon: cat.icon }))
          ];
          setCategories(allCategories);
        } else {
          console.error('🏷️ KIOSK: Failed to fetch categories:', result.msg);
        }
      } catch (error) {
        console.error('🏷️ KIOSK: Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch order queue
  const fetchOrderQueue = async () => {
    try {
      const apiUrl = getApiUrl('api/motong/deviceOrderQueueList');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: '1' })
      });
      const result = await response.json();
      
      if (result.code === 0 && result.data) {
        setOrderQueue(result.data);
      }
    } catch (error) {
      console.error('Error fetching order queue:', error);
    }
  };

  // Fetch order queue periodically
  useEffect(() => {
    fetchOrderQueue(); // Initial fetch
    const interval = setInterval(fetchOrderQueue, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch products from backend
  useEffect(() => {
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

    fetchProducts();
  }, []);

  const getQuantity = (productId) => {
    return quantities[productId] || 1;
  };

  const updateQuantity = (productId, change) => {
    const currentQuantity = getQuantity(productId);
    const newQuantity = Math.max(1, Math.min(10, currentQuantity + change));
    setQuantities(prev => ({
      ...prev,
      [productId]: newQuantity
    }));
  };

  const updateCartItemQuantity = (productId, change) => {
    setCart(prev => prev.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: Math.max(1, Math.min(10, item.quantity + change)) }
        : item
    ));
  };

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

  const addToCart = (product, customQuantity = null) => {
    const quantity = customQuantity || getQuantity(product.id);
    
    // Check if product has any customization options
    const hasOptions = product.has_bean_options || product.has_milk_options || 
                      product.has_ice_options || product.has_shot_options;
    
    if (hasOptions && !customQuantity) {
      // Open customization modal instead of adding directly
      openCustomizationModal(product);
      return;
    }
    
    // Generate unique key for customized products
    const productKey = `${product.id}-${JSON.stringify(product.customization || {})}`;
    const existingItem = cart.find(item => 
      item.productKey === productKey || 
      (!item.productKey && item.product.id === product.id && !product.customization)
    );
    
    if (existingItem) {
      setCart(prev => prev.map(item => 
        (item.productKey === productKey || 
         (!item.productKey && item.product.id === product.id && !product.customization))
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart(prev => [...prev, { 
        product, 
        quantity,
        productKey: product.customization ? productKey : undefined
      }]);
    }
    
    // Reset quantity to 1 after adding
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
  };

  const openCustomizationModal = (product) => {
    setSelectedProduct(product);
    setShowCustomization(true);
  };

  const closeCustomizationModal = () => {
    setShowCustomization(false);
    setSelectedProduct(null);
  };

  const handleCustomizedAddToCart = (customizedProduct, quantity) => {
    addToCart(customizedProduct, quantity);
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString();
    return `KIOSK${timestamp.slice(-8)}`;
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderNum = generateOrderNumber();
      const totalPrice = getCartTotal();

      const orderData = {
        orderNum,
        deviceId: 1,
        totalPrice,
        items: cart.map(item => ({
          goodsId: item.product.id,
          deviceGoodsId: item.product.deviceGoodsId,
          goodsName: item.product.goodsName,
          goodsNameEn: item.product.goodsNameEn,
          goodsNameOt: item.product.goodsNameOt || '',
          type: item.product.type,
          price: item.product.price,
          rePrice: item.product.rePrice,
          quantity: item.quantity,
          totalPrice: item.product.price * item.quantity,
          matterCodes: item.product.matterCodes,
          jsonCodeVal: item.product.jsonCodeVal, // Already a JSON string from database
          goodsOptionName: `${item.product.goodsNameEn} - Kiosk Order`,
          goodsOptionNameEn: `${item.product.goodsNameEn} - Kiosk Order`
        }))
      };

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
          setShowSuccess(true);
          setCart([]);
          setQuantities({});
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

  return (
    <Container>
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
              <div className="brand-name">K2 Coffee</div>
              <div className="brand-tagline">Premium Coffee Experience</div>
            </div>
          </div>
          
          <div className="header-controls">
            <div className="language-selector">
              <div className="flag"></div>
              <span>En</span>
            </div>
            
            <div className="fullscreen-btn" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="fullscreen-icon" />
              ) : (
                <Maximize className="fullscreen-icon" />
              )}
            </div>
          </div>
        </Header>

        <SectionTitle>Main menu</SectionTitle>
        
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
                <div className="product-name">Loading...</div>
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
              const quantity = getQuantity(product.id);
              const isFavorite = favorites.has(product.id);
              const hasImage = product.goodsPath && product.goodsPath !== '';
              
              // Debug logging for images
              if (product.goodsNameEn === 'Espresso') {
                console.log('🔍 Espresso product data:', {
                  id: product.id,
                  name: product.goodsNameEn,
                  goodsPath: product.goodsPath,
                  hasImage: hasImage
                });
              }
              
              return (
                <ProductCard 
                  key={product.id}
                  onClick={(e) => {
                    // Only open modal if clicking on the card itself, not buttons
                    if (e.target === e.currentTarget || e.target.closest('.product-image') || e.target.closest('.product-name') || e.target.closest('.product-price')) {
                      const hasOptions = product.has_bean_options || product.has_milk_options || product.has_ice_options || product.has_shot_options;
                      console.log('🔄 Product card clicked:', product.goodsNameEn, 'Has options:', hasOptions);
                      if (hasOptions) {
                        openCustomizationModal(product);
                      } else {
                        addToCart(product);
                      }
                    }
                  }}
                  style={{ cursor: 'pointer' }}
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
                  
                  <div className={`product-image ${product.imageClass}`}>
                    {hasImage ? (
                      <>
                        <img 
                          src={product.goodsPath} 
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
                  
                  <div className="product-name">{product.goodsNameEn}</div>
                  <div className="product-price">{currencyUtils.formatPrice(product.price)}</div>
                  
                  <div className="quantity-controls">
                    <button 
                      className="quantity-btn minus"
                      onClick={() => updateQuantity(product.id, -1)}
                      disabled={quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <div className="quantity">{quantity}</div>
                  <button 
                    className="quantity-btn plus"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('🔄 Adding product:', product.goodsNameEn, 'Has options:', product.has_bean_options || product.has_milk_options || product.has_ice_options || product.has_shot_options);
                      addToCart(product);
                    }}
                  >
                    <Plus size={16} />
                  </button>
                  </div>
                </ProductCard>
              );
            })
          )}
        </ProductGrid>
      </LeftPanel>

      <RightPanel>
        <CartHeader>
          <div className="cart-title">
            <ShoppingCart className="cart-icon" />
            <h3>My order</h3>
            {getCartItemCount() > 0 && (
              <span className="item-badge">{getCartItemCount()}</span>
            )}
          </div>
          <div className="eat-in-toggle">Eat in</div>
        </CartHeader>

        <QueueSection>
          <div className="queue-title">
            <h4>Order Queue</h4>
            {orderQueue.length > 0 && (
              <span className="queue-count">{orderQueue.length}</span>
            )}
          </div>
          
          {orderQueue.length > 0 ? (
            <div className="queue-list">
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
                    {order.status === 3 ? 'Queuing' : 'Making'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-queue">No orders in queue</div>
          )}
        </QueueSection>

        <CartItems>
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart className="empty-icon" />
              <p>Your order is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="cart-item">
                <div className={`item-image ${item.product.imageClass}`}>
                  {item.product.goodsPath && item.product.goodsPath !== '' ? (
                    <img 
                      src={item.product.goodsPath} 
                      alt={item.product.goodsNameEn}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '12px'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span style={{ 
                    display: (item.product.goodsPath && item.product.goodsPath !== '') ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%'
                  }}>
                    {item.product.emoji}
                  </span>
                </div>
                <div className="item-details">
                  <div className="item-name">
                    {item.product.goodsNameEn}
                    {item.product.customization && (
                      <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '2px' }}>
                        {item.product.customization.beanCode === 2 && 'Premium Roast, '}
                        {item.product.customization.milkCode === 2 && 'Oat Milk, '}
                        {!item.product.customization.ice && 'No Ice, '}
                        {item.product.customization.shots === 2 && 'Double Shot'}
                      </div>
                    )}
                  </div>
                  <div className="item-price">{currencyUtils.formatPrice(item.product.price)}</div>
                </div>
                <div className="item-quantity">
                  <button 
                    className="qty-btn"
                    onClick={() => updateCartItemQuantity(item.product.id, -1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="qty-number">{item.quantity}</span>
                  <button 
                    className="qty-btn"
                    onClick={() => updateCartItemQuantity(item.product.id, 1)}
                    disabled={item.quantity >= 10}
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeFromCart(item.product.id)}
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </CartItems>
        
        {cart.length > 0 && (
          <CartFooter>
            <div className="total-section">
              <div className="total-label">Total</div>
              <div className="total-amount">{currencyUtils.formatPrice(getCartTotal())}</div>
            </div>
            
            <button 
              className="order-button"
              onClick={submitOrder}
              disabled={isSubmitting || cart.length === 0}
            >
              {isSubmitting ? 'Processing...' : 'Order'}
            </button>
          </CartFooter>
        )}
      </RightPanel>


      {showSuccess && (
        <SuccessModal>
          <div className="modal-content">
            <Check className="success-icon" />
            <h2 className="success-title">Order Placed Successfully!</h2>
            <p className="success-message">
              Thank you for your order! Your delicious coffee will be ready soon.
            </p>
            <div className="order-number">Order #{orderNumber}</div>
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={closeSuccessModal}>
                Order More
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
    </Container>
  );
}

export default KioskOrder;
