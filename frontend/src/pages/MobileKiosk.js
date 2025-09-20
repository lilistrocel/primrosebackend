import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Coffee, 
  Heart, 
  Star, 
  ArrowLeft, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Printer, 
  AlertTriangle,
  Menu,
  Search,
  Filter
} from 'lucide-react';
import { receiptPrinter } from '../utils/receiptPrinter';
import CustomizationModal from '../components/Kiosk/CustomizationModal';
import { getApiUrl, getApiBaseUrl, getImageUrl, API_ENDPOINTS } from '../utils/config';
import currencyUtils from '../utils/currency';
import webSocketClient from '../utils/websocket';

// Mobile-optimized animations
const slideUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const bounce = keyframes`
  0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
  40%, 43% { transform: translate3d(0, -10px, 0); }
  70% { transform: translate3d(0, -5px, 0); }
  90% { transform: translate3d(0, -2px, 0); }
`;

// Mobile Container
const MobileContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-x: hidden;
  position: relative;

  /* Ensure safe area for mobile notches */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
`;

// Mobile Header
const MobileHeader = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const HeaderTitle = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 22px;
  border: none;
  background: ${props => props.primary ? '#4f46e5' : 'rgba(79, 70, 229, 0.1)'};
  color: ${props => props.primary ? 'white' : '#4f46e5'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const CartBadge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: white;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${bounce} 0.6s ease-in-out;
`;

// Main Content
const MainContent = styled.main`
  padding: 80px 0 100px 0; /* Space for fixed header and bottom cart */
`;

// Category Tabs (Horizontal Scroll)
const CategoryTabs = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px;
  overflow-x: auto;
  scroll-behavior: smooth;
  
  /* Hide scrollbar on mobile */
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryTab = styled.button`
  flex-shrink: 0;
  padding: 12px 20px;
  border-radius: 25px;
  border: none;
  background: ${props => props.active ? '#4f46e5' : 'rgba(255, 255, 255, 0.9)'};
  color: ${props => props.active ? 'white' : '#4b5563'};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 80px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

// Products Grid (Mobile-optimized)
const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 16px;
  
  @media (max-width: 360px) {
    grid-template-columns: 1fr;
  }
`;

const ProductCard = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  opacity: ${props => props.available ? 1 : 0.6};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ProductImage = styled.div`
  width: 100%;
  height: 120px;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  position: relative;
`;

const ProductBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: ${props => {
    if (props.type === 'unavailable') return '#ef4444';
    if (props.type === 'latte-art') return '#8b5cf6';
    return '#10b981';
  }};
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
`;

const ProductInfo = styled.div`
  padding: 12px;
`;

const ProductName = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProductPrice = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #4f46e5;
  margin-bottom: 8px;
`;

const AddToCartButton = styled.button`
  width: 100%;
  height: 36px;
  border: none;
  border-radius: 18px;
  background: ${props => props.disabled ? '#d1d5db' : '#4f46e5'};
  color: white;
  font-weight: 600;
  font-size: 14px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: #4338ca;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
`;

// Bottom Cart Sheet
const BottomCartSheet = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  box-shadow: 0 -4px 25px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  transform: translateY(${props => props.expanded ? '0' : 'calc(100% - 70px)'});
  transition: transform 0.3s ease;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
`;

const CartHandle = styled.div`
  width: 40px;
  height: 4px;
  background: #d1d5db;
  border-radius: 2px;
  margin: 8px auto;
  cursor: pointer;
`;

const CartSummary = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CartInfo = styled.div`
  flex: 1;
`;

const CartItemCount = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 2px;
`;

const CartTotal = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
`;

const CartContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
`;

const CartItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const CartItemImage = styled.div`
  width: 50px;
  height: 50px;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  flex-shrink: 0;
`;

const CartItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CartItemName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CartItemPrice = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

const QuantityControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const QuantityButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const QuantityText = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  min-width: 20px;
  text-align: center;
`;

const CheckoutButton = styled.button`
  margin: 16px;
  height: 50px;
  border: none;
  border-radius: 25px;
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

