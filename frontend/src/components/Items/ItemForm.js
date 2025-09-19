import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Save, Upload, Coffee } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { getApiUrl, getApiBaseUrl, getImageUrl } from '../../utils/config';

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  max-height: 90vh;
`;

const Header = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .title {
    color: #1F2937;
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6B7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #F3F4F6;
    color: #374151;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const Content = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: #F9FAFB;
  min-height: 0; /* Important for flex child to be scrollable */
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #F1F5F9;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 4px;
    
    &:hover {
      background: #94A3B8;
    }
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const FormSection = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  
  .section-title {
    color: #1F2937;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 16px 0;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    color: #374151;
    font-weight: 500;
    margin-bottom: 6px;
    font-size: 0.9rem;
  }
  
  .required {
    color: #EF4444;
  }
  
  .helper-text {
    color: #6B7280;
    font-size: 0.8rem;
    margin-top: 4px;
  }
  
  .error {
    color: #EF4444;
    font-size: 0.8rem;
    margin-top: 4px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: white;
  color: #1F2937;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #6366F1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
  
  &.error {
    border-color: #EF4444;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: white;
  color: #1F2937;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #6366F1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

const ImageUpload = styled.div`
  border: 2px dashed #D1D5DB;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #6366F1;
    background: #F8FAFC;
  }
  
  .upload-icon {
    color: #6B7280;
    width: 32px;
    height: 32px;
    margin: 0 auto 8px;
  }
  
  .upload-text {
    color: #374151;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .upload-subtext {
    color: #6B7280;
    font-size: 0.8rem;
  }
  
  input[type="file"] {
    display: none;
  }
`;

const Footer = styled.div`
  padding: 20px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: white;
  flex-shrink: 0; /* Prevent footer from shrinking */
  position: sticky;
  bottom: 0;
  z-index: 10;
