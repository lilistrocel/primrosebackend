import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ShoppingCart, Plus, Minus, Coffee, Check, X, DollarSign } from 'lucide-react';
import { getApiUrl, API_ENDPOINTS } from '../utils/config';
import currencyUtils from '../utils/currency';
import { formatIngredientList } from '../services/ingredients';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 30px;
  
  .title {
    color: white;
    font-size: 2rem;
    font-weight: bold;
    margin: 0 0 8px 0;
  }
  
  .subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.1rem;
  }
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const ProductCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  .product-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    
    .product-info {
      flex: 1;
      
      .product-name {
        color: white;
        font-size: 1.2rem;
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .product-name-alt {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
        margin-bottom: 8px;
      }
      
      .product-type {
        background: rgba(99, 102, 241, 0.2);
        color: #6366F1;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        display: inline-block;
      }
    }
    
    .product-icon {
      color: #10B981;
      width: 24px;
      height: 24px;
    }
  }
  
  .product-details {
    margin-bottom: 16px;
    
    .price {
      color: #10B981;
      font-size: 1.1rem;
      font-weight: bold;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .ingredients {
      margin-top: 8px;
      
      .ingredients-label {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.8rem;
        margin-bottom: 4px;
        text-transform: uppercase;
        font-weight: 500;
      }
      
      .ingredient-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        
        .ingredient-tag {
          background: rgba(16, 185, 129, 0.2);
          color: #10B981;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 500;
        }
      }
    }
  }
  
  .product-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .quantity-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .quantity-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        svg {
          width: 16px;
          height: 16px;
        }
      }
      
      .quantity {
        color: white;
        font-weight: bold;
        min-width: 20px;
        text-align: center;
      }
    }
    
    .add-to-cart {
      background: linear-gradient(135deg, #10B981, #059669);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      
      svg {
        width: 16px;
        height: 16px;
      }
    }
  }
`;

const CartSummary = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  position: sticky;
  top: 20px;
  
  .cart-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    
    .cart-icon {
      color: #10B981;
      width: 24px;
      height: 24px;
    }
    
    .cart-title {
      color: white;
      font-size: 1.2rem;
      font-weight: bold;
    }
    
    .cart-count {
      background: #10B981;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: bold;
    }
  }
  
  .cart-items {
    margin-bottom: 20px;
    
    .cart-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      
      &:last-child {
        border-bottom: none;
      }
      
      .item-info {
        flex: 1;
        
        .item-name {
          color: white;
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .item-details {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.8rem;
        }
      }
      
      .item-price {
        color: #10B981;
        font-weight: bold;
      }
    }
    
    .empty-cart {
      text-align: center;
      color: rgba(255, 255, 255, 0.6);
      padding: 20px;
      font-style: italic;
    }
  }
  
  .cart-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 2px solid rgba(255, 255, 255, 0.2);
    margin-bottom: 20px;
    
    .total-label {
      color: white;
      font-size: 1.1rem;
      font-weight: bold;
    }
    
    .total-amount {
      color: #10B981;
      font-size: 1.3rem;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
  
  .checkout-btn {
    width: 100%;
    background: linear-gradient(135deg, #6366F1, #4F46E5);
    border: none;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const SuccessModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .modal-content {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 40px;
    text-align: center;
    max-width: 400px;
    
    .success-icon {
      color: #10B981;
      width: 64px;
      height: 64px;
      margin: 0 auto 20px;
    }
    
    .success-title {
      color: white;
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 12px;
    }
    
    .success-message {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 24px;
      line-height: 1.5;
    }
    
    .order-number {
      background: rgba(16, 185, 129, 0.2);
      color: #10B981;
      padding: 8px 16px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      margin-bottom: 24px;
      display: inline-block;
    }
    
    .modal-actions {
      display: flex;
      gap: 12px;
      
      .modal-btn {
        flex: 1;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        
        &.primary {
          background: linear-gradient(135deg, #10B981, #059669);
          color: white;
          
          &:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
        }
        
        &.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          
          &:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        }
      }
    }
  }
`;

