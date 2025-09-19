import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Upload, Plus, Edit2, Trash2, Save, X, Image as ImageIcon } from 'lucide-react';
import { getApiUrl } from '../utils/config';

const Container = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 32px;
  
  h1 {
    color: #1F2937;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 2rem;
  }
`;

const AddButton = styled.button`
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const DesignCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 200px;
  position: relative;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .placeholder {
    color: #9CA3AF;
    text-align: center;
  }
`;

const CardContent = styled.div`
  padding: 16px;
  
  .name {
    font-weight: 600;
    color: #1F2937;
    margin-bottom: 8px;
    font-size: 1.1rem;
  }
  
  .description {
    color: #6B7280;
    font-size: 0.9rem;
    margin-bottom: 16px;
    line-height: 1.4;
  }
  
  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    color: #9CA3AF;
    margin-bottom: 16px;
  }
  
  .actions {
    display: flex;
    gap: 8px;
  }
`;

const ActionButton = styled.button`
  background: ${props => {
    if (props.variant === 'danger') return '#EF4444';
    if (props.variant === 'primary') return '#6366F1';
    return '#F3F4F6';
  }};
  color: ${props => props.variant === 'secondary' ? '#374151' : 'white'};
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  flex: 1;
  justify-content: center;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const Modal = styled.div`
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
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    margin: 0;
    color: #1F2937;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6B7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
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

const FormGroup = styled.div`
  margin-bottom: 20px;
  
  label {
    display: block;
    color: #374151;
    font-weight: 500;
    margin-bottom: 6px;
    font-size: 0.9rem;
  }
  
  input, textarea {
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
  }
  
  textarea {
    resize: vertical;
    min-height: 80px;
  }
`;

const FileUpload = styled.div`
  border: 2px dashed #D1D5DB;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #6366F1;
    background: #F8FAFC;
  }
  
  &.dragover {
    border-color: #6366F1;
    background: #EEF2FF;
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

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #E5E7EB;
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

const Badge = styled.span`
  background: ${props => props.variant === 'default' ? '#10B981' : '#6B7280'};
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
`;

function LatteArtManagement() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDesign, setEditingDesign] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayOrder: 0
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl('/api/motong/latte-art'));
      const result = await response.json();
      
      if (result.code === 0) {
        setDesigns(result.data);
      } else {
        console.error('Failed to fetch latte art designs:', result.msg);
      }
    } catch (error) {
      console.error('Error fetching latte art designs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingDesign(null);
    setFormData({
      name: '',
      description: '',
      displayOrder: designs.length
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleEdit = (design) => {
    setEditingDesign(design);
    setFormData({
      name: design.name,
      description: design.description || '',
      displayOrder: design.displayOrder
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this latte art design?')) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`/api/motong/latte-art/${id}`), {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.code === 0) {
        setDesigns(designs.filter(design => design.id !== id));
      } else {
        alert('Failed to delete design: ' + result.msg);
      }
    } catch (error) {
      console.error('Error deleting design:', error);
      alert('Error deleting design');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a name for the design');
      return;
    }

    if (!editingDesign && !selectedFile) {
      alert('Please select an image file');
      return;
    }

    try {
      setUploading(true);
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('displayOrder', formData.displayOrder);
      formDataToSend.append('isDefault', true);
      
      if (selectedFile) {
        formDataToSend.append('image', selectedFile);
      }

      const url = editingDesign 
        ? getApiUrl(`/api/motong/latte-art/${editingDesign.id}`)
        : getApiUrl('/api/motong/latte-art');
      
      const method = editingDesign ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend
      });

      const result = await response.json();

      if (result.code === 0) {
        setShowModal(false);
        fetchDesigns(); // Refresh the list
      } else {
        alert('Failed to save design: ' + result.msg);
      }
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Error saving design');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container>
      <Header>
        <h1>
          🎨 Latte Art Management
        </h1>
        <AddButton onClick={handleAddNew}>
          <Plus />
          Add New Design
        </AddButton>
      </Header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
          Loading latte art designs...
        </div>
      ) : (
        <Grid>
          {designs.map(design => (
            <DesignCard key={design.id}>
              <ImageContainer>
                {design.imagePath ? (
                  <img 
                    src={getApiUrl(design.imagePath)} 
                    alt={design.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.innerHTML = '<div class="placeholder"><div>🖼️</div><div>Image not found</div></div>';
                    }}
                  />
                ) : (
                  <div className="placeholder">
                    <ImageIcon size={32} />
                    <div>No image</div>
                  </div>
                )}
              </ImageContainer>
              
              <CardContent>
                <div className="name">{design.name}</div>
                {design.description && (
                  <div className="description">{design.description}</div>
                )}
                
                <div className="meta">
                  <span>Order: {design.displayOrder}</span>
                  {design.isDefault && <Badge variant="default">Default</Badge>}
                </div>
                
                <div className="actions">
                  <ActionButton 
                    variant="primary" 
                    onClick={() => handleEdit(design)}
                  >
                    <Edit2 />
                    Edit
                  </ActionButton>
                  <ActionButton 
                    variant="danger" 
                    onClick={() => handleDelete(design.id)}
                  >
                    <Trash2 />
                    Delete
                  </ActionButton>
                </div>
              </CardContent>
            </DesignCard>
          ))}
        </Grid>
      )}

      {designs.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          color: '#6B7280',
          background: 'white',
          borderRadius: '12px',
          border: '2px dashed #D1D5DB'
        }}>
          <ImageIcon size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No latte art designs yet</h3>
          <p style={{ margin: '0 0 24px 0' }}>Create your first latte art design to get started</p>
          <AddButton onClick={handleAddNew}>
            <Plus />
            Add First Design
          </AddButton>
        </div>
      )}

      {showModal && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <h2>{editingDesign ? 'Edit' : 'Add'} Latte Art Design</h2>
              <CloseButton onClick={() => setShowModal(false)}>
                <X />
              </CloseButton>
            </ModalHeader>

            <FormGroup>
              <label>Design Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Heart, Leaf, Rose"
              />
            </FormGroup>

            <FormGroup>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Optional description of the design"
              />
            </FormGroup>

            <FormGroup>
              <label>Display Order</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})}
                min="0"
              />
            </FormGroup>

            <FormGroup>
              <label>Design Image {!editingDesign && '*'}</label>
              <FileUpload onClick={() => document.getElementById('file-input').click()}>
                <Upload className="upload-icon" />
                <div className="upload-text">
                  {selectedFile ? selectedFile.name : 'Click to upload image'}
                </div>
                <div className="upload-subtext">
                  PNG, JPG up to 5MB
                </div>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </FileUpload>
            </FormGroup>

            <ModalFooter>
              <FooterButton onClick={() => setShowModal(false)}>
                Cancel
              </FooterButton>
              <FooterButton 
                variant="primary" 
                onClick={handleSave}
                disabled={uploading}
              >
                <Save />
                {uploading ? 'Saving...' : 'Save Design'}
              </FooterButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
}

export default LatteArtManagement;
