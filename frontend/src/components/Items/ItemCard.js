import React from 'react';
import styled from 'styled-components';
import { Edit, Settings, Trash2, Coffee, Eye, DollarSign } from 'lucide-react';
import { formatIngredientList } from '../../services/ingredients';

const Card = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
`;

const ItemImage = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
`;

const TypeBadge = styled.span`
  background: ${props => {
    switch (props.type) {
      case 1: return '#F59E0B'; // Tea
      case 2: return '#8B5CF6'; // Coffee  
      case 3: return '#06B6D4'; // Ice Cream
      case 4: return '#10B981'; // Other
      default: return '#6B7280';
    }
  }};
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const ItemInfo = styled.div`
  margin-bottom: 15px;
  
  .name {
    color: white;
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .name-en {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.9rem;
    margin-bottom: 2px;
  }
  
  .name-other {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
  }
`;

const ProductionInfo = styled.div`
  margin-bottom: 15px;
  
  .section-title {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.8rem;
    font-weight: 600;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const CodeDisplay = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
  
  .code-item {
    display: flex;
    justify-content: space-between;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 4px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .key {
      color: #10B981;
      font-weight: 600;
    }
    
    .value {
      color: #F59E0B;
      font-weight: 500;
    }
  }
`;

const MatterCodes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  
  .matter-code {
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10B981;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 500;
  }
`;

const PriceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  
  .price {
    color: white;
    font-size: 1.3rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .currency {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }
  
  &.primary {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.3);
    color: #10B981;
    
    &:hover {
      background: rgba(16, 185, 129, 0.3);
    }
  }
  
  &.warning {
    background: rgba(245, 158, 11, 0.2);
    border-color: rgba(245, 158, 11, 0.3);
    color: #F59E0B;
    
    &:hover {
      background: rgba(245, 158, 11, 0.3);
    }
  }
  
  &.danger {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
    color: #EF4444;
    
    &:hover {
      background: rgba(239, 68, 68, 0.3);
    }
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

function ItemCard({ item, onEdit, onEditVariables, onDelete }) {
  const getTypeName = (type) => {
    switch (type) {
      case 1: return 'Tea';
      case 2: return 'Coffee';
      case 3: return 'Ice Cream';
      case 4: return 'Other';
      default: return 'Unknown';
    }
  };

  const parseJsonCodeVal = (jsonCodeVal) => {
    try {
      const parsed = JSON.parse(jsonCodeVal);
      const result = {};
      parsed.forEach(item => {
        Object.keys(item).forEach(key => {
          result[key] = item[key];
        });
      });
      return result;
    } catch (error) {
      return {};
    }
  };

  const productionCodes = parseJsonCodeVal(item.jsonCodeVal);
  const ingredients = formatIngredientList(item.matterCodes);

  return (
    <Card>
      <CardHeader>
        <ItemImage>
          <Coffee />
        </ItemImage>
        <TypeBadge type={item.type}>
          {getTypeName(item.type)}
        </TypeBadge>
      </CardHeader>

      <ItemInfo>
        <div className="name">{item.goodsName}</div>
        <div className="name-en">{item.goodsNameEn}</div>
        <div className="name-other">{item.goodsNameOt}</div>
      </ItemInfo>

      <PriceInfo>
        <div className="price">
          <DollarSign size={16} />
          {item.price}
        </div>
        <span className="currency">USD</span>
      </PriceInfo>

      <ProductionInfo>
        <div className="section-title">Production Variables</div>
        <CodeDisplay>
          {Object.entries(productionCodes).map(([key, value]) => (
            <div key={key} className="code-item">
              <span className="key">{key}:</span>
              <span className="value">{value}</span>
            </div>
          ))}
        </CodeDisplay>
      </ProductionInfo>

      <ProductionInfo>
        <div className="section-title">Required Ingredients</div>
        <MatterCodes>
          {ingredients.slice(0, 3).map((ingredient, index) => (
            <span key={index} className="matter-code" title={ingredient.fullName}>
              {ingredient.name}
            </span>
          ))}
          {ingredients.length > 3 && (
            <span className="matter-code">+{ingredients.length - 3} more</span>
          )}
        </MatterCodes>
      </ProductionInfo>

      <Actions>
        <ActionButton className="primary" onClick={onEdit}>
          <Edit />
        </ActionButton>
        <ActionButton className="warning" onClick={onEditVariables}>
          <Settings />
        </ActionButton>
        <ActionButton className="danger" onClick={onDelete}>
          <Trash2 />
        </ActionButton>
      </Actions>
    </Card>
  );
}

export default ItemCard;