// Available products based on backend mock data
const AVAILABLE_PRODUCTS = [
  {
    id: 6,
    deviceGoodsId: 6,
    goodsName: "意式浓缩",
    goodsNameEn: "Espresso",
    goodsNameOt: "إسبرسو",
    type: 2, // Coffee
    price: 1.50,
    rePrice: 1.50,
    matterCodes: "CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5",
    jsonCodeVal: [
      {"classCode": "5001"},
      {"CupCode": "2"},
      {"BeanCode": "1"}
    ],
    goodsOptionName: "8oz纸杯;咖啡豆1",
    goodsOptionNameEn: "8ozCup;CoffeeBean1"
  },
  {
    id: 7,
    deviceGoodsId: 7,
    goodsName: "卡布奇诺", 
    goodsNameEn: "Cappuccino",
    goodsNameOt: "كابتشينو",
    type: 2, // Coffee
    price: 2.50,
    rePrice: 2.50,
    matterCodes: "CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter3,CoffeeMatter6",
    jsonCodeVal: [
      {"classCode": "5002"},
      {"CupCode": "3"},
      {"BeanCode": "2"}
    ],
    goodsOptionName: "12oz纸杯;咖啡豆2",
    goodsOptionNameEn: "12ozCup;CoffeeBean2"
  },
  {
    id: 8,
    deviceGoodsId: 8,
    goodsName: "拿铁",
    goodsNameEn: "Latte",
    goodsNameOt: "لاتيه",
    type: 2, // Coffee
    price: 3.00,
    rePrice: 3.00,
    matterCodes: "CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter3",
    jsonCodeVal: [
      {"classCode": "5003"},
      {"CupCode": "3"},
      {"BeanCode": "1"}
    ],
    goodsOptionName: "12oz纸杯;咖啡豆1;额外牛奶",
    goodsOptionNameEn: "12ozCup;CoffeeBean1;ExtraMilk"
  },
  {
    id: 9,
    deviceGoodsId: 9,
    goodsName: "美式咖啡",
    goodsNameEn: "Americano",
    goodsNameOt: "أمريكانو",
    type: 2, // Coffee
    price: 2.00,
    rePrice: 2.00,
    matterCodes: "CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5",
    jsonCodeVal: [
      {"classCode": "5004"},
      {"CupCode": "2"},
      {"BeanCode": "1"}
    ],
    goodsOptionName: "8oz纸杯;咖啡豆1;热水",
    goodsOptionNameEn: "8ozCup;CoffeeBean1;HotWater"
  }
];

