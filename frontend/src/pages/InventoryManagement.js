import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../services/api';

const ManagementContainer = styled.div`
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

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
`;

const Tab = styled.button`
  flex: 1;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
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

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: white;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px 8px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const TableCell = styled.td`
  padding: 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const StockBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;
`;

const StockFill = styled.div`
  height: 100%;
  background: ${props => {
    if (props.$percentage <= 20) return '#ff4757';
    if (props.$percentage <= 50) return '#ffa502';
    return '#2ed573';
  }};
  width: ${props => Math.min(props.$percentage, 100)}%;
  transition: all 0.3s ease;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 30px;
  width: 90%;
  max-width: 500px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ModalTitle = styled.h3`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 20px 0;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  color: white;
  font-weight: 600;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.3);
  }

  option {
    background: #2c3e50;
    color: white;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 30px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
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

function InventoryManagement() {
  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpItem, setTopUpItem] = useState(null);
  const [topUpQuantity, setTopUpQuantity] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    category: 'cups',
    unit: 'cups',
    current_stock: 0,
    max_stock: 0,
    min_threshold: 0,
    cost_per_unit: 0,
    supplier: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'items') {
        const response = await api.get('/api/motong/inventory/items');
        setItems(response.data.data);
      } else if (activeTab === 'transactions') {
        const response = await api.get('/api/motong/inventory/transactions');
        setTransactions(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    
    if (type === 'edit' && item) {
      setFormData({
        name: item.name,
        display_name: item.display_name,
        category: item.category,
        unit: item.unit,
        current_stock: item.current_stock,
        max_stock: item.max_stock,
        min_threshold: item.min_threshold,
        cost_per_unit: item.cost_per_unit,
        supplier: item.supplier || ''
      });
    } else if (type === 'add') {
      setFormData({
        name: '',
        display_name: '',
        category: 'cups',
        unit: 'cups',
        current_stock: 0,
        max_stock: 0,
        min_threshold: 0,
        cost_per_unit: 0,
        supplier: ''
      });
    }
    
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      name: '',
      display_name: '',
      category: 'cups',
      unit: 'cups',
      current_stock: 0,
      max_stock: 0,
      min_threshold: 0,
      cost_per_unit: 0,
      supplier: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError(null);
      setSuccess(null);
      
      if (modalType === 'add') {
        await api.post('/api/motong/inventory/items', formData);
        setSuccess('Inventory item created successfully');
      } else if (modalType === 'edit') {
        await api.put(`/api/motong/inventory/items/${editingItem.id}`, formData);
        setSuccess('Inventory item updated successfully');
      }
      
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Failed to save inventory item');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }
    
    try {
      await api.delete(`/api/motong/inventory/items/${itemId}`);
      setSuccess('Inventory item deleted successfully');
      fetchData();
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete inventory item');
    }
  };

  const handleTopUp = (item) => {
    setTopUpItem(item);
    setTopUpQuantity('');
    setShowTopUpModal(true);
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    
    if (!topUpQuantity || parseFloat(topUpQuantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      
      // Create top-up transaction
      await api.post('/api/motong/inventory/transactions', {
        item_id: topUpItem.id,
        transaction_type: 'top_up',
        quantity: parseFloat(topUpQuantity),
        notes: `Manual top-up: +${topUpQuantity} ${topUpItem.unit}`
      });
      
      setSuccess(`Successfully added ${topUpQuantity} ${topUpItem.unit} to ${topUpItem.display_name}`);
      setShowTopUpModal(false);
      setTopUpItem(null);
      setTopUpQuantity('');
      fetchData();
    } catch (err) {
      console.error('Error adding stock:', err);
      setError('Failed to add stock');
    }
  };

  const handleCloseTopUpModal = () => {
    setShowTopUpModal(false);
    setTopUpItem(null);
    setTopUpQuantity('');
  };

  const handleFillToMax = async (item) => {
    if (!window.confirm(`Fill ${item.display_name} to maximum capacity (${item.max_stock} ${item.unit})?`)) {
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      
      const quantityToAdd = item.max_stock - item.current_stock;
      
      if (quantityToAdd <= 0) {
        setError(`${item.display_name} is already at maximum capacity`);
        return;
      }
      
      // Create fill-to-max transaction
      await api.post('/api/motong/inventory/transactions', {
        item_id: item.id,
        transaction_type: 'top_up',
        quantity: quantityToAdd,
        notes: `Fill to max: +${quantityToAdd} ${item.unit} (filled to ${item.max_stock} ${item.unit})`
      });
      
      setSuccess(`Successfully filled ${item.display_name} to maximum capacity (${item.max_stock} ${item.unit})`);
      fetchData();
    } catch (err) {
      console.error('Error filling to max:', err);
      setError('Failed to fill to maximum capacity');
    }
  };

  const handleFillAllToMax = async () => {
    if (!window.confirm('Fill ALL inventory items to their maximum capacity? This will top up all items that are below their max stock.')) {
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      
      const itemsToFill = items.filter(item => item.current_stock < item.max_stock);
      
      if (itemsToFill.length === 0) {
        setError('All items are already at maximum capacity');
        return;
      }
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const item of itemsToFill) {
        try {
          const quantityToAdd = item.max_stock - item.current_stock;
          
          await api.post('/api/motong/inventory/transactions', {
            item_id: item.id,
            transaction_type: 'top_up',
            quantity: quantityToAdd,
            notes: `Bulk fill to max: +${quantityToAdd} ${item.unit} (filled to ${item.max_stock} ${item.unit})`
          });
          
          successCount++;
        } catch (err) {
          console.error(`Error filling ${item.display_name}:`, err);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        setSuccess(`Successfully filled ${successCount} items to maximum capacity${errorCount > 0 ? ` (${errorCount} errors)` : ''}`);
        fetchData();
      } else {
        setError('Failed to fill any items to maximum capacity');
      }
    } catch (err) {
      console.error('Error in bulk fill to max:', err);
      setError('Failed to perform bulk fill operation');
    }
  };

  const getStockPercentage = (current, max) => {
    if (max === 0) return 0;
    return Math.round((current / max) * 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <ManagementContainer>
        <LoadingSpinner>Loading inventory data...</LoadingSpinner>
      </ManagementContainer>
    );
  }

  return (
    <ManagementContainer>
      <Header>
        <Title>Inventory Management</Title>
        <div>
          <ActionButton 
            className="secondary" 
            onClick={() => window.location.href = '/inventory/dashboard'}
          >
            Dashboard
          </ActionButton>
          <ActionButton 
            onClick={handleFillAllToMax}
            style={{
              background: 'linear-gradient(135deg, #2ed573 0%, #20bf6b 100%)',
              boxShadow: '0 4px 15px rgba(46, 213, 115, 0.4)',
              marginRight: '10px'
            }}
          >
            Fill All to Max
          </ActionButton>
          <ActionButton onClick={() => handleOpenModal('add')}>
            Add Item
          </ActionButton>
        </div>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>{success}</SuccessMessage>}

      <TabsContainer>
        <Tab 
          $active={activeTab === 'items'} 
          onClick={() => setActiveTab('items')}
        >
          Inventory Items
        </Tab>
        <Tab 
          $active={activeTab === 'transactions'} 
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </Tab>
      </TabsContainer>

      {activeTab === 'items' && (
        <ContentSection>
          <SectionTitle>Inventory Items</SectionTitle>
          <Table>
            <thead>
              <tr>
                <TableHeader>Name</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Current Stock</TableHeader>
                <TableHeader>Max Stock</TableHeader>
                <TableHeader>Min Threshold</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Actions</TableHeader>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <TableCell>{item.display_name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.current_stock} {item.unit}</TableCell>
                  <TableCell>{item.max_stock} {item.unit}</TableCell>
                  <TableCell>{item.min_threshold} {item.unit}</TableCell>
                  <TableCell>
                    <StockBar>
                      <StockFill 
                        $percentage={getStockPercentage(item.current_stock, item.max_stock)}
                      />
                    </StockBar>
                    <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.8 }}>
                      {getStockPercentage(item.current_stock, item.max_stock)}%
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      className="primary" 
                      onClick={() => handleTopUp(item)}
                      style={{ marginRight: '8px', padding: '6px 12px', fontSize: '0.9rem' }}
                    >
                      Top Up
                    </Button>
                    <Button 
                      className="primary" 
                      onClick={() => handleFillToMax(item)}
                      style={{ 
                        marginRight: '8px', 
                        padding: '6px 12px', 
                        fontSize: '0.9rem',
                        background: 'linear-gradient(135deg, #2ed573 0%, #20bf6b 100%)',
                        boxShadow: '0 4px 15px rgba(46, 213, 115, 0.4)'
                      }}
                    >
                      Fill to Max
                    </Button>
                    <Button 
                      className="secondary" 
                      onClick={() => handleOpenModal('edit', item)}
                      style={{ marginRight: '8px', padding: '6px 12px', fontSize: '0.9rem' }}
                    >
                      Edit
                    </Button>
                    <Button 
                      className="secondary" 
                      onClick={() => handleDelete(item.id)}
                      style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </ContentSection>
      )}

      {activeTab === 'transactions' && (
        <ContentSection>
          <SectionTitle>Recent Transactions</SectionTitle>
          <Table>
            <thead>
              <tr>
                <TableHeader>Item</TableHeader>
                <TableHeader>Type</TableHeader>
                <TableHeader>Quantity</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Notes</TableHeader>
              </tr>
            </thead>
            <tbody>
              {transactions.map(transaction => (
                <tr key={transaction.id}>
                  <TableCell>{transaction.item_name}</TableCell>
                  <TableCell>
                    <span style={{
                      background: transaction.transaction_type === 'top_up' ? 'rgba(46, 213, 115, 0.2)' : 
                                 transaction.transaction_type === 'order_consumption' ? 'rgba(255, 71, 87, 0.2)' : 
                                 'rgba(255, 165, 2, 0.2)',
                      color: transaction.transaction_type === 'top_up' ? '#2ed573' : 
                             transaction.transaction_type === 'order_consumption' ? '#ff4757' : '#ffa502',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}>
                      {transaction.transaction_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.quantity} {transaction.unit}</TableCell>
                  <TableCell>{formatDate(transaction.created_at)}</TableCell>
                  <TableCell>{transaction.notes || '-'}</TableCell>
                </tr>
              ))}
            </tbody>
          </Table>
        </ContentSection>
      )}

      {showModal && (
        <Modal onClick={handleCloseModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>
              {modalType === 'add' ? 'Add New Inventory Item' : 'Edit Inventory Item'}
            </ModalTitle>
            
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Name (unique identifier)</Label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., milk_1"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Display Name</Label>
                <Input
                  type="text"
                  value={formData.display_name}
                  onChange={e => setFormData({...formData, display_name: e.target.value})}
                  placeholder="e.g., Milk Type 1"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="cups">Cups</option>
                  <option value="milk">Milk</option>
                  <option value="coffee_beans">Coffee Beans</option>
                  <option value="water">Water</option>
                </Select>
              </FormGroup>

              <FormGroup>
                <Label>Unit</Label>
                <Input
                  type="text"
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                  placeholder="e.g., ml, cups, grams"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Current Stock</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.current_stock}
                  onChange={e => setFormData({...formData, current_stock: parseFloat(e.target.value) || 0})}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Max Stock</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.max_stock}
                  onChange={e => setFormData({...formData, max_stock: parseFloat(e.target.value) || 0})}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Min Threshold</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.min_threshold}
                  onChange={e => setFormData({...formData, min_threshold: parseFloat(e.target.value) || 0})}
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label>Cost Per Unit</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.cost_per_unit}
                  onChange={e => setFormData({...formData, cost_per_unit: parseFloat(e.target.value) || 0})}
                />
              </FormGroup>

              <FormGroup>
                <Label>Supplier (optional)</Label>
                <Input
                  type="text"
                  value={formData.supplier}
                  onChange={e => setFormData({...formData, supplier: e.target.value})}
                  placeholder="Supplier name"
                />
              </FormGroup>

              <ButtonGroup>
                <Button type="button" className="secondary" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit" className="primary">
                  {modalType === 'add' ? 'Create Item' : 'Update Item'}
                </Button>
              </ButtonGroup>
            </form>
          </ModalContent>
        </Modal>
      )}

      {showTopUpModal && (
        <Modal onClick={handleCloseTopUpModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>Top Up Stock</ModalTitle>
            
            <form onSubmit={handleTopUpSubmit}>
              <FormGroup>
                <Label>Item</Label>
                <Input
                  type="text"
                  value={topUpItem?.display_name || ''}
                  disabled
                  style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)' }}
                />
              </FormGroup>

              <FormGroup>
                <Label>Current Stock</Label>
                <Input
                  type="text"
                  value={`${topUpItem?.current_stock || 0} ${topUpItem?.unit || ''}`}
                  disabled
                  style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)' }}
                />
              </FormGroup>

              <FormGroup>
                <Label>Quantity to Add</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={topUpQuantity}
                  onChange={e => setTopUpQuantity(e.target.value)}
                  placeholder={`Enter amount in ${topUpItem?.unit || 'units'}`}
                  required
                  autoFocus
                />
              </FormGroup>

              <FormGroup>
                <Label>Notes (optional)</Label>
                <Input
                  type="text"
                  placeholder="e.g., Weekly restock, Emergency refill"
                />
              </FormGroup>

              <ButtonGroup>
                <Button type="button" className="secondary" onClick={handleCloseTopUpModal}>
                  Cancel
                </Button>
                <Button type="submit" className="primary">
                  Add Stock
                </Button>
              </ButtonGroup>
            </form>
          </ModalContent>
        </Modal>
      )}
    </ManagementContainer>
  );
}

export default InventoryManagement;
