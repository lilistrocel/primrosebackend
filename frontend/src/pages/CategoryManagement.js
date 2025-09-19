import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { getApiUrl } from '../utils/config';

const Container = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 30px;
  
  h1 {
    margin: 0;
    color: #1f2937;
    font-size: 28px;
    font-weight: 700;
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const CategoryCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .category-header {
    display: flex;
    justify-content: between;
    align-items: center;
    margin-bottom: 15px;
    
    .category-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .icon {
        font-size: 24px;
        background: #f3f4f6;
        padding: 8px;
        border-radius: 8px;
      }
      
      .name {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
      }
    }
    
    .actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .category-details {
    color: #6b7280;
    font-size: 14px;
    line-height: 1.5;
    
    .detail-row {
      display: flex;
      justify-content: between;
      margin-bottom: 5px;
    }
  }
`;

const ActionButton = styled.button`
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.edit {
    background: #dbeafe;
    color: #3b82f6;
    
    &:hover {
      background: #bfdbfe;
    }
  }
  
  &.delete {
    background: #fee2e2;
    color: #ef4444;
    
    &:hover {
      background: #fecaca;
    }
  }
  
  &.save {
    background: #dcfce7;
    color: #22c55e;
    
    &:hover {
      background: #bbf7d0;
    }
  }
  
  &.cancel {
    background: #f3f4f6;
    color: #6b7280;
    
    &:hover {
      background: #e5e7eb;
    }
  }
`;

const EditForm = styled.div`
  .form-group {
    margin-bottom: 15px;
    
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #374151;
    }
    
    input, select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      
      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
  }
  
  .form-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
`;

const iconOptions = ['☕', '🎨', '⭐', '🧊', '🍂', '🔥', '❄️', '🌟', '💎', '🎯'];

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(getApiUrl('/api/motong/categories'));
      const result = await response.json();
      
      if (result.code === 0) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const startEditing = (category) => {
    setEditingId(category.id);
    setEditForm({ ...category });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveCategory = async () => {
    try {
      const url = editingId 
        ? getApiUrl(`/api/motong/categories/${editingId}`)
        : getApiUrl('/api/motong/categories');
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      const result = await response.json();
      
      if (result.code === 0) {
        fetchCategories(); // Refresh list
        setEditingId(null);
        setEditForm({});
        setIsCreating(false);
      } else {
        alert('Error saving category: ' + result.msg);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category? Products using this category will be moved to "Classics".')) {
      return;
    }
    
    try {
      const response = await fetch(getApiUrl(`/api/motong/categories/${id}`), {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.code === 0) {
        fetchCategories(); // Refresh list
      } else {
        alert('Error deleting category: ' + result.msg);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setEditForm({
      name: '',
      icon: '☕',
      display_order: categories.length,
      is_active: true
    });
  };

  if (loading) {
    return <Container><div>Loading categories...</div></Container>;
  }

  return (
    <Container>
      <Header>
        <h1>Category Management</h1>
        <AddButton onClick={startCreating}>
          <Plus size={20} />
          Add Category
        </AddButton>
      </Header>

      <CategoryGrid>
        {/* Create new category form */}
        {isCreating && (
          <CategoryCard>
            <EditForm>
              <div className="form-group">
                <label>Category Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              
              <div className="form-group">
                <label>Icon</label>
                <select
                  value={editForm.icon || '☕'}
                  onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>{icon} {icon}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  value={editForm.display_order || 0}
                  onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="form-actions">
                <ActionButton className="save" onClick={saveCategory}>
                  <Save size={16} />
                </ActionButton>
                <ActionButton className="cancel" onClick={() => setIsCreating(false)}>
                  <X size={16} />
                </ActionButton>
              </div>
            </EditForm>
          </CategoryCard>
        )}

        {/* Existing categories */}
        {categories.map(category => (
          <CategoryCard key={category.id}>
            {editingId === category.id ? (
              <EditForm>
                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label>Icon</label>
                  <select
                    value={editForm.icon || '☕'}
                    onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                  >
                    {iconOptions.map(icon => (
                      <option key={icon} value={icon}>{icon} {icon}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={editForm.display_order || 0}
                    onChange={(e) => setEditForm({ ...editForm, display_order: parseInt(e.target.value) })}
                  />
                </div>
                
                <div className="form-actions">
                  <ActionButton className="save" onClick={saveCategory}>
                    <Save size={16} />
                  </ActionButton>
                  <ActionButton className="cancel" onClick={cancelEditing}>
                    <X size={16} />
                  </ActionButton>
                </div>
              </EditForm>
            ) : (
              <>
                <div className="category-header">
                  <div className="category-info">
                    <div className="icon">{category.icon}</div>
                    <div className="name">{category.name}</div>
                  </div>
                  <div className="actions">
                    <ActionButton className="edit" onClick={() => startEditing(category)}>
                      <Edit2 size={16} />
                    </ActionButton>
                    <ActionButton className="delete" onClick={() => deleteCategory(category.id)}>
                      <Trash2 size={16} />
                    </ActionButton>
                  </div>
                </div>
                
                <div className="category-details">
                  <div className="detail-row">
                    <span>Display Order:</span>
                    <span>{category.display_order}</span>
                  </div>
                  <div className="detail-row">
                    <span>Status:</span>
                    <span>{category.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Created:</span>
                    <span>{new Date(category.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </>
            )}
          </CategoryCard>
        ))}
      </CategoryGrid>
    </Container>
  );
}

export default CategoryManagement;