function CreateOrder() {
  const [cart, setCart] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const getProductType = (type) => {
    switch (type) {
      case 1: return 'Tea';
      case 2: return 'Coffee';
      case 3: return 'Ice Cream';
      case 4: return 'Other';
      default: return 'Unknown';
    }
  };

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

  const addToCart = (product) => {
    const quantity = getQuantity(product.id);
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCart(prev => prev.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart(prev => [...prev, { product, quantity }]);
    }
    
    // Reset quantity to 1 after adding
    setQuantities(prev => ({ ...prev, [product.id]: 1 }));
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
    return `${timestamp.slice(-10)}`;
  };

  const submitOrder = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const orderNum = generateOrderNumber();
      const totalPrice = getCartTotal();

      // Create the main order
      const orderData = {
        orderNum,
        deviceId: 1,
        totalPrice,
        items: cart.map(item => ({
          goodsId: item.product.id,
          deviceGoodsId: item.product.deviceGoodsId,
          goodsName: item.product.goodsName,
          goodsNameEn: item.product.goodsNameEn,
          goodsNameOt: item.product.goodsNameOt,
          type: item.product.type,
          price: item.product.price,
          rePrice: item.product.rePrice,
          quantity: item.quantity,
          totalPrice: item.product.price * item.quantity,
          matterCodes: item.product.matterCodes,
          jsonCodeVal: item.product.jsonCodeVal, // Already a JSON string from database
          goodsOptionName: item.product.goodsOptionName,
          goodsOptionNameEn: item.product.goodsOptionNameEn
        }))
      };

      // Submit to backend (we'll need to create this endpoint)
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
      <Header>
        <h1 className="title">Create New Order</h1>
        <p className="subtitle">Select products and create orders for the coffee machine</p>
      </Header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div>
          <ProductGrid>
            {AVAILABLE_PRODUCTS.map(product => {
              const ingredients = formatIngredientList(product.matterCodes);
              const quantity = getQuantity(product.id);
              
              return (
                <ProductCard key={product.id}>
                  <div className="product-header">
                    <div className="product-info">
                      <div className="product-name">{product.goodsNameEn}</div>
                      <div className="product-name-alt">{product.goodsName}</div>
                      <div className="product-type">{getProductType(product.type)}</div>
                    </div>
                    <Coffee className="product-icon" />
                  </div>
                  
                  <div className="product-details">
                    <div className="price">
                      <DollarSign size={16} />
                      {product.price.toFixed(2)}
                    </div>
                    
                    <div className="ingredients">
                      <div className="ingredients-label">Required Ingredients</div>
                      <div className="ingredient-tags">
                        {ingredients.slice(0, 4).map((ingredient, index) => (
                          <span key={index} className="ingredient-tag" title={ingredient.fullName}>
                            {ingredient.name}
                          </span>
                        ))}
                        {ingredients.length > 4 && (
                          <span className="ingredient-tag">+{ingredients.length - 4}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="product-actions">
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(product.id, -1)}
                        disabled={quantity <= 1}
                      >
                        <Minus />
                      </button>
                      <span className="quantity">{quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => updateQuantity(product.id, 1)}
                        disabled={quantity >= 10}
                      >
                        <Plus />
                      </button>
                    </div>
                    
                    <button 
                      className="add-to-cart"
                      onClick={() => addToCart(product)}
                    >
                      <Plus />
                      Add to Cart
                    </button>
                  </div>
                </ProductCard>
              );
            })}
          </ProductGrid>
        </div>

        <CartSummary>
          <div className="cart-header">
            <ShoppingCart className="cart-icon" />
            <span className="cart-title">Order Summary</span>
            {getCartItemCount() > 0 && (
              <span className="cart-count">{getCartItemCount()}</span>
            )}
          </div>
          
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">No items in cart</div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="cart-item">
                  <div className="item-info">
                    <div className="item-name">{item.product.goodsNameEn}</div>
                    <div className="item-details">
                      Qty: {item.quantity} × {currencyUtils.formatPrice(item.product.price)}
                    </div>
                  </div>
                  <div className="item-price">
{currencyUtils.formatPrice(item.product.price * item.quantity)}
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.product.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      cursor: 'pointer',
                      marginLeft: '8px'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          {cart.length > 0 && (
            <>
              <div className="cart-total">
                <span className="total-label">Total</span>
                <span className="total-amount">
                  {currencyUtils.formatPrice(getCartTotal())}
                </span>
              </div>
              
              <button 
                className="checkout-btn"
                onClick={submitOrder}
                disabled={isSubmitting || cart.length === 0}
              >
                <Check />
                {isSubmitting ? 'Creating Order...' : 'Create Order'}
              </button>
            </>
          )}
        </CartSummary>
      </div>

      {showSuccess && (
        <SuccessModal>
          <div className="modal-content">
            <Check className="success-icon" />
            <h2 className="success-title">Order Created Successfully!</h2>
            <p className="success-message">
              Your order has been submitted to the coffee machine queue.
            </p>
            <div className="order-number">#{orderNumber}</div>
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={closeSuccessModal}>
                Create Another Order
              </button>
              <button 
                className="modal-btn secondary" 
                onClick={() => {
                  closeSuccessModal();
                  // Navigate to order monitor
                  window.location.href = '/order-monitor';
                }}
              >
                View Orders
              </button>
            </div>
          </div>
        </SuccessModal>
      )}
    </Container>
  );
}

export default CreateOrder;
