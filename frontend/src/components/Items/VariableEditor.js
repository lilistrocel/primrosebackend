import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Save, AlertTriangle, Coffee, Settings, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Header = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: between;
  align-items: center;
  
  .left {
    flex: 1;
  }
  
  .title {
    color: #1F2937;
    font-size: 1.5rem;
    font-weight: bold;
    margin: 0 0 4px 0;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .subtitle {
    color: #6B7280;
    margin: 0;
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
`;

const Section = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    
    .icon {
      width: 24px;
      height: 24px;
      color: #6366F1;
    }
    
    .title {
      color: #1F2937;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }
    
    .description {
      color: #6B7280;
      font-size: 0.9rem;
      margin: 0;
      margin-left: auto;
    }
  }
`;

const WarningBox = styled.div`
  background: #FEF3C7;
  border: 1px solid #F59E0B;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  
  .icon {
    color: #F59E0B;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .content {
    flex: 1;
    
    .title {
      color: #92400E;
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    
    .description {
      color: #92400E;
      font-size: 0.9rem;
      margin: 0;
    }
  }
`;

const VariableList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const VariableRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  
  .key-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #D1D5DB;
    border-radius: 6px;
    background: white;
    font-weight: 600;
    color: #1F2937;
    
    &:focus {
      outline: none;
      border-color: #6366F1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
  }
  
  .value-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #D1D5DB;
    border-radius: 6px;
    background: white;
    color: #1F2937;
    
    &:focus {
      outline: none;
      border-color: #6366F1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
  }
  
  .description {
    flex: 2;
    color: #6B7280;
    font-size: 0.8rem;
    padding: 0 8px;
  }
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.variant === 'danger') return '#EF4444';
    if (props.variant === 'secondary') return '#6B7280';
    return '#6366F1';
  }};
  border: none;
  color: white;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const AddButton = styled.button`
  background: #F8FAFC;
  border: 2px dashed #CBD5E1;
  color: #64748B;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  
  &:hover {
    background: #F1F5F9;
    border-color: #94A3B8;
    color: #475569;
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const Footer = styled.div`
  padding: 20px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: white;
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
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const MatterCodeInput = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: white;
  color: #1F2937;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #6366F1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