`;

const FooterButton = styled.button`
  background: ${props => props.variant === 'primary' ? '#6366F1' : 'white'};
  border: 1px solid ${props => props.variant === 'primary' ? '#6366F1' : '#D1D5DB'};
  color: ${props => props.variant === 'primary' ? 'white' : '#374151'};
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    background: ${props => props.variant === 'primary' ? '#5856EB' : '#F9FAFB'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

function ItemForm({ item, onClose, onSave }) {
  const [categories, setCategories] = useState([
    { name: 'Classics', icon: '☕' }
  ]);
  
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: item || {
      goodsId: '',
      goodsName: '',
      goodsNameEn: '',
      goodsNameOt: '',
      price: '',
      rePrice: '',
      type: 2,
      deviceGoodsId: '',
      goodsImg: '',
      language: 'en',
      // Customization options
      hasBeanOptions: false,
      hasMilkOptions: false,
      hasIceOptions: false,
      hasShotOptions: false,
      defaultBeanCode: 1,
      defaultMilkCode: 1,
      defaultIce: true,
      defaultShots: 1
    }
  });

  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (item) {
      // Transform the item data to match form field names
      const formData = {
        ...item,
        hasBeanOptions: Boolean(item.has_bean_options),
        hasMilkOptions: Boolean(item.has_milk_options),
        hasIceOptions: Boolean(item.has_ice_options),
        hasShotOptions: Boolean(item.has_shot_options),
        defaultBeanCode: item.default_bean_code || 1,
        defaultMilkCode: item.default_milk_code || 1,
        defaultIce: Boolean(item.default_ice),
        defaultShots: item.default_shots || 1
      };
      reset(formData);
    }
  }, [item, reset]);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiUrl = getApiUrl('/api/motong/categories');
        const response = await fetch(apiUrl);
        const result = await response.json();
        
        if (result.code === 0 && result.data) {
          setCategories(result.data);
        } else {
          console.error('Failed to fetch categories:', result.msg);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Upload the image immediately
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        console.log('📷 Uploading image:', file.name);
        
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/api/motong/upload/image`, {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        if (result.code === 0) {
          console.log('✅ Image uploaded successfully:', result.data);
          // Update the selected image with the server response
          setSelectedImage({
            ...file,
            serverPath: result.data.path,
            serverUrl: result.data.fullUrl,
            filename: result.data.filename
          });
        } else {
          console.error('❌ Image upload failed:', result.msg);
          alert(`Image upload failed: ${result.msg}`);
          setSelectedImage(null);
        }
      } catch (error) {
        console.error('❌ Error uploading image:', error);
        alert('Error uploading image. Please try again.');
        setSelectedImage(null);
      }
    }
  };

  const onSubmit = (data) => {
    // Basic validation
    if (!data.goodsName || !data.goodsNameEn || !data.price) {
      return;
    }

    // Prepare data for submission
    const itemData = {
      goodsId: item ? item.goodsId : parseInt(data.goodsId || data.deviceGoodsId),
      deviceGoodsId: parseInt(data.deviceGoodsId),
      goodsName: data.goodsName.trim(),
      goodsNameEn: data.goodsNameEn.trim(),
      goodsNameOt: data.goodsNameOt ? data.goodsNameOt.trim() : '',
      type: parseInt(data.type),
      price: parseFloat(data.price),
      rePrice: data.rePrice ? parseFloat(data.rePrice) : parseFloat(data.price),
      jsonCodeVal: item?.jsonCodeVal || `[{"classCode":"${5000 + parseInt(data.type)}"}]`,
      matterCodes: item?.matterCodes || '',
      path: selectedImage?.serverPath || item?.path || '',
      goodsPath: selectedImage?.serverUrl || item?.goodsPath || '',
      status: item?.status || 'active',
      // Customization options
      hasBeanOptions: Boolean(data.hasBeanOptions),
      hasMilkOptions: Boolean(data.hasMilkOptions),
      hasIceOptions: Boolean(data.hasIceOptions),
      hasShotOptions: Boolean(data.hasShotOptions),
      defaultBeanCode: parseInt(data.defaultBeanCode) || 1,
      defaultMilkCode: parseInt(data.defaultMilkCode) || 1,
      defaultIce: data.defaultIce === 'true' || data.defaultIce === true,
      defaultShots: parseInt(data.defaultShots) || 1
    };

    // Remove undefined/null values
    Object.keys(itemData).forEach(key => {
      if (itemData[key] === undefined || itemData[key] === null) {
        delete itemData[key];
      }
    });

    console.log('📤 Submitting item data:', itemData);
    onSave(itemData);
  };

  const productTypes = [
    { value: 1, label: 'Tea (奶茶)' },
    { value: 2, label: 'Coffee (咖啡)' },
    { value: 3, label: 'Ice Cream (冰淇淋)' },
    { value: 4, label: 'Other (其他)' }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: 'Chinese' },
    { value: 'ar', label: 'Arabic' }
  ];

  return (
    <FormContainer>
      <Header>
        <h2 className="title">
          <Coffee />
          {item ? 'Edit Item' : 'Create New Item'}
        </h2>
        <CloseButton onClick={onClose}>
          <X />
        </CloseButton>
      </Header>

      <Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormGrid>
            <div>
              <FormSection>
                <h3 className="section-title">Basic Information</h3>
                
                <FormGroup>
                  <label>
                    Product Name (Chinese) <span className="required">*</span>
                  </label>
                  <Input
                    {...register('goodsName', { required: 'Chinese name is required' })}
                    placeholder="意式浓缩"
                    className={errors.goodsName ? 'error' : ''}
                  />
                  {errors.goodsName && <div className="error">{errors.goodsName.message}</div>}
                </FormGroup>

                <FormGroup>
                  <label>
                    Product Name (English) <span className="required">*</span>
                  </label>
                  <Input
                    {...register('goodsNameEn', { required: 'English name is required' })}
                    placeholder="Espresso"
                    className={errors.goodsNameEn ? 'error' : ''}
                  />
                  {errors.goodsNameEn && <div className="error">{errors.goodsNameEn.message}</div>}
                </FormGroup>

                <FormGroup>
                  <label>Product Name (Other Language)</label>
                  <Input
                    {...register('goodsNameOt')}
                    placeholder="إسبرسو"
                  />
                  <div className="helper-text">Optional third language name</div>
                </FormGroup>

                <FormGroup>
                  <label>
                    Product Type <span className="required">*</span>
                  </label>
                  <Select {...register('type', { required: true })}>
                    {productTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                </FormGroup>

                <FormGroup>
                  <label>Language</label>
                  <Select {...register('language')}>
                    {languages.map(lang => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
              </FormSection>
            </div>

            <div>
              <FormSection>
                <h3 className="section-title">Pricing & Configuration</h3>
                
                <FormGroup>
                  <label>
                    Price (USD) <span className="required">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('price', { required: 'Price is required' })}
                    placeholder="1.50"
                    className={errors.price ? 'error' : ''}
                  />
                  {errors.price && <div className="error">{errors.price.message}</div>}
                </FormGroup>

                <FormGroup>
                  <label>Original Price (USD)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('rePrice')}
                    placeholder="2.00"
                  />
                  <div className="helper-text">Leave empty to use same as price</div>
                </FormGroup>

                <FormGroup>
                  <label>
                    Goods ID <span className="required">*</span>
                  </label>
                  <Input
                    type="number"
                    {...register('goodsId', { required: !item })} // Only required for new items
                    placeholder="6"
                    disabled={item ? true : false} // Disable for editing existing items
                    className={errors.goodsId ? 'error' : ''}
                  />
                  <div className="helper-text">Unique product identifier {item ? '(read-only)' : ''}</div>
                  {errors.goodsId && <div className="error">{errors.goodsId.message}</div>}
                </FormGroup>

                <FormGroup>
                  <label>
                    Device Goods ID <span className="required">*</span>
                  </label>
                  <Input
                    type="number"
                    {...register('deviceGoodsId', { required: 'Device goods ID is required' })}
                    placeholder="6"
                    className={errors.deviceGoodsId ? 'error' : ''}
                  />
                  <div className="helper-text">Device-specific identifier for this product</div>
                  {errors.deviceGoodsId && <div className="error">{errors.deviceGoodsId.message}</div>}
                </FormGroup>

                <FormGroup>
                  <label>Product Image</label>
                  <ImageUpload onClick={() => document.getElementById('image-upload').click()}>
                    <Upload className="upload-icon" />
                    <div className="upload-text">
                      {selectedImage ? selectedImage.name : 'Upload Product Image'}
                    </div>
                    <div className="upload-subtext">PNG, JPG up to 5MB</div>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </ImageUpload>
                </FormGroup>
              </FormSection>

              <FormSection>
                <h3 className="section-title">🏪 Kiosk Display Settings</h3>
                
                <FormGroup>
                  <label>Category</label>
                  <select 
                    {...register('category')}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: 'white'
                    }}
                  >
                    {categories.map(category => (
                      <option key={category.name} value={category.name}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  <div className="helper-text">Category for kiosk menu organization</div>
                </FormGroup>

                <FormGroup>
                  <label>Display Order</label>
                  <Input
                    type="number"
                    min="0"
                    {...register('displayOrder')}
                    placeholder="0"
                  />
                  <div className="helper-text">Lower numbers appear first in the menu (0 = first)</div>
                </FormGroup>
              </FormSection>

              <FormSection>
                <h3 className="section-title">🎛️ Customization Options</h3>
                
                <FormGroup>
                  <label>
                    <input 
                      type="checkbox" 
                      {...register('hasBeanOptions')}
                      style={{ marginRight: '8px' }}
                    />
                    Enable Bean Type Selection
                  </label>
                  <div className="helper-text">Allows customers to choose between Bean Type 1 or 2</div>
                  
                  {watch('hasBeanOptions') && (
                    <div style={{ marginTop: '12px', paddingLeft: '24px' }}>
                      <label>Default Bean Type</label>
                      <Select {...register('defaultBeanCode')}>
                        <option value={1}>Bean Type 1</option>
                        <option value={2}>Bean Type 2</option>
                      </Select>
                    </div>
                  )}
                </FormGroup>

                <FormGroup>
                  <label>
                    <input 
                      type="checkbox" 
                      {...register('hasMilkOptions')}
                      style={{ marginRight: '8px' }}
                    />
                    Enable Milk Type Selection
                  </label>
                  <div className="helper-text">Allows customers to choose between Regular Milk or Oat Milk</div>
                  
                  {watch('hasMilkOptions') && (
                    <div style={{ marginTop: '12px', paddingLeft: '24px' }}>
                      <label>Default Milk Type</label>
                      <Select {...register('defaultMilkCode')}>
                        <option value={1}>Regular Milk</option>
                        <option value={2}>Oat Milk</option>
                      </Select>
                    </div>
                  )}
                </FormGroup>

                <FormGroup>
                  <label>
                    <input 
                      type="checkbox" 
                      {...register('hasIceOptions')}
                      style={{ marginRight: '8px' }}
                    />
                    Enable Ice/No Ice Selection
                  </label>
                  <div className="helper-text">Allows customers to choose ice or no ice</div>
                  
                  {watch('hasIceOptions') && (
                    <div style={{ marginTop: '12px', paddingLeft: '24px' }}>
                      <label>Default Ice Setting</label>
                      <Select {...register('defaultIce')}>
                        <option value={true}>With Ice</option>
                        <option value={false}>No Ice</option>
                      </Select>
                    </div>
                  )}
                </FormGroup>

                <FormGroup>
                  <label>
                    <input 
                      type="checkbox" 
                      {...register('hasShotOptions')}
                      style={{ marginRight: '8px' }}
                    />
                    Enable Single/Double Shot Selection
                  </label>
                  <div className="helper-text">Allows customers to choose single or double shot (+$0.50)</div>
                  
                  {watch('hasShotOptions') && (
                    <div style={{ marginTop: '12px', paddingLeft: '24px' }}>
                      <label>Default Shot Count</label>
                      <Select {...register('defaultShots')}>
                        <option value={1}>Single Shot</option>
                        <option value={2}>Double Shot</option>
                      </Select>
                    </div>
                  )}
                </FormGroup>
              </FormSection>
            </div>
          </FormGrid>
        </form>
      </Content>

      <Footer>
        <FooterButton onClick={onClose}>
          Cancel
        </FooterButton>
        <FooterButton variant="primary" onClick={handleSubmit(onSubmit)}>
          <Save />
          {item ? 'Update Item' : 'Create Item'}
        </FooterButton>
      </Footer>
    </FormContainer>
  );
}

export default ItemForm;
