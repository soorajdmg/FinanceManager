import React, { useState, useEffect } from 'react';
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
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import './settings.css';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
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

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // API base URL
  const API_BASE_URL = 'http://localhost:5000/api';

  // Get user from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const userId = user?.id;

  // Fetch user profile data
  const fetchProfile = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        const errorText = await response.text();
        throw new Error(`Unauthorized: ${errorText}`);
      }

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      const profile = data.data;
      console.log("settings data: ", profile)

      // Update form data with fetched profile
      setFormData(prev => ({
        ...prev,
        firstName: profile.user?.firstName || '',
        lastName: profile.user?.lastName || '',
        email: profile.user?.email || '',
        phone: profile.user?.phone || '',
        profilePicturePreview: profile.user?.profilePicture || null,
        notifications: {
          email: profile.user?.notifications?.email ?? true,
          push: profile.user?.notifications?.push ?? false,
          reports: profile.user?.notifications?.reports ?? true,
          alerts: profile.user?.notifications?.alerts ?? true
        },
        privacy: {
          profileVisibility: profile.user?.privacy?.profileVisibility || 'private',
          dataSharing: profile.user?.privacy?.dataSharing ?? false,
          analytics: profile.user?.privacy?.analytics ?? true
        },
        preferences: {
          language: profile.user?.preferences?.language || 'en',
          timezone: profile.user?.preferences?.timezone || 'UTC-5',
          dateFormat: profile.user?.preferences?.dateFormat || 'MM/DD/YYYY',
          reportFrequency: profile.user?.preferences?.reportFrequency || 'weekly'
        }
      }));

    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile
  const updateProfile = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          profilePicture: formData.profilePicturePreview || null,
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.message || `Failed to update profile (${response.status})`);
      }

      const data = await response.json();
      console.log('Profile updated:', data);
      setSuccess('Profile updated successfully');

      // Update localStorage user data
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {
        ...currentUser,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Change password
  const changePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      setSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Update notifications
  const updateNotifications = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData.notifications)
      });

      if (!response.ok) {
        throw new Error('Failed to update notifications');
      }

      setSuccess('Notification preferences updated successfully');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error updating notifications:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Update privacy settings
  const updatePrivacy = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/privacy`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData.privacy)
      });

      if (!response.ok) {
        throw new Error('Failed to update privacy settings');
      }

      setSuccess('Privacy settings updated successfully');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      console.error('Error updating privacy settings:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch profile on component mount
  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Handle input changes
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

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save based on active section
  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    switch (activeSection) {
      case 'profile':
        await updateProfile();
        break;
      case 'notifications':
        await updateNotifications();
        break;
      case 'privacy':
        await updatePrivacy();
        break;
      case 'preferences':
        // For now, preferences are stored locally
        // You can add a backend endpoint for preferences if needed
        setSuccess('Preferences updated successfully');
        setTimeout(() => setSuccess(null), 3000);
        break;
      default:
        break;
    }
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
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="settings-container">
        <div className="settings-padding">
          <div className="settings-max-width">
            <div className="loading-container">
              <Loader2 className="loading-spinner" />
              <p className="loading-text">Loading settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

                    {/* Form Grid */}
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
                      <div className="form-group email-field">
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

                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="settings-notification-icon">
                            <BarChart3 />
                          </div>
                          <div className="notification-content">
                            <h4>Report Notifications</h4>
                            <p>Get weekly/monthly financial reports</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.reports}
                            onChange={(e) => handleNestedChange('notifications', 'reports', e.target.checked)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>

                      <div className="notification-item">
                        <div className="notification-info">
                          <div className="settings-notification-icon">
                            <AlertCircle />
                          </div>
                          <div className="notification-content">
                            <h4>Alert Notifications</h4>
                            <p>Get alerts for unusual spending patterns</p>
                          </div>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={formData.notifications.alerts}
                            onChange={(e) => handleNestedChange('notifications', 'alerts', e.target.checked)}
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
                      <h3 className="subsection-title">Change Password</h3>
                      <div className="security-options">
                        <div className="form-group">
                          <label className="form-label">Current Password</label>
                          <div className="password-input-wrapper">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="form-input"
                              placeholder="Enter current password"
                              value={passwordData.currentPassword}
                              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
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
                          <label className="form-label">New Password</label>
                          <div className="password-input-wrapper">
                            <input
                              type="password"
                              className="form-input"
                              placeholder="Enter new password"
                              value={passwordData.newPassword}
                              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Confirm New Password</label>
                          <div className="password-input-wrapper">
                            <input
                              type="password"
                              className="form-input"
                              placeholder="Confirm new password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                            />
                          </div>
                        </div>

                        <button
                          className="action-button primary"
                          onClick={changePassword}
                          disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="button-icon spinning" />
                              Changing...
                            </>
                          ) : (
                            <>
                              <Shield className="button-icon" />
                              Change Password
                            </>
                          )}
                        </button>
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
                          <option value="UTC+5:30">India Standard Time (UTC+5:30)</option>
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

              {/* Save Button */}
              <div className="save-section">
                <button
                  className={`save-btn ${isSaving ? 'loading' : ''}`}
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="save-icon spinning" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="save-icon" />
                      Save Changes
                    </>
                  )}
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