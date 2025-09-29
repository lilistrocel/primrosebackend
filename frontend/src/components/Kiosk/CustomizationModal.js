import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { X, Coffee, Milk, Snowflake, Zap, Palette, Upload, Camera } from 'lucide-react';
import { getApiUrl, getImageUrl } from '../../utils/config';
import { useLanguage } from '../../contexts/LanguageContext';
import { getOptionName, getOptionDescription } from '../../utils/optionNames';

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
  z-index: 1100; /* Higher than mobile cart (1001) */
  animation: ${fadeIn} 0.3s ease;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${slideUp} 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    max-width: 95vw;
    max-height: 85vh;
    margin: 10px;
    border-radius: 16px;
  }
  
  /* Mobile landscape */
  @media (max-width: 768px) and (orientation: landscape) {
    max-height: 90vh;
  }
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

const LatteArtGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
`;

const LatteArtOption = styled.button`
  padding: 8px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  
  &:hover {
    border-color: #ff6b35;
    background: #fff5f0;
  }
  
  &.selected {
    border-color: #ff6b35;
    background: #ff6b35;
    color: white;
  }
  
  .art-image {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    margin-bottom: 4px;
  }
  
  .art-icon {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
    opacity: 0.7;
  }
  
  .art-name {
    font-size: 10px;
    font-weight: 600;
    line-height: 1.2;
  }
