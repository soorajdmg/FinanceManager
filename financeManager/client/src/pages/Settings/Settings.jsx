import React, { useState } from 'react';
import {
  User,
  Bell,
  Shield,
  Globe,
  Database,
  Trash2,
  Eye,
  EyeOff,
  Save,
  ChevronRight,
  Mail,
  Phone,
  Calendar,
  Clock,
  Camera,
  Upload,
  X,
  BarChart3,
} from 'lucide-react';
import './settings.css';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Sooraj',
    lastName: 'Murugaraj',
    email: 'soorajmurugaraj@gmail.com',
    phone: '+91 9846249930',
    company: '',
    profilePicture: null,
    profilePicturePreview: null,
    notifications: {
      email: true,
      push: false,
      reports: true,
      alerts: true
    },
    privacy: {
      profileVisibility: 'private',
      dataSharing: false,
      analytics: true
    },
    preferences: {
      language: 'en',
      timezone: 'UTC-5',
      dateFormat: 'MM/DD/YYYY',
      reportFrequency: 'weekly'
    }
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({
          ...prev,
          profilePicture: file,
          profilePicturePreview: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePicture = () => {
    setFormData(prev => ({
      ...prev,
      profilePicture: null,
      profilePicturePreview: null
    }));
  };

  const settingsNavigation = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    // { id: 'account', label: 'Account', icon: Trash2 }
  ];

  return (
    <div className="settings-container">
      <div className="settings-padding">
        <div className="settings-max-width">
          {/* Main Content */}
          <div className="settings-layout">
            {/* Navigation Sidebar */}
            <div className="settings-nav">
              <div className="nav-list">
                {settingsNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
                    >
                      <div className="settings-nav-item-content">
                        <Icon className="settingsNav-icon" />
                        <span className="settingsNav-label">{item.label}</span>
                      </div>
                      <ChevronRight className="nav-arrow" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="settings-content">
              {activeSection === 'profile' && (
                <div className="content-section">
                  <div className="section-header">
                    <h2 className="section-title">Profile Information</h2>
                  </div>

                  <div className="settings-card">
                    {/* Profile Picture Section */}
                    <div className="profile-picture-section">
                      <div className="profile-picture-container">
                        <div className="profile-picture-wrapper">
                          {formData.profilePicturePreview ? (
                            <>
                              <img
                                src={formData.profilePicturePreview}
                                alt="Profile"
                                className="profile-picture"
                              />
                              <button
                                type="button"
                                className="remove-picture-btn"
                                onClick={removeProfilePicture}
                              >
                                <X />
                              </button>
                            </>
                          ) : (
                            <div className="profile-picture-placeholder">
                              <div className="placeholder-icon">
                                <User />
                              </div>
                            </div>
                          )}
                          <div className="profile-picture-overlay">
                            <Camera />
                          </div>
                        </div>
                        <input
                          type="file"
                          id="profile-picture-input"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="profile-picture-input"
                        />
                      </div>
                      <div className="profile-picture-info">
                        <h4 className="profile-picture-title">Profile Picture</h4>
                        <div className="profile-picture-actions">
                          <label htmlFor="profile-picture-input" className="upload-btn">
                            <Upload className="upload-icon" />
                            Upload Photo
                          </label>
                          {formData.profilePicturePreview && (
                            <button
                              type="button"
                              className="remove-btn"
                              onClick={removeProfilePicture}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Existing Form Grid */}
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                          type="text"
                          className="form-input"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label className="form-label">
                          <Mail className="label-icon" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          className="form-input"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          <Phone className="label-icon" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          className="form-input"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div className="content-section">
                  <div className="section-header">
                    <h2 className="section-title">Notification Preferences</h2>
                  </div>

                  <div className="settings-card">
                    <div className="notification-list">
                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="settings-notification-icon">
                            <Mail />
                          </div>
                          <div className="notification-content">
                            <h4>Email Notifications</h4>
                            <p>Receive important updates via email</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.email}
                            onChange={(e) => handleNestedChange('notifications', 'email', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="settings-notification-icon">
                            <Bell />
                          </div>
                          <div className="notification-content">
                            <h4>Push Notifications</h4>
                            <p>Get instant alerts in your browser</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.push}
                            onChange={(e) => handleNestedChange('notifications', 'push', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Section */}
              {activeSection === 'privacy' && (
                <div className="content-section">
                  <div className="section-header">
                    <h2 className="section-title">Privacy & Security</h2>
                  </div>

                  <div className="settings-card">
                    <div className="privacy-section">
                      <h3 className="subsection-title">Account Security</h3>
                      <div className="security-options">
                        <div className="form-group">
                          <label className="form-label">
                            Current Password
                          </label>
                          <div className="password-input-wrapper">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="form-input"
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            New Password
                          </label>
                          <div className="password-input-wrapper">
                            <input
                              type="password"
                              className="form-input"
                              placeholder="Enter new password"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="privacy-section">
                      <h3 className="subsection-title">Privacy Controls</h3>
                      <div className="privacy-controls-grid">
                        <div className="privacy-control-item">
                          <div className="privacy-control-header">
                            <div className="privacy-control-icon">
                              <Database />
                            </div>
                            <div className="privacy-control-info">
                              <h4>Data Sharing</h4>
                              <p>Allow anonymous usage data to improve our services</p>
                            </div>
                          </div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={formData.privacy.dataSharing}
                              onChange={(e) => handleNestedChange('privacy', 'dataSharing', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>

                        <div className="privacy-control-item">
                          <div className="privacy-control-header">
                            <div className="privacy-control-icon">
                              <BarChart3 />
                            </div>
                            <div className="privacy-control-info">
                              <h4>Analytics Tracking</h4>
                              <p>Enable AI analytics for better insights</p>
                            </div>
                          </div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={formData.privacy.analytics}
                              onChange={(e) => handleNestedChange('privacy', 'analytics', e.target.checked)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* <div className="privacy-section">
                      <h3 className="subsection-title">Two-Factor Authentication</h3>
                      <div className="two-factor-section">
                        <div className="two-factor-item">
                          <div className="two-factor-info">
                            <div className="two-factor-icon">
                              <Shield />
                            </div>
                            <div className="two-factor-content">
                              <h4>Authenticator App</h4>
                              <p>Use an authenticator app to generate secure codes</p>
                            </div>
                          </div>
                          <button className="action-button secondary">
                            <Shield className="button-icon" />
                            Setup
                          </button>
                        </div>
                      </div>
                    </div> */}
                  </div>
                </div>
              )}

              {/* Preferences Section */}
              {activeSection === 'preferences' && (
                <div className="content-section">
                  <div className="section-header">
                    <h2 className="section-title">Preferences</h2>
                  </div>

                  <div className="settings-card">
                    <div className="preferences-grid">
                      <div className="preference-group">
                        <label className="form-label">
                          <Globe className="label-icon" />
                          Language
                        </label>
                        <select
                          className="form-select"
                          value={formData.preferences.language}
                          onChange={(e) => handleNestedChange('preferences', 'language', e.target.value)}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>

                      <div className="preference-group">
                        <label className="form-label">
                          <Clock className="label-icon" />
                          Timezone
                        </label>
                        <select
                          className="form-select"
                          value={formData.preferences.timezone}
                          onChange={(e) => handleNestedChange('preferences', 'timezone', e.target.value)}
                        >
                          <option value="UTC-8">Pacific Time (UTC-8)</option>
                          <option value="UTC-5">Eastern Time (UTC-5)</option>
                          <option value="UTC+0">GMT (UTC+0)</option>
                          <option value="UTC+1">Central European (UTC+1)</option>
                        </select>
                      </div>

                      <div className="preference-group">
                        <label className="form-label">
                          <Calendar className="label-icon" />
                          Date Format
                        </label>
                        <select
                          className="form-select"
                          value={formData.preferences.dateFormat}
                          onChange={(e) => handleNestedChange('preferences', 'dateFormat', e.target.value)}
                        >
                          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>

                      <div className="preference-group">
                        <label className="form-label">
                          <BarChart3 className="label-icon" />
                          Report Frequency
                        </label>
                        <select
                          className="form-select"
                          value={formData.preferences.reportFrequency}
                          onChange={(e) => handleNestedChange('preferences', 'reportFrequency', e.target.value)}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="never">Never</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Account Section */}
              {activeSection === 'account' && (
                <div className="content-section">
                  <div className="section-header">
                    <h2 className="section-title">Account Management</h2>
                  </div>

                  <div className="settings-card">
                    <div className="account-actions">
                      <div className="account-section danger-zone">
                        <h3 className="subsection-title danger">Danger Zone</h3>
                        <div className="danger-action">
                          <div className="danger-info">
                            <h4>Delete Account</h4>
                            <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                          </div>
                          <button className="action-button danger">
                            <Trash2 className="button-icon" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="save-section">
                <button
                  className={`save-btn ${isLoading ? 'loading' : ''}`}
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="save-spinner spinning"></div>
                  ) : (
                    <Save className="save-icon" />
                  )}
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;