import React, { useState } from 'react';
import styled from 'styled-components';
import { Plus, Edit, Trash2, Coffee, Eye } from 'lucide-react';
import ItemForm from '../components/Items/ItemForm';
import ItemCard from '../components/Items/ItemCard';
import VariableEditor from '../components/Items/VariableEditor';
import { getApiUrl, API_ENDPOINTS } from '../utils/config';
import { useQuery } from 'react-query';
import { fetchItems } from '../services/api';
import toast from 'react-hot-toast';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 30px;
  
  .left {
    flex: 1;
  }
  
  .title {
    color: white;
    font-size: 2rem;
    font-weight: bold;
    margin: 0 0 5px 0;
  }
  
  .subtitle {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1rem;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.variant === 'primary' ? '#10B981' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid ${props => props.variant === 'primary' ? '#10B981' : 'rgba(255, 255, 255, 0.2)'};
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    background: ${props => props.variant === 'primary' ? '#059669' : 'rgba(255, 255, 255, 0.2)'};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const Tab = styled.button`
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: ${props => props.active ? '600' : '400'};
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const ItemGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatsBar = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  flex: 1;
  
  .stat-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    margin-bottom: 5px;
  }
  
  .stat-value {
    color: white;
    font-size: 1.8rem;
    font-weight: bold;
  }
  
  .stat-change {
    color: #10B981;
    font-size: 0.8rem;
    margin-top: 5px;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
  
  /* Ensure modal can scroll on mobile */
  @media (max-height: 700px) {
    align-items: flex-start;
    padding-top: 20px;
    padding-bottom: 20px;
  }
`;

const ModalContent = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 0;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }
`;

function ItemManagement() {
  const [activeTab, setActiveTab] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showVariableEditor, setShowVariableEditor] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch real products from backend
  const { data: products = [], isLoading, error, refetch } = useQuery(
    'products',
    async () => {
      const response = await fetch(getApiUrl(API_ENDPOINTS.PRODUCTS));
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.msg || 'Failed to fetch products');
      }
      return result.data;
    },
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      onError: (error) => {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      }
    }
  );

  const handleCreateItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleEditVariables = (item) => {
    setSelectedItem(item);
    setShowVariableEditor(true);
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.goodsNameEn}"?`)) {
      try {
        const response = await fetch(getApiUrl(`api/motong/products/${item.id}`), {
          method: 'DELETE',
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.code === 0) {
            toast.success('Item deleted successfully');
            refetch(); // Refresh the products list
          } else {
            toast.error(result.msg || 'Failed to delete item');
          }
        } else {
          toast.error('Failed to delete item');
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Error deleting item');
      }
    }
  };

  const filteredItems = products.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'coffee') return item.type === 2;
    if (activeTab === 'tea') return item.type === 1;
    if (activeTab === 'icecream') return item.type === 3;
    if (activeTab === 'other') return item.type === 4;
    return true;
  });

  return (
    <Container>
      <PageHeader>
        <div className="left">
          <h1 className="title">Item Management</h1>
          <p className="subtitle">Manage coffee machine products and their production variables</p>
        </div>
        <ActionButton variant="primary" onClick={handleCreateItem}>
          <Plus />
          Add New Item
        </ActionButton>
      </PageHeader>

      <StatsBar>
        <StatCard>
          <div className="stat-label">Total Items</div>
          <div className="stat-value">{isLoading ? '...' : products.length}</div>
          <div className="stat-change">Live data</div>
        </StatCard>
        <StatCard>
          <div className="stat-label">Coffee Products</div>
          <div className="stat-value">{isLoading ? '...' : products.filter(i => i.type === 2).length}</div>
          <div className="stat-change">Most popular</div>
        </StatCard>
        <StatCard>
          <div className="stat-label">Tea Products</div>
          <div className="stat-value">{isLoading ? '...' : products.filter(i => i.type === 1).length}</div>
          <div className="stat-change">Traditional</div>
        </StatCard>
        <StatCard>
          <div className="stat-label">Other Products</div>
          <div className="stat-value">{isLoading ? '...' : products.filter(i => i.type >= 3).length}</div>
          <div className="stat-change">Specialty items</div>
        </StatCard>
      </StatsBar>

      <TabContainer>
        <Tab active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
          All Items ({isLoading ? '...' : products.length})
        </Tab>
        <Tab active={activeTab === 'coffee'} onClick={() => setActiveTab('coffee')}>
          Coffee ({isLoading ? '...' : products.filter(i => i.type === 2).length})
        </Tab>
        <Tab active={activeTab === 'tea'} onClick={() => setActiveTab('tea')}>
          Tea ({isLoading ? '...' : products.filter(i => i.type === 1).length})
        </Tab>
        <Tab active={activeTab === 'icecream'} onClick={() => setActiveTab('icecream')}>
          Ice Cream ({isLoading ? '...' : products.filter(i => i.type === 3).length})
        </Tab>
        <Tab active={activeTab === 'other'} onClick={() => setActiveTab('other')}>
          Other ({isLoading ? '...' : products.filter(i => i.type === 4).length})
        </Tab>
      </TabContainer>

      <ItemGrid>
        {isLoading ? (
          // Loading state
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.1rem'
            }}>
              Loading...
            </div>
          ))
        ) : error ? (
          // Error state
          <div style={{
            gridColumn: '1 / -1',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: 'white'
          }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Failed to load products</p>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px' }}>{error.message}</p>
            <button
              onClick={() => refetch()}
              style={{
                background: '#10B981',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          // Empty state
          <div style={{
            gridColumn: '1 / -1',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: 'white'
          }}>
            <Coffee size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No products found</p>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {activeTab === 'all' ? 'Get started by adding your first product' : `No ${activeTab} products available`}
            </p>
          </div>
        ) : (
          // Products list
          filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => handleEditItem(item)}
              onEditVariables={() => handleEditVariables(item)}
              onDelete={() => handleDeleteItem(item)}
            />
          ))
        )}
      </ItemGrid>

      {/* Item Form Modal */}
      {showForm && (
        <Modal onClick={() => setShowForm(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ItemForm
              item={editingItem}
              onClose={() => setShowForm(false)}
              onSave={async (itemData) => {
                try {
                  let response;
                  if (editingItem) {
                    // Update existing item
                    response = await fetch(getApiUrl(`api/motong/products/${editingItem.id}`), {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(itemData),
                    });
                  } else {
                    // Create new item
                    response = await fetch(getApiUrl(API_ENDPOINTS.PRODUCTS), {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(itemData),
                    });
                  }
                  
                  if (response.ok) {
                    const result = await response.json();
                    if (result.code === 0) {
                      toast.success(editingItem ? 'Item updated successfully' : 'Item created successfully');
                      setShowForm(false);
                      refetch(); // Refresh the products list
                    } else {
                      toast.error(result.msg || 'Failed to save item');
                    }
                  } else {
                    toast.error('Failed to save item');
                  }
                } catch (error) {
                  console.error('Error saving item:', error);
                  toast.error('Error saving item');
                }
              }}
            />
          </ModalContent>
        </Modal>
      )}

      {/* Variable Editor Modal */}
      {showVariableEditor && selectedItem && (
        <Modal onClick={() => setShowVariableEditor(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <VariableEditor
              item={selectedItem}
              onClose={() => setShowVariableEditor(false)}
              onSave={async (variables) => {
                try {
                  console.log('🔄 Updating product variables:', {
                    productId: selectedItem.id,
                    jsonCodeVal: variables.jsonCodeVal,
                    matterCodes: variables.matterCodes
                  });
                  
                  const requestBody = {
                    ...selectedItem,
                    jsonCodeVal: variables.jsonCodeVal, // Already a JSON string from VariableEditor
                    matterCodes: variables.matterCodes
                  };
                  
                  console.log('📤 Request body:', requestBody);
                  
                  const response = await fetch(getApiUrl(`api/motong/products/${selectedItem.id}`), {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                  });
                  
                  if (response.ok) {
                    const result = await response.json();
                    if (result.code === 0) {
                      toast.success('Production variables updated successfully');
                      setShowVariableEditor(false);
                      refetch(); // Refresh the products list
                    } else {
                      toast.error(result.msg || 'Failed to update variables');
                    }
                  } else {
                    const errorText = await response.text();
                    console.error('❌ Update failed:', response.status, errorText);
                    toast.error(`Failed to update variables: ${response.status}`);
                  }
                } catch (error) {
                  console.error('❌ Error updating variables:', error);
                  toast.error(`Error updating variables: ${error.message}`);
                }
              }}
            />
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default ItemManagement;
