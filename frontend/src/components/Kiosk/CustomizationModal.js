import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Coffee, Milk, Snowflake, Zap } from 'lucide-react';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const ModalOverlay = styled.div`
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
  animation: ${fadeIn} 0.3s ease;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  animation: ${slideUp} 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  padding: 24px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  .product-info {
    flex: 1;
    
    .product-name {
      font-size: 24px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 4px;
    }
    
    .product-price {
      font-size: 18px;
      font-weight: 600;
      color: #ff6b35;
    }
  }
  
  .close-button {
    width: 40px;
    height: 40px;
    border: none;
    background: #f7fafc;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #4a5568;
    transition: all 0.2s ease;
    
    &:hover {
      background: #edf2f7;
      transform: scale(1.05);
    }
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const OptionSection = styled.div`
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    
    .icon {
      width: 20px;
      height: 20px;
      color: #ff6b35;
    }
    
    .title {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
    }
  }
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
`;

const OptionButton = styled.button`
  padding: 16px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  
  &:hover {
    border-color: #ff6b35;
    background: #fff5f0;
  }
  
  &.selected {
    border-color: #ff6b35;
    background: #ff6b35;
    color: white;
  }
  
  .option-name {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 2px;
  }
  
  .option-desc {
    font-size: 12px;
    opacity: 0.8;
  }
`;

const QuantitySection = styled.div`
  padding: 20px 0;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .quantity-label {
    font-size: 16px;
    font-weight: 600;
    color: #2d3748;
  }
  
  .quantity-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .qty-btn {
      width: 40px;
      height: 40px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      background: white;
      color: #4a5568;
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        border-color: #ff6b35;
        color: #ff6b35;
      }
      
      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }
    
    .quantity {
      font-size: 20px;
      font-weight: 700;
      color: #2d3748;
      min-width: 30px;
      text-align: center;
    }
  }