// Out of Order Overlay
const OutOfOrderOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  color: white;
  text-align: center;
  padding: 40px 20px;
`;

const OutOfOrderIcon = styled.div`
  font-size: 80px;
  margin-bottom: 24px;
  color: #f59e0b;
`;

const OutOfOrderTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #f59e0b;
`;

const OutOfOrderMessage = styled.p`
  font-size: 16px;
  line-height: 1.6;
  max-width: 400px;
  color: #e5e7eb;
  margin-bottom: 32px;
`;

const OutOfOrderStatus = styled.div`
  padding: 12px 24px;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 8px;
  font-size: 14px;
  color: #fed7aa;
`;

function MobileKiosk() {
  // State management
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [cartExpanded, setCartExpanded] = useState(false);
  const [customizationModal, setCustomizationModal] = useState(null);
  const [frontendStatus, setFrontendStatus] = useState({ enabled: true, message: null });
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [loading, setLoading] = useState(true);

  // Refs
  const categoryTabsRef = useRef(null);

  // Fetch data functions
  const fetchCategories = async () => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.CATEGORIES));
      const result = await response.json();
      if (result.code === 0) {
        console.log('📱 MOBILE: Found categories:', result.data.length);
        setCategories(result.data);
        // Default to "All" category is already set in state
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(API_ENDPOINTS.PRODUCTS));
      const result = await response.json();
      if (result.code === 0) {
        console.log('📱 MOBILE: Found products:', result.data.length);
        setProducts(result.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Frontend status check
  const checkFrontendStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await fetch(getApiUrl('/api/motong/system-settings/status/frontend'));
      const result = await response.json();
      
      if (result.code === 0) {
        setFrontendStatus(result.data);
        console.log('📱 MOBILE: Frontend status:', result.data.enabled ? 'ENABLED' : 'DISABLED');
      } else {
        setFrontendStatus({ enabled: true, message: null });
      }
    } catch (error) {
      console.error('Error checking frontend status:', error);
      setFrontendStatus({ enabled: true, message: null });
    } finally {
      setCheckingStatus(false);
    }
  };

  // Cart functions
  const addToCart = (product) => {
    if (!product.available) return;

    // Check if product has options that need customization
    const hasOptions = product.hasBeanOptions || product.hasMilkOptions || 
                      product.hasIceOptions || product.hasShotOptions || 
                      product.hasLatteArt;

    if (hasOptions) {
      setCustomizationModal(product);
      return;
    }

    // Add directly to cart
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.product.id === product.id && 
        JSON.stringify(item.product.jsonCodeVal) === JSON.stringify(product.jsonCodeVal)
      );

      if (existingItem) {
        return prevCart.map(item =>
          item === existingItem 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { 
          product: { ...product }, 
          quantity: 1,
          id: Date.now() + Math.random()
        }];
      }
    });

    // Show cart briefly when item is added
    if (!cartExpanded) {
      setCartExpanded(true);
      setTimeout(() => setCartExpanded(false), 2000);
    }
  };

  const addCustomizedToCart = (customizedProduct) => {
    setCart(prevCart => [...prevCart, { 
      product: customizedProduct, 
      quantity: 1,
      id: Date.now() + Math.random()
    }]);
    setCustomizationModal(null);
    
    // Show cart briefly
    if (!cartExpanded) {
      setCartExpanded(true);
      setTimeout(() => setCartExpanded(false), 2000);
    }
  };

  const updateCartItemQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    } else {
      setCart(prevCart => 
        prevCart.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  // Submit order
  const submitOrder = async () => {
    if (cart.length === 0) return;

    try {
      const orderData = {
        deviceId: 1,
        totalAmount: cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        items: cart.map(item => ({
          goodsId: item.product.id,
          quantity: item.quantity,
          totalPrice: item.product.price * item.quantity,
          matterCodes: item.product.matterCodes,
          jsonCodeVal: item.product.jsonCodeVal,
          goodsOptionName: `${item.product.goodsNameEn}${item.product.customization ? ' (Customized)' : ''} - Mobile Kiosk`,
          goodsOptionNameEn: `${item.product.goodsNameEn}${item.product.customization ? ' (Customized)' : ''} - Mobile Kiosk`,
          lhImgPath: item.product.lhImgPath ? `${getApiBaseUrl()}${item.product.lhImgPath}` : ''
        }))
      };

      console.log('📱 MOBILE: Submitting order:', orderData);

      const response = await fetch(getApiUrl(API_ENDPOINTS.CREATE_ORDER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.code === 0) {
        console.log('📱 MOBILE: Order submitted successfully');
        
        // Print receipt if available
        try {
          await receiptPrinter.printReceipt(orderData, result.data);
        } catch (printError) {
          console.log('📱 MOBILE: Receipt printing not available');
        }

        // Clear cart and close
        setCart([]);
        setCartExpanded(false);
        
        // Show success message
        alert('Order placed successfully! 🎉');
      } else {
        throw new Error(result.msg || 'Failed to submit order');
      }
    } catch (error) {
      console.error('📱 MOBILE: Error submitting order:', error);
      alert('Error placing order. Please try again.');
    }
  };

  // Filter products by category
  const getFilteredProducts = () => {
    if (!selectedCategory || selectedCategory === 'All') {
      return products;
    }
    
    // Find the selected category name
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    if (!selectedCategoryData) {
      return products;
    }
    
    const categoryName = selectedCategoryData.categoryName;
    
    return products.filter(product => {
      // Use the actual category field from the database
      if (product.category) {
        return product.category === categoryName;
      }
      
      // Fallback to name-based categorization for existing products without category
      const name = product.goodsNameEn.toLowerCase();
      switch (categoryName) {
        case 'Classics':
          return name.includes('espresso') || name.includes('cappuccino') || name.includes('americano');
        case 'Latte Art':
          return name.includes('latte') || name.includes('art');
        case 'Specialty':
          return name.includes('mocha') || name.includes('macchiato') || name.includes('specialty');
        case 'Cold Brew':
          return name.includes('cold') || name.includes('iced') || name.includes('frappuccino');
        case 'Seasonal':
          return name.includes('pumpkin') || name.includes('holiday') || name.includes('seasonal');
        default:
          return true;
      }
    });
  };

  const filteredProducts = getFilteredProducts();
  
  // Debug logging
  console.log('📱 MOBILE: Current filtering state:', {
    selectedCategory,
    totalProducts: products.length,
    filteredProducts: filteredProducts.length,
    categories: categories.length
  });

  // Calculate cart totals
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Initialize data
  useEffect(() => {
    fetchCategories();
    fetchProducts();
    checkFrontendStatus();
  }, []);

  // WebSocket connection
  useEffect(() => {
    webSocketClient.connect();

    const handleInitialStatus = (data) => {
      setFrontendStatus({ enabled: data.frontendEnabled, message: data.outOfOrderMessage });
    };

    const handleFrontendStatusChange = (data) => {
      setFrontendStatus({ enabled: data.enabled, message: data.message });
    };

    const handleMatterCodesUpdate = () => {
      fetchProducts();
    };

    webSocketClient.on('initial_status', handleInitialStatus);
    webSocketClient.on('frontend_status_changed', handleFrontendStatusChange);
    webSocketClient.on('matter_codes_updated', handleMatterCodesUpdate);

    return () => {
      webSocketClient.off('initial_status', handleInitialStatus);
      webSocketClient.off('frontend_status_changed', handleFrontendStatusChange);
      webSocketClient.off('matter_codes_updated', handleMatterCodesUpdate);
    };
  }, []);

  // Out of order overlay
  if (!frontendStatus.enabled) {
    return (
      <OutOfOrderOverlay>
        <OutOfOrderIcon>
          <AlertTriangle size={80} />
        </OutOfOrderIcon>
        <OutOfOrderTitle>Out of Order</OutOfOrderTitle>
        <OutOfOrderMessage>
          {frontendStatus.message || 'Sorry, our coffee machine is temporarily out of order. Please try again later.'}
        </OutOfOrderMessage>
        <OutOfOrderStatus>
          System Status: Maintenance Mode
        </OutOfOrderStatus>
      </OutOfOrderOverlay>
    );
  }

  return (
    <MobileContainer>
      {/* Header */}
      <MobileHeader>
        <HeaderTitle>
          <Coffee size={20} />
          K2 Coffee
        </HeaderTitle>
        <HeaderActions>
          <IconButton onClick={() => setCartExpanded(!cartExpanded)} primary>
            <ShoppingCart size={20} />
            {cartItemCount > 0 && (
              <CartBadge>{cartItemCount}</CartBadge>
            )}
          </IconButton>
        </HeaderActions>
      </MobileHeader>

      {/* Main Content */}
      <MainContent>
        {/* Category Tabs */}
        <CategoryTabs ref={categoryTabsRef}>
          <CategoryTab
            active={selectedCategory === 'All'}
            onClick={() => setSelectedCategory('All')}
          >
            All Items
          </CategoryTab>
          {categories.map(category => (
            <CategoryTab
              key={category.id}
              active={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.categoryName}
            </CategoryTab>
          ))}
        </CategoryTabs>

        {/* Products Grid */}
        <ProductsGrid>
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              available={product.available}
              onClick={() => addToCart(product)}
            >
              <ProductImage src={getImageUrl(product.goodsPath)}>
                {!product.available && (
                  <ProductBadge type="unavailable">Out of Stock</ProductBadge>
                )}
                {product.available && product.hasLatteArt && (
                  <ProductBadge type="latte-art">🎨 Art</ProductBadge>
                )}
              </ProductImage>
              
              <ProductInfo>
                <ProductName>{product.goodsNameEn}</ProductName>
                <ProductPrice>{currencyUtils.formatPrice(product.price)}</ProductPrice>
                
                <AddToCartButton disabled={!product.available}>
                  {product.available ? (
                    <>
                      <Plus size={16} />
                      Add to Cart
                    </>
                  ) : (
                    'Out of Stock'
                  )}
                </AddToCartButton>
              </ProductInfo>
            </ProductCard>
          ))}
        </ProductsGrid>
      </MainContent>

      {/* Bottom Cart Sheet */}
      <BottomCartSheet expanded={cartExpanded}>
        <CartHandle onClick={() => setCartExpanded(!cartExpanded)} />
        
        <CartSummary onClick={() => setCartExpanded(!cartExpanded)}>
          <CartInfo>
            <CartItemCount>
              {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
            </CartItemCount>
            <CartTotal>{currencyUtils.formatPrice(cartTotal)}</CartTotal>
          </CartInfo>
          <IconButton>
            {cartExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </IconButton>
        </CartSummary>

        {cartExpanded && (
          <>
            <CartContent>
              {cart.map(item => (
                <CartItem key={item.id}>
                  <CartItemImage src={getImageUrl(item.product.goodsPath)} />
                  
                  <CartItemInfo>
                    <CartItemName>{item.product.goodsNameEn}</CartItemName>
                    <CartItemPrice>
                      {currencyUtils.formatPrice(item.product.price)} each
                    </CartItemPrice>
                  </CartItemInfo>

                  <QuantityControls>
                    <QuantityButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCartItemQuantity(item.id, item.quantity - 1);
                      }}
                    >
                      <Minus size={16} />
                    </QuantityButton>
                    
                    <QuantityText>{item.quantity}</QuantityText>
                    
                    <QuantityButton 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateCartItemQuantity(item.id, item.quantity + 1);
                      }}
                    >
                      <Plus size={16} />
                    </QuantityButton>
                  </QuantityControls>
                </CartItem>
              ))}
            </CartContent>

            <CheckoutButton 
              onClick={submitOrder}
              disabled={cart.length === 0}
            >
              <Check size={20} />
              Place Order • {currencyUtils.formatPrice(cartTotal)}
            </CheckoutButton>
          </>
        )}
      </BottomCartSheet>

      {/* Customization Modal */}
      {customizationModal && (
        <CustomizationModal
          product={customizationModal}
          onClose={() => setCustomizationModal(null)}
          onAddToCart={addCustomizedToCart}
        />
      )}
    </MobileContainer>
  );
}

export default MobileKiosk;