`;

function VariableEditor({ item, onClose, onSave }) {
  const [jsonCodeVal, setJsonCodeVal] = useState([]);
  const [matterCodes, setMatterCodes] = useState('');
  const [deviceGoodsId, setDeviceGoodsId] = useState('');
  const [goodsId, setGoodsId] = useState('');
  const [type, setType] = useState('');
  const [productId, setProductId] = useState('');

  useEffect(() => {
    // Parse existing jsonCodeVal
    try {
      const parsed = JSON.parse(item.jsonCodeVal);
      const variables = [];
      parsed.forEach(obj => {
        Object.entries(obj).forEach(([key, value]) => {
          variables.push({ key, value, id: Math.random() });
        });
      });
      setJsonCodeVal(variables);
    } catch (error) {
      console.error('Error parsing jsonCodeVal:', error);
      setJsonCodeVal([]);
    }

    setMatterCodes(item.matterCodes || '');
    setDeviceGoodsId(item.deviceGoodsId || '');
    setGoodsId(item.goodsId || '');
    setType(item.type || '');
    setProductId(item.id || '');
  }, [item]);

  const addVariable = () => {
    setJsonCodeVal([...jsonCodeVal, { key: '', value: '', id: Math.random() }]);
  };

  const removeVariable = (id) => {
    setJsonCodeVal(jsonCodeVal.filter(v => v.id !== id));
  };

  const updateVariable = (id, field, value) => {
    setJsonCodeVal(jsonCodeVal.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const getVariableDescription = (key) => {
    const descriptions = {
      'classCode': 'Primary product identifier - determines the recipe/program',
      'CupCode': 'Cup size specification (1=Small, 2=Medium, 3=Large)',
      'BeanCode': 'Coffee bean type (1=Espresso, 2=Arabica, 3=Robusta)',
      'headCode': 'Temperature setting (1=Cold, 2=Warm, 3=Hot)',
      'cupCode': 'Cup type (1=Glass, 2=Paper, 3=Ceramic)',
      'sweetCode': 'Sweetness level (0=None, 1=Low, 2=Medium, 3=High)',
      'SugarCode': 'Sugar type (1=White, 2=Brown, 3=Honey)'
    };
    return descriptions[key] || 'Custom production parameter';
  };

  const handleSave = () => {
    // Validate required fields
    const hasClassCode = jsonCodeVal.some(v => v.key === 'classCode' && v.value);
    if (!hasClassCode) {
      toast.error('classCode is required for machine operation');
      return;
    }

    // Convert variables back to JSON format
    const codeObjects = [];
    jsonCodeVal.forEach(variable => {
      if (variable.key && variable.value) {
        codeObjects.push({ [variable.key]: variable.value });
      }
    });

    const newJsonCodeVal = JSON.stringify(codeObjects);

    onSave({
      jsonCodeVal: newJsonCodeVal,
      matterCodes: matterCodes,
      deviceGoodsId: parseInt(deviceGoodsId) || item.deviceGoodsId,
      goodsId: parseInt(goodsId) || item.goodsId,
      type: parseInt(type) || item.type,
      id: parseInt(productId) || item.id
    });
  };

  return (
    <EditorContainer>
      <Header>
        <div className="left">
          <h2 className="title">
            <Settings />
            Production Variables
          </h2>
          <p className="subtitle">Configure {item.goodsNameEn} production parameters</p>
        </div>
        <CloseButton onClick={onClose}>
          <X />
        </CloseButton>
      </Header>

      <Content>
        <WarningBox>
          <AlertTriangle className="icon" />
          <div className="content">
            <div className="title">Critical Settings</div>
            <div className="description">
              These variables directly control machine production. Changes affect how your coffee machine makes this product.
            </div>
          </div>
        </WarningBox>

        <Section>
          <div className="section-header">
            <Coffee className="icon" />
            <div>
              <h3 className="title">Production Instructions (jsonCodeVal)</h3>
            </div>
            <span className="description">Machine control parameters</span>
          </div>

          <VariableList>
            {jsonCodeVal.map((variable) => (
              <VariableRow key={variable.id}>
                <input
                  type="text"
                  className="key-input"
                  placeholder="Parameter name"
                  value={variable.key}
                  onChange={(e) => updateVariable(variable.id, 'key', e.target.value)}
                />
                <input
                  type="text"
                  className="value-input"
                  placeholder="Value"
                  value={variable.value}
                  onChange={(e) => updateVariable(variable.id, 'value', e.target.value)}
                />
                <div className="description">
                  {getVariableDescription(variable.key)}
                </div>
                <ActionButton 
                  variant="danger" 
                  onClick={() => removeVariable(variable.id)}
                >
                  <Trash2 />
                </ActionButton>
              </VariableRow>
            ))}
          </VariableList>

          <AddButton onClick={addVariable}>
            <Plus />
            Add Production Parameter
          </AddButton>
        </Section>

        <Section>
          <div className="section-header">
            <Settings className="icon" />
            <div>
              <h3 className="title">Product Configuration</h3>
            </div>
            <span className="description">Basic product identification and type</span>
          </div>

          <div style={{
            background: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle style={{ color: '#F59E0B', width: '16px', height: '16px' }} />
            <div style={{ fontSize: '0.85rem', color: '#92400E' }}>
              <strong>Warning:</strong> Changing the Product ID is a dangerous operation that can affect database relationships. Use with extreme caution.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '0.9rem' }}>
                Product ID
              </label>
              <input
                type="number"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                placeholder="20"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              />
              <div style={{ marginTop: '4px', color: '#DC2626', fontSize: '0.75rem', fontWeight: '500' }}>
                ⚠️ Primary database ID (use with caution)
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '0.9rem' }}>
                Device Goods ID
              </label>
              <input
                type="number"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                placeholder="26"
                value={deviceGoodsId}
                onChange={(e) => setDeviceGoodsId(e.target.value)}
              />
              <div style={{ marginTop: '4px', color: '#6B7280', fontSize: '0.75rem' }}>
                Machine-specific product ID
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '0.9rem' }}>
                Goods ID
              </label>
              <input
                type="number"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
                placeholder="23"
                value={goodsId}
                onChange={(e) => setGoodsId(e.target.value)}
              />
              <div style={{ marginTop: '4px', color: '#6B7280', fontSize: '0.75rem' }}>
                Universal product identifier
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '500', fontSize: '0.9rem' }}>
                Product Type
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease',
                  backgroundColor: 'white'
                }}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">Select type...</option>
                <option value="1">1 - Tea (奶茶)</option>
                <option value="2">2 - Coffee (咖啡)</option>
                <option value="3">3 - Ice Cream (冰淇淋)</option>
                <option value="4">4 - Other (其他)</option>
              </select>
              <div style={{ marginTop: '4px', color: '#6B7280', fontSize: '0.75rem' }}>
                Product category for machine
              </div>
            </div>
          </div>
        </Section>

        <Section>
          <div className="section-header">
            <Settings className="icon" />
            <div>
              <h3 className="title">Required Ingredients (matterCodes)</h3>
            </div>
            <span className="description">Comma-separated ingredient codes</span>
          </div>

          <MatterCodeInput
            placeholder="CoffeeMatter12,CoffeeMatter11,CoffeeMatter1,CoffeeMatter2,CoffeeMatter5"
            value={matterCodes}
            onChange={(e) => setMatterCodes(e.target.value)}
          />
          
          <div style={{ marginTop: '12px', color: '#6B7280', fontSize: '0.8rem' }}>
            Enter ingredient codes separated by commas. These determine which materials the machine will use.
          </div>
        </Section>
      </Content>

      <Footer>
        <FooterButton onClick={onClose}>
          Cancel
        </FooterButton>
        <FooterButton variant="primary" onClick={handleSave}>
          <Save />
          Save Variables
        </FooterButton>
      </Footer>
    </EditorContainer>
  );
}

export default VariableEditor;