`;

const UploadSection = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const UploadButton = styled.button`
  flex: 1;
  padding: 12px 8px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  
  &:hover {
    border-color: #ff6b35;
    background: #fff5f0;
  }
  
  &.selected {
    border-color: #ff6b35;
    background: #ff6b35;
    color: white;
  }
  
  .upload-icon {
    width: 16px;
    height: 16px;
  }
  
  .upload-text {
    font-size: 10px;
    font-weight: 500;
    text-align: center;
    line-height: 1.2;
  }
  
  input[type="file"] {
    display: none;
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
  const { currentLanguage, isRTL, t, getProductName } = useLanguage();
  const [selectedOptions, setSelectedOptions] = useState({
    beanCode: product?.default_bean_code || 1,
    milkCode: product?.default_milk_code || 1,
    ice: product?.defaultIce || false, // Default to false (no ice) unless explicitly true
    shots: product?.default_shots || 1,
    latteArt: null, // Selected latte art design ID or 'custom' for uploaded image
    latteArtImage: null // Path to selected latte art image
  });
  
  const [quantity, setQuantity] = useState(1);
  const [latteArtDesigns, setLatteArtDesigns] = useState([]);
  const [customImage, setCustomImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Reset options when product changes or modal opens
  useEffect(() => {
    if (isOpen && product) {
      console.log('🔧 Resetting customization options for product:', product.goodsNameEn);
      console.log('🧊 Product defaultIce value:', product.defaultIce);
      
      setSelectedOptions({
        beanCode: product.default_bean_code || 1,
        milkCode: product.default_milk_code || 1,
        ice: product.defaultIce || false, // Use product's defaultIce setting
        shots: product.default_shots || 1,
        latteArt: null,
        latteArtImage: null
      });
      setQuantity(1);
      setCustomImage(null);
    }
  }, [product, isOpen]);

  // Fetch latte art designs when product has latte art option
  useEffect(() => {
    if (product?.hasLatteArt && isOpen) {
      fetchLatteArtDesigns();
    }
  }, [product?.hasLatteArt, isOpen]);

  const fetchLatteArtDesigns = async () => {
    try {
      const response = await fetch(getApiUrl('/api/motong/latte-art'));
      const result = await response.json();
      
      if (result.code === 0) {
        setLatteArtDesigns(result.data);
      } else {
        console.error('Failed to fetch latte art designs:', result.msg);
      }
    } catch (error) {
      console.error('Error fetching latte art designs:', error);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(getApiUrl('/api/motong/latte-art/upload-temp'), {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.code === 0) {
        setCustomImage(result.data);
        updateOption('latteArt', 'custom');
        updateOption('latteArtImage', result.data.imagePath);
        console.log('🎨 Custom latte art uploaded:', result.data.imagePath);
      } else {
        alert('Failed to upload image: ' + result.msg);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLatteArtSelect = (design) => {
    if (design === 'none') {
      updateOption('latteArt', null);
      updateOption('latteArtImage', null);
    } else if (design === 'custom') {
      // Will be handled by file upload
      updateOption('latteArt', 'custom');
    } else {
      updateOption('latteArt', design.id);
      updateOption('latteArtImage', design.imagePath);
      setCustomImage(null); // Clear custom image if selecting predefined
    }
  };

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

    // Determine the correct classCode based on variant options
    const variantClassCode = getVariantClassCode(product, selectedOptions);

    // Create customized product object
    const updatedJsonCodeVal = updateJsonCodeValWithVariant(product.jsonCodeVal, selectedOptions, variantClassCode);
    
    console.log('🎯 CUSTOMIZATION DEBUG:');
    console.log('   Original jsonCodeVal:', product.jsonCodeVal);
    console.log('   Selected options:', selectedOptions);
    console.log('   Variant classCode:', variantClassCode);
    console.log('   Updated jsonCodeVal:', updatedJsonCodeVal);
    
    const customizedProduct = {
      ...product,
      price: finalPrice,
      customization: selectedOptions,
      // Update jsonCodeVal with variant classCode and remaining options
      jsonCodeVal: updatedJsonCodeVal,
      // Add latte art image path for printing
      lhImgPath: selectedOptions.latteArtImage || ""
    };
    
    console.log('🛒 FINAL CUSTOMIZED PRODUCT:', customizedProduct);

    onAddToCart(customizedProduct, quantity);
    onClose();
  };

  // Determine which classCode to use based on ice and shot options
  const getVariantClassCode = (product, options) => {
    const hasIce = options.ice;
    const hasDoubleShot = options.shots === 2;
    
    // 🎯 MANUAL VARIANT CLASSCODES ONLY
    // Use manually configured variant classCodes from database
    if (hasIce && hasDoubleShot && product.icedAndDoubleClassCode) {
      console.log(`🧊⚡ Using iced + double shot classCode: ${product.icedAndDoubleClassCode}`);
      return product.icedAndDoubleClassCode;
    } else if (hasIce && product.icedClassCode) {
      console.log(`🧊 Using iced classCode: ${product.icedClassCode}`);
      return product.icedClassCode;
    } else if (hasDoubleShot && product.doubleShotClassCode) {
      console.log(`⚡ Using double shot classCode: ${product.doubleShotClassCode}`);
      return product.doubleShotClassCode;
    }
    
    // Fall back to original classCode from jsonCodeVal
    try {
      const jsonArray = typeof product.jsonCodeVal === 'string' ? JSON.parse(product.jsonCodeVal) : product.jsonCodeVal;
      const classCodeObj = jsonArray.find(item => item.classCode !== undefined);
      const originalClassCode = classCodeObj ? classCodeObj.classCode : null;
      console.log(`📋 Using original classCode: ${originalClassCode}`);
      return originalClassCode;
    } catch (error) {
      console.error('Error parsing original jsonCodeVal:', error);
      return null;
    }
  };

  // Update jsonCodeVal with new variant classCode and remaining customization options
  const updateJsonCodeValWithVariant = (originalJson, options, variantClassCode) => {
    try {
      const jsonArray = typeof originalJson === 'string' ? JSON.parse(originalJson) : originalJson;
      const updatedJson = [...jsonArray];

      // Update or set the classCode (most important change)
      const classCodeIndex = updatedJson.findIndex(item => item.classCode !== undefined);
      if (classCodeIndex >= 0 && variantClassCode) {
        updatedJson[classCodeIndex].classCode = variantClassCode;
      } else if (variantClassCode) {
        updatedJson.unshift({ classCode: variantClassCode }); // Add to beginning
      }

      // For non-variant options, we still update the jsonCodeVal
      // (This handles bean type, milk type, etc. that aren't variants)
      
      // Update BeanCode (if not using variant)
      const beanIndex = updatedJson.findIndex(item => item.BeanCode !== undefined);
      if (beanIndex >= 0) {
        updatedJson[beanIndex].BeanCode = options.beanCode.toString();
      } else if (product.has_bean_options) {
        updatedJson.push({ BeanCode: options.beanCode.toString() });
      }

      // Update MilkCode (if not using variant)
      const milkIndex = updatedJson.findIndex(item => item.MilkCode !== undefined);
      if (milkIndex >= 0) {
        updatedJson[milkIndex].MilkCode = options.milkCode.toString();
      } else if (product.has_milk_options) {
        updatedJson.push({ MilkCode: options.milkCode.toString() });
      }

      // AUTOMATIC CupCode based on ice selection - APPLIES TO ALL ITEMS
      const cupIndex = updatedJson.findIndex(item => item.CupCode !== undefined);
      const cupCode = options.ice ? "3" : "2"; // 3 for iced (larger cup), 2 for regular
      
      if (cupIndex >= 0) {
        updatedJson[cupIndex].CupCode = cupCode;
      } else {
        updatedJson.push({ CupCode: cupCode });
      }
      
      console.log(`🧊 CupCode Logic: ${options.ice ? 'With Ice' : 'No Ice'} → CupCode: ${cupCode}`);

      // Note: We DON'T add IceCode or ShotCode anymore since those are handled by variant classCodes
      // Only add them if no variant classCode was used (fallback behavior)
      const usingVariantForIce = (options.ice && product.icedClassCode) || (options.ice && options.shots === 2 && product.icedAndDoubleClassCode);
      const usingVariantForShots = (options.shots === 2 && product.doubleShotClassCode) || (options.ice && options.shots === 2 && product.icedAndDoubleClassCode);

      if (!usingVariantForIce && product.has_ice_options) {
        const iceIndex = updatedJson.findIndex(item => item.IceCode !== undefined);
        if (iceIndex >= 0) {
          updatedJson[iceIndex].IceCode = options.ice ? "1" : "0";
        } else {
          updatedJson.push({ IceCode: options.ice ? "1" : "0" });
        }
      }

      if (!usingVariantForShots && product.has_shot_options) {
        const shotIndex = updatedJson.findIndex(item => item.ShotCode !== undefined);
        if (shotIndex >= 0) {
          updatedJson[shotIndex].ShotCode = options.shots.toString();
        } else {
          updatedJson.push({ ShotCode: options.shots.toString() });
        }
      }

      console.log('🎯 Variant ClassCode System:', {
        originalClassCode: jsonArray.find(item => item.classCode)?.classCode,
        selectedOptions: options,
        variantClassCode,
        finalJsonCodeVal: JSON.stringify(updatedJson)
      });

      return JSON.stringify(updatedJson);
    } catch (error) {
      console.error('Error updating jsonCodeVal with variant:', error);
      return originalJson;
    }
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
            <div className="product-name">{getProductName(product)}</div>
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
                <div className="title">{t('beanType')}</div>
              </div>
              <OptionGrid>
                <OptionButton
                  className={selectedOptions.beanCode === 1 ? 'selected' : ''}
                  onClick={() => updateOption('beanCode', 1)}
                >
                  <div className="option-name">{getOptionName('beanType1', currentLanguage)}</div>
                  <div className="option-desc">{getOptionDescription('beanType1', currentLanguage)}</div>
                </OptionButton>
                <OptionButton
                  className={selectedOptions.beanCode === 2 ? 'selected' : ''}
                  onClick={() => updateOption('beanCode', 2)}
                >
                  <div className="option-name">{getOptionName('beanType2', currentLanguage)}</div>
                  <div className="option-desc">{getOptionDescription('beanType2', currentLanguage)}</div>
                </OptionButton>
              </OptionGrid>
            </OptionSection>
          )}

          {product.has_milk_options && (
            <OptionSection>
              <div className="section-header">
                <Milk className="icon" />
                <div className="title">{t('milkType')}</div>
              </div>
              <OptionGrid>
                <OptionButton
                  className={selectedOptions.milkCode === 1 ? 'selected' : ''}
                  onClick={() => updateOption('milkCode', 1)}
                >
                  <div className="option-name">{getOptionName('milkType1', currentLanguage)}</div>
                  <div className="option-desc">{getOptionDescription('milkType1', currentLanguage)}</div>
                </OptionButton>
                <OptionButton
                  className={selectedOptions.milkCode === 2 ? 'selected' : ''}
                  onClick={() => updateOption('milkCode', 2)}
                >
                  <div className="option-name">{getOptionName('milkType2', currentLanguage)}</div>
                  <div className="option-desc">{getOptionDescription('milkType2', currentLanguage)}</div>
                </OptionButton>
              </OptionGrid>
            </OptionSection>
          )}

          {product.has_ice_options && (
            <OptionSection>
              <div className="section-header">
                <Snowflake className="icon" />
                <div className="title">{t('icePreference')}</div>
              </div>
              <OptionGrid>
                <OptionButton
                  className={selectedOptions.ice ? 'selected' : ''}
                  onClick={() => updateOption('ice', true)}
                >
                  <div className="option-name">{getOptionName('withIce', currentLanguage)}</div>
                  <div className="option-desc">{getOptionDescription('withIce', currentLanguage)}</div>
                </OptionButton>
                <OptionButton
                  className={!selectedOptions.ice ? 'selected' : ''}
                  onClick={() => updateOption('ice', false)}
                >
                  <div className="option-name">{getOptionName('noIce', currentLanguage)}</div>
                  <div className="option-desc">{getOptionDescription('noIce', currentLanguage)}</div>
                </OptionButton>
              </OptionGrid>
            </OptionSection>
          )}

          {product.has_shot_options && (
            <OptionSection>
              <div className="section-header">
                <Zap className="icon" />
                <div className="title">{t('coffeeShots')}</div>
              </div>
              <OptionGrid>
                <OptionButton
                  className={selectedOptions.shots === 1 ? 'selected' : ''}
                  onClick={() => updateOption('shots', 1)}
                >
                  <div className="option-name">{getOptionName('singleShot', currentLanguage)}</div>
                  <div className="option-desc">{getOptionDescription('singleShot', currentLanguage)}</div>
                </OptionButton>
                <OptionButton
                  className={selectedOptions.shots === 2 ? 'selected' : ''}
                  onClick={() => updateOption('shots', 2)}
                >
                  <div className="option-name">{getOptionName('doubleShot', currentLanguage)}</div>
                  <div className="option-desc">{getOptionDescription('doubleShot', currentLanguage)}</div>
                </OptionButton>
              </OptionGrid>
            </OptionSection>
          )}

          {product.hasLatteArt && (
            <OptionSection>
              <div className="section-header">
                <Palette className="icon" />
                <div className="title">{t('latteArtDesign')}</div>
              </div>
              
              <LatteArtGrid>
                {/* No latte art option */}
                <LatteArtOption
                  className={selectedOptions.latteArt === null ? 'selected' : ''}
                  onClick={() => handleLatteArtSelect('none')}
                >
                  <X className="art-icon" />
                  <div className="art-name">{t('none')}</div>
                </LatteArtOption>

                {/* Predefined designs */}
                {latteArtDesigns.map(design => (
                  <LatteArtOption
                    key={design.id}
                    className={selectedOptions.latteArt === design.id ? 'selected' : ''}
                    onClick={() => handleLatteArtSelect(design)}
                  >
                    {design.imagePath ? (
                      <img 
                        src={getImageUrl(design.imagePath)} 
                        alt={design.name}
                        className="art-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <Palette className="art-icon" style={{ display: design.imagePath ? 'none' : 'block' }} />
                    <div className="art-name">{design.name}</div>
                  </LatteArtOption>
                ))}
              </LatteArtGrid>

              <UploadSection>
                <UploadButton
                  className={selectedOptions.latteArt === 'custom' ? 'selected' : ''}
                  onClick={() => document.getElementById('custom-image-upload').click()}
                  disabled={uploadingImage}
                >
                  <Upload className="upload-icon" />
                  <div className="upload-text">
                    {uploadingImage ? t('uploading') : t('uploadCustom')}
                  </div>
                  <input
                    id="custom-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        handleImageUpload(file);
                      }
                    }}
                  />
                </UploadButton>
                
                <UploadButton
                  onClick={() => {
                    // For future implementation - camera capture
                    alert('Camera feature coming soon!');
                  }}
                >
                  <Camera className="upload-icon" />
                  <div className="upload-text">{t('takePhoto')}</div>
                </UploadButton>
              </UploadSection>

              {/* Show preview of selected custom image */}
              {customImage && selectedOptions.latteArt === 'custom' && (
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                    {t('customImagePreview')}
                  </div>
                  <img 
                    src={getImageUrl(customImage.imagePath)} 
                    alt="Custom latte art"
                    style={{ 
                      width: '60px', 
                      height: '60px', 
                      borderRadius: '8px', 
                      objectFit: 'cover',
                      border: '2px solid #ff6b35'
                    }}
                  />
                </div>
              )}
            </OptionSection>
          )}

          <QuantitySection>
            <div className="quantity-label">{t('quantity')}</div>
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
            {t('addToCart')} - ${((selectedOptions.shots === 2 ? product.price + 0.5 : product.price) * quantity).toFixed(2)}
          </AddToCartButton>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}

export default CustomizationModal;
