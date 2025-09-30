import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../services/api';

const ConfigContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  margin-left: 10px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
  }
`;

const ContentSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 20px 0;
`;

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const ProductCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }
`;

const ProductName = styled.h3`
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 15px 0;
`;

const IngredientList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const IngredientItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
`;

const IngredientName = styled.span`
  color: white;
  font-weight: 500;
`;

const IngredientInput = styled.input`
  width: 80px;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.9rem;
  text-align: right;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
  }
`;

const UnitLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  margin-left: 4px;
`;

const SaveButton = styled.button`
  background: linear-gradient(135deg, #2ed573 0%, #20bf6b 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(46, 213, 115, 0.4);
  margin-top: 15px;
  width: 100%;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(46, 213, 115, 0.6);
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: white;
  font-size: 1.2rem;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 71, 87, 0.1);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 8px;
  padding: 16px;
  color: #ff4757;
  margin-bottom: 20px;
`;

const SuccessMessage = styled.div`
  background: rgba(46, 213, 115, 0.1);
  border: 1px solid rgba(46, 213, 115, 0.3);
  border-radius: 8px;
  padding: 16px;
  color: #2ed573;
  margin-bottom: 20px;
`;

const InfoBox = styled.div`
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  padding: 16px;
  color: #667eea;
  margin-bottom: 20px;
`;

function ProductConsumptionConfig() {
  const [products, setProducts] = useState([]);
  const [consumptionData, setConsumptionData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/motong/products');
      setProducts(response.data.data);
      
      // Initialize consumption data with defaults
      const initialData = {};
      response.data.data.forEach(product => {
        initialData[product.id] = {
          milk: 200, // Default milk consumption
          coffee_beans: 18, // Default coffee consumption
          cups: 1, // Always 1 cup per item
          water: 0 // Default water consumption
        };
      });
      setConsumptionData(initialData);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleConsumptionChange = (productId, ingredient, value) => {
    setConsumptionData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [ingredient]: parseFloat(value) || 0
      }
    }));
  };

  const saveConsumptionConfig = async (productId) => {
    try {
      setError(null);
      setSuccess(null);
      
      const config = consumptionData[productId];
      
      // Create consumption configuration for this product
      await api.post(`/api/motong/inventory/products/${productId}/consumption-config`, {
        milk_consumption: config.milk,
        coffee_beans_consumption: config.coffee_beans,
        cups_consumption: config.cups,
        water_consumption: config.water
      });
      
      setSuccess(`Consumption configuration saved for ${products.find(p => p.id === productId)?.goods_name_en}`);
    } catch (err) {
      console.error('Error saving consumption config:', err);
      setError('Failed to save consumption configuration');
    }
  };

  const saveAllConfigurations = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const productId of Object.keys(consumptionData)) {
        try {
          const config = consumptionData[productId];
          
          await api.post(`/api/motong/inventory/products/${productId}/consumption-config`, {
            milk_consumption: config.milk,
            coffee_beans_consumption: config.coffee_beans,
            cups_consumption: config.cups,
            water_consumption: config.water
          });
          
          successCount++;
        } catch (err) {
          console.error(`Error saving config for product ${productId}:`, err);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        setSuccess(`Successfully saved consumption configuration for ${successCount} products${errorCount > 0 ? ` (${errorCount} errors)` : ''}`);
      } else {
        setError('Failed to save any consumption configurations');
      }
    } catch (err) {
      console.error('Error saving all configurations:', err);
      setError('Failed to save consumption configurations');
    }
  };

  if (loading) {
    return (
      <ConfigContainer>
        <LoadingSpinner>Loading product consumption configuration...</LoadingSpinner>
      </ConfigContainer>
    );
  }

  return (
    <ConfigContainer>
      <Header>
        <Title>Product Consumption Configuration</Title>
        <div>
          <ActionButton 
            className="secondary" 
            onClick={() => window.location.href = '/inventory/management'}
          >
            Back to Inventory
          </ActionButton>
          <ActionButton onClick={saveAllConfigurations}>
            Save All Configurations
          </ActionButton>
        </div>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <InfoBox>
        <strong>📋 How it works:</strong><br/>
        • Define consumption quantities for each menu item<br/>
        • The system will automatically consume from the correct ingredient type based on order codes<br/>
        • BeanCode1 → Coffee Beans Type 1, BeanCode2 → Coffee Beans Type 2<br/>
        • MilkCode1 → Milk Type 1, MilkCode2 → Milk Type 2<br/>
        • CupCode1/2 → 8oz Cups, CupCode3 → 12oz Cups
      </InfoBox>

      <ContentSection>
        <SectionTitle>Menu Items Consumption Configuration</SectionTitle>
        <ProductGrid>
          {products.map(product => (
            <ProductCard key={product.id}>
              <ProductName>{product.goods_name_en}</ProductName>
              <IngredientList>
                <IngredientItem>
                  <IngredientName>🥛 Milk</IngredientName>
                  <div>
                    <IngredientInput
                      type="number"
                      step="0.1"
                      value={consumptionData[product.id]?.milk || 0}
                      onChange={e => handleConsumptionChange(product.id, 'milk', e.target.value)}
                    />
                    <UnitLabel>ml</UnitLabel>
                  </div>
                </IngredientItem>
                
                <IngredientItem>
                  <IngredientName>☕ Coffee Beans</IngredientName>
                  <div>
                    <IngredientInput
                      type="number"
                      step="0.1"
                      value={consumptionData[product.id]?.coffee_beans || 0}
                      onChange={e => handleConsumptionChange(product.id, 'coffee_beans', e.target.value)}
                    />
                    <UnitLabel>g</UnitLabel>
                  </div>
                </IngredientItem>
                
                <IngredientItem>
                  <IngredientName>🥤 Cups</IngredientName>
                  <div>
                    <IngredientInput
                      type="number"
                      step="1"
                      value={consumptionData[product.id]?.cups || 0}
                      onChange={e => handleConsumptionChange(product.id, 'cups', e.target.value)}
                    />
                    <UnitLabel>cups</UnitLabel>
                  </div>
                </IngredientItem>
                
                <IngredientItem>
                  <IngredientName>💧 Water</IngredientName>
                  <div>
                    <IngredientInput
                      type="number"
                      step="0.1"
                      value={consumptionData[product.id]?.water || 0}
                      onChange={e => handleConsumptionChange(product.id, 'water', e.target.value)}
                    />
                    <UnitLabel>ml</UnitLabel>
                  </div>
                </IngredientItem>
              </IngredientList>
              
              <SaveButton onClick={() => saveConsumptionConfig(product.id)}>
                Save Configuration
              </SaveButton>
            </ProductCard>
          ))}
        </ProductGrid>
      </ContentSection>
    </ConfigContainer>
  );
}

export default ProductConsumptionConfig;
