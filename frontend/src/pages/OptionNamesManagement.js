import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Save, Edit3, Globe, Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { defaultOptionNames, getOptionName, getOptionDescription } from '../utils/optionNames';
import { getApiBaseUrl } from '../utils/config';

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  
  .icon {
    width: 32px;
    height: 32px;
    color: #ff6b35;
  }
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #2d3748;
    margin: 0;
  }
  
  .description {
    font-size: 16px;
    color: #718096;
    margin-top: 8px;
  }
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const OptionCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  .option-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    
    .option-key {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      background: #f7fafc;
      padding: 8px 12px;
      border-radius: 8px;
      font-family: 'Monaco', 'Menlo', monospace;
    }
  }
  
  .language-section {
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .language-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      
      .flag {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        background: ${props => props.language === 'ar' ? 'linear-gradient(to bottom, #1e40af, #3b82f6, #ef4444)' : 'linear-gradient(to bottom, #1e40af, #3b82f6, #ef4444)'};
      }
      
      .language-name {
        font-size: 16px;
        font-weight: 600;
        color: #4a5568;
      }
    }
    
    .input-group {
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #4a5568;
        margin-bottom: 6px;
      }
      
      input {
        width: 100%;
        padding: 12px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.2s ease;
        
        &:focus {
          outline: none;
          border-color: #ff6b35;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
        }
      }
    }
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #ff6b35;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e55a2b;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 107, 53, 0.3);
  }
  
  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const PreviewSection = styled.div`
  background: #f8f9fb;
  border-radius: 12px;
  padding: 20px;
  margin-top: 24px;
  
  .preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    
    .icon {
      width: 20px;
      height: 20px;
      color: #4a5568;
    }
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #2d3748;
      margin: 0;
    }
  }
  
  .preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .preview-item {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    
    .preview-name {
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 4px;
    }
    
    .preview-desc {
      font-size: 12px;
      color: #718096;
    }
  }
`;

function OptionNamesManagement() {
  const { currentLanguage, t } = useLanguage();
  const [optionNames, setOptionNames] = useState(defaultOptionNames);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load option names from backend with cache-busting
  useEffect(() => {
    const loadOptionNames = async () => {
      try {
        setLoading(true);
        const timestamp = Date.now();
        const response = await fetch(`${getApiBaseUrl()}/api/motong/option-names?t=${timestamp}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.code === 0 && data.data) {
            console.log('🔄 OPTION NAMES: Fetched fresh option names:', data.data);
            setOptionNames(data.data);
          }
        } else {
          console.warn('Failed to load option names from backend, using defaults');
        }
      } catch (error) {
        console.error('Error loading option names:', error);
        // Continue with default option names
      } finally {
        setLoading(false);
      }
    };
    
    loadOptionNames();
  }, []);

  // Check if there are unsaved changes
  useEffect(() => {
    const hasUnsavedChanges = JSON.stringify(optionNames) !== JSON.stringify(defaultOptionNames);
    setHasChanges(hasUnsavedChanges);
  }, [optionNames]);

  const updateOptionName = (optionKey, language, field, value) => {
    setOptionNames(prev => ({
      ...prev,
      [optionKey]: {
        ...prev[optionKey],
        [language]: field === 'name' ? value : prev[optionKey][language],
        description: {
          ...prev[optionKey].description,
          [language]: field === 'description' ? value : prev[optionKey].description?.[language]
        }
      }
    }));
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      
      // Save each option name to the backend
      const savePromises = Object.keys(optionNames).map(async (optionKey) => {
        const option = optionNames[optionKey];
        const timestamp = Date.now();
        const response = await fetch(`${getApiBaseUrl()}/api/motong/option-names/${optionKey}?t=${timestamp}`, {
          method: 'PUT',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify({
            name_en: option.en,
            name_ar: option.ar,
            description_en: option.description?.en || '',
            description_ar: option.description?.ar || ''
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to save ${optionKey}: ${response.statusText}`);
        }
        
        return response.json();
      });
      
      await Promise.all(savePromises);
      
      alert('Option names saved successfully!');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving option names:', error);
      alert(`Failed to save option names: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all option names to defaults?')) {
      setOptionNames(defaultOptionNames);
    }
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Languages className="icon" />
          <div>
            <h1>Option Names Management</h1>
            <div className="description">
              Loading option names...
            </div>
          </div>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Languages className="icon" />
        <div>
          <h1>Option Names Management</h1>
          <div className="description">
            Customize the names and descriptions of customization options (Bean Type, Milk Type, etc.) in both English and Arabic.
          </div>
        </div>
      </Header>

      <OptionGrid>
        {Object.keys(optionNames).map(optionKey => (
          <OptionCard key={optionKey}>
            <div className="option-header">
              <div className="option-key">{optionKey}</div>
            </div>
            
            {/* English Section */}
            <div className="language-section" language="en">
              <div className="language-header">
                <div className="flag"></div>
                <div className="language-name">English</div>
              </div>
              
              <div className="input-group">
                <label>Name</label>
                <input
                  type="text"
                  value={optionNames[optionKey].en || ''}
                  onChange={(e) => updateOptionName(optionKey, 'en', 'name', e.target.value)}
                  placeholder="Enter English name"
                />
              </div>
              
              <div className="input-group">
                <label>Description</label>
                <input
                  type="text"
                  value={optionNames[optionKey].description?.en || ''}
                  onChange={(e) => updateOptionName(optionKey, 'en', 'description', e.target.value)}
                  placeholder="Enter English description"
                />
              </div>
            </div>
            
            {/* Arabic Section */}
            <div className="language-section" language="ar">
              <div className="language-header">
                <div className="flag"></div>
                <div className="language-name">Arabic</div>
              </div>
              
              <div className="input-group">
                <label>Name</label>
                <input
                  type="text"
                  value={optionNames[optionKey].ar || ''}
                  onChange={(e) => updateOptionName(optionKey, 'ar', 'name', e.target.value)}
                  placeholder="Enter Arabic name"
                  dir="rtl"
                />
              </div>
              
              <div className="input-group">
                <label>Description</label>
                <input
                  type="text"
                  value={optionNames[optionKey].description?.ar || ''}
                  onChange={(e) => updateOptionName(optionKey, 'ar', 'description', e.target.value)}
                  placeholder="Enter Arabic description"
                  dir="rtl"
                />
              </div>
            </div>
          </OptionCard>
        ))}
      </OptionGrid>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <SaveButton onClick={saveChanges} disabled={!hasChanges || saving}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </SaveButton>
        
        <button
          onClick={resetToDefaults}
          style={{
            padding: '12px 24px',
            background: '#f7fafc',
            color: '#4a5568',
            border: '2px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Reset to Defaults
        </button>
      </div>

      <PreviewSection>
        <div className="preview-header">
          <Globe className="icon" />
          <h3>Live Preview</h3>
        </div>
        
        <div className="preview-grid">
          {Object.keys(optionNames).map(optionKey => (
            <div key={optionKey} className="preview-item">
              <div className="preview-name">
                {getOptionName(optionKey, currentLanguage)}
              </div>
              <div className="preview-desc">
                {getOptionDescription(optionKey, currentLanguage)}
              </div>
            </div>
          ))}
        </div>
      </PreviewSection>
    </Container>
  );
}

export default OptionNamesManagement;