`;

const AddToCartButton = styled.button`
  width: 100%;
  padding: 16px;
  background: #ff6b35;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;
  
  &:hover {
    background: #e55a2b;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

function CustomizationModal({ product, isOpen, onClose, onAddToCart }) {
  const [selectedOptions, setSelectedOptions] = useState({
    beanCode: product?.default_bean_code || 1,
    milkCode: product?.default_milk_code || 1,
    ice: product?.default_ice !== undefined ? product.default_ice : true,
    shots: product?.default_shots || 1
  });
  
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const updateOption = (key, value) => {
    setSelectedOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateQuantity = (change) => {
    setQuantity(prev => Math.max(1, Math.min(10, prev + change)));
  };

  const handleAddToCart = () => {
    // Calculate final price based on options
    let finalPrice = product.price;
    if (selectedOptions.shots === 2) {
      finalPrice += 0.5; // Add $0.50 for double shot
    }

    // Create customized product object
    const customizedProduct = {
      ...product,
      price: finalPrice,
      customization: selectedOptions,
      // Update jsonCodeVal with selected options
      jsonCodeVal: updateJsonCodeVal(product.jsonCodeVal, selectedOptions)
    };

    onAddToCart(customizedProduct, quantity);
    onClose();
  };

  const updateJsonCodeVal = (originalJson, options) => {
    try {
      const jsonArray = typeof originalJson === 'string' ? JSON.parse(originalJson) : originalJson;
      const updatedJson = [...jsonArray];

      // Update BeanCode
      const beanIndex = updatedJson.findIndex(item => item.BeanCode !== undefined);
      if (beanIndex >= 0) {
        updatedJson[beanIndex].BeanCode = options.beanCode.toString();
      } else if (product.has_bean_options) {
        updatedJson.push({ BeanCode: options.beanCode.toString() });
      }

      // Update MilkCode
      const milkIndex = updatedJson.findIndex(item => item.MilkCode !== undefined);
      if (milkIndex >= 0) {
        updatedJson[milkIndex].MilkCode = options.milkCode.toString();
      } else if (product.has_milk_options) {
        updatedJson.push({ MilkCode: options.milkCode.toString() });
      }

      // Update IceCode
      const iceIndex = updatedJson.findIndex(item => item.IceCode !== undefined);
      if (iceIndex >= 0) {
        updatedJson[iceIndex].IceCode = options.ice ? "1" : "0";
      } else if (product.has_ice_options) {
        updatedJson.push({ IceCode: options.ice ? "1" : "0" });
      }

      // Update ShotCode
      const shotIndex = updatedJson.findIndex(item => item.ShotCode !== undefined);
      if (shotIndex >= 0) {
        updatedJson[shotIndex].ShotCode = options.shots.toString();
      } else if (product.has_shot_options) {
        updatedJson.push({ ShotCode: options.shots.toString() });
      }

      return JSON.stringify(updatedJson);
    } catch (error) {
      console.error('Error updating jsonCodeVal:', error);
      return originalJson;
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <div className="product-info">
            <div className="product-name">{product.goodsNameEn}</div>
            <div className="product-price">${product.price.toFixed(2)}</div>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </ModalHeader>

        <ModalBody>
          {product.has_bean_options && (
            <OptionSection>
              <div className="section-header">
                <Coffee className="icon" />
                <div className="title">Bean Type</div>
              </div>
              <OptionGrid>
                <OptionButton
                  className={selectedOptions.beanCode === 1 ? 'selected' : ''}
                  onClick={() => updateOption('beanCode', 1)}
                >
                  <div className="option-name">Bean Type 1</div>
                  <div className="option-desc">House Blend</div>
                </OptionButton>
                <OptionButton
                  className={selectedOptions.beanCode === 2 ? 'selected' : ''}
                  onClick={() => updateOption('beanCode', 2)}
                >
                  <div className="option-name">Bean Type 2</div>
                  <div className="option-desc">Premium Roast</div>
                </OptionButton>
              </OptionGrid>
            </OptionSection>
          )}

          {product.has_milk_options && (
            <OptionSection>
              <div className="section-header">
                <Milk className="icon" />
                <div className="title">Milk Type</div>
              </div>
              <OptionGrid>
                <OptionButton
                  className={selectedOptions.milkCode === 1 ? 'selected' : ''}
                  onClick={() => updateOption('milkCode', 1)}
                >
                  <div className="option-name">Regular Milk</div>
                  <div className="option-desc">Whole milk</div>
                </OptionButton>
                <OptionButton
                  className={selectedOptions.milkCode === 2 ? 'selected' : ''}
                  onClick={() => updateOption('milkCode', 2)}
                >
                  <div className="option-name">Oat Milk</div>
                  <div className="option-desc">Plant-based</div>
                </OptionButton>
              </OptionGrid>
            </OptionSection>
          )}

          {product.has_ice_options && (
            <OptionSection>
              <div className="section-header">
                <Snowflake className="icon" />
                <div className="title">Ice Preference</div>
              </div>
              <OptionGrid>
                <OptionButton
                  className={selectedOptions.ice ? 'selected' : ''}
                  onClick={() => updateOption('ice', true)}
                >
                  <div className="option-name">With Ice</div>
                  <div className="option-desc">Regular ice</div>
                </OptionButton>
                <OptionButton
                  className={!selectedOptions.ice ? 'selected' : ''}
                  onClick={() => updateOption('ice', false)}
                >
                  <div className="option-name">No Ice</div>
                  <div className="option-desc">Hot beverage</div>
                </OptionButton>
              </OptionGrid>
            </OptionSection>
          )}

          {product.has_shot_options && (
            <OptionSection>
              <div className="section-header">
                <Zap className="icon" />
                <div className="title">Coffee Shots</div>
              </div>
              <OptionGrid>
                <OptionButton
                  className={selectedOptions.shots === 1 ? 'selected' : ''}
                  onClick={() => updateOption('shots', 1)}
                >
                  <div className="option-name">Single Shot</div>
                  <div className="option-desc">Regular strength</div>
                </OptionButton>
                <OptionButton
                  className={selectedOptions.shots === 2 ? 'selected' : ''}
                  onClick={() => updateOption('shots', 2)}
                >
                  <div className="option-name">Double Shot</div>
                  <div className="option-desc">+$0.50</div>
                </OptionButton>
              </OptionGrid>
            </OptionSection>
          )}

          <QuantitySection>
            <div className="quantity-label">Quantity</div>
            <div className="quantity-controls">
              <button 
                className="qty-btn"
                onClick={() => updateQuantity(-1)}
                disabled={quantity <= 1}
              >
                −
              </button>
              <div className="quantity">{quantity}</div>
              <button 
                className="qty-btn"
                onClick={() => updateQuantity(1)}
                disabled={quantity >= 10}
              >
                +
              </button>
            </div>
          </QuantitySection>

          <AddToCartButton onClick={handleAddToCart}>
            Add to Cart - ${((selectedOptions.shots === 2 ? product.price + 0.5 : product.price) * quantity).toFixed(2)}
          </AddToCartButton>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}

export default CustomizationModal;
