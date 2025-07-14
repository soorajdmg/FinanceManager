import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit3,
  Camera,
  Calendar,
  CreditCard,
  TrendingUp,
  FileText,
  Settings,
  Bell,
  Shield,
  Download
} from 'lucide-react';
import './profile.css';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    joinDate: 'January 2023',
    membershipType: 'Premium',
    profileImage: null
  });

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          profileImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const stats = [
    { icon: CreditCard, label: 'Total Transactions', value: '1,247', color: '#3b82f6' },
    { icon: TrendingUp, label: 'Avg Monthly Spend', value: '$3,456', color: '#10b981' },
    { icon: FileText, label: 'Reports Generated', value: '23', color: '#f59e0b' },
    { icon: Calendar, label: 'Member Since', value: '18 Months', color: '#8b5cf6' }
  ];

  const quickActions = [
    { icon: FileText, label: 'Generate Report', description: 'Create new analysis report' },
    { icon: Download, label: 'Export Data', description: 'Download transaction history' },
    { icon: Settings, label: 'Account Settings', description: 'Manage preferences' },
    { icon: Bell, label: 'Notifications', description: 'Configure alerts' },
    { icon: Shield, label: 'Security', description: 'Update security settings' },
    { icon: CreditCard, label: 'Payment Methods', description: 'Manage cards & accounts' }
  ];

  return (
    <div className="profile-container">
      <div className="profile-padding">
        <div className="profile-max-width">

          {/* Main Profile Card */}
          <div className="profile-card">

            {/* Profile Info Section */}
            <div className="profile-info-section">
              <div className="profile-avatar-section">
                <div className="avatar-container">
                  {profileData.profileImage ? (
                    <img
                      src={profileData.profileImage}
                      alt="Profile"
                      className="profile-avatar"
                    />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      <User className="prAvatar-icon" />
                    </div>
                  )}
                  <button className="avatar-edit-btn" onClick={() => document.getElementById('avatar-upload').click()}>
                    <Camera className="camera-icon" />
                  </button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="profile-basic-info">
                  <h2 className="profile-name">{profileData.name}</h2>
                  <p className="profile-membership">{profileData.membershipType} Member</p>
                </div>
              </div>

              <button
                className="edit-profile-btn"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="edit-icon" />
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </button>
            </div>

            {/* Contact Details */}
            <div className="contact-details">
              <div className="detail-item">
                <div className="detail-icon-container">
                  <Mail className="detail-icon" />
                </div>
                <div className="detail-content">
                  <label className="detail-label">Email Address</label>
                  <p className="detail-value">{profileData.email}</p>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-container">
                  <Phone className="detail-icon" />
                </div>
                <div className="detail-content">
                  <label className="detail-label">Phone Number</label>
                  <p className="detail-value">{profileData.phone}</p>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-container">
                  <MapPin className="detail-icon" />
                </div>
                <div className="detail-content">
                  <label className="detail-label">Location</label>
                  <p className="detail-value">{profileData.location}</p>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-icon-container">
                  <Calendar className="detail-icon" />
                </div>
                <div className="detail-content">
                  <label className="detail-label">Member Since</label>
                  <p className="detail-value">{profileData.joinDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="stats-section">
            <h3 className="section-title">Account Overview</h3>
            <div className="stats-grid-profile">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card-profile" style={{ '--delay': `${index * 0.1}s` }}>
                  <div className="stat-icon-container">
                    <stat.icon className="stat-icon" />
                  </div>
                  <div className="stat-content">
                    <p className="stat-value">{stat.value}</p>
                    <p className="stat-label">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;