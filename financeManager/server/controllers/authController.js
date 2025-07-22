const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Register new user
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      theme = 'light',
      language = 'en',
      timezone = 'UTC-5',
      dateFormat = 'MM/DD/YYYY'
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
      preferences: {
        language,
        timezone,
        dateFormat,
        theme
      }
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
          profilePicture: newUser.profilePicture,
          notifications: newUser.notifications,
          privacy: newUser.privacy,
          preferences: newUser.preferences,
          status: newUser.status,
          createdAt: newUser.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email, status: 'active' });
    console.log('Found user:', user ? 'Yes' : 'No'); // Add this line
    console.log('User status:', email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.security.lockUntil && user.security.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment login attempts
      const updates = {
        'security.loginAttempts': user.security.loginAttempts + 1
      };

      // Lock account after 5 failed attempts for 30 minutes
      if (user.security.loginAttempts >= 4) {
        updates['security.lockUntil'] = new Date(Date.now() + 30 * 60 * 1000);
      }

      await User.findByIdAndUpdate(user._id, updates);

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts and update last login
    await User.findByIdAndUpdate(user._id, {
      'security.loginAttempts': 0,
      'security.lockUntil': null,
      lastLogin: new Date()
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture,
          notifications: user.notifications,
          privacy: user.privacy,
          preferences: user.preferences,
          status: user.status,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Since we're using JWT tokens, we don't need to do anything server-side
    // The client should remove the token from their storage
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash -security.twoFactorSecret');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture,
          notifications: user.notifications,
          privacy: user.privacy,
          preferences: user.preferences,
          security: {
            twoFactorEnabled: user.security.twoFactorEnabled,
            lastPasswordChange: user.security.lastPasswordChange
          },
          status: user.status,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      profilePicture,
      notifications,
      privacy,
      preferences
    } = req.body;
    const userId = req.userId;

    const updateData = {};

    // Basic profile fields
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    // Notification preferences
    if (notifications) {
      if (notifications.email !== undefined) updateData['notifications.email'] = notifications.email;
      if (notifications.push !== undefined) updateData['notifications.push'] = notifications.push;
      if (notifications.reports !== undefined) updateData['notifications.reports'] = notifications.reports;
      if (notifications.alerts !== undefined) updateData['notifications.alerts'] = notifications.alerts;
    }

    // Privacy settings
    if (privacy) {
      if (privacy.profileVisibility) updateData['privacy.profileVisibility'] = privacy.profileVisibility;
      if (privacy.dataSharing !== undefined) updateData['privacy.dataSharing'] = privacy.dataSharing;
      if (privacy.analytics !== undefined) updateData['privacy.analytics'] = privacy.analytics;
    }

    // User preferences
    if (preferences) {
      if (preferences.language) updateData['preferences.language'] = preferences.language;
      if (preferences.timezone) updateData['preferences.timezone'] = preferences.timezone;
      if (preferences.dateFormat) updateData['preferences.dateFormat'] = preferences.dateFormat;
      if (preferences.reportFrequency) updateData['preferences.reportFrequency'] = preferences.reportFrequency;
      if (preferences.theme) updateData['preferences.theme'] = preferences.theme;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-passwordHash -security.twoFactorSecret');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture,
          notifications: user.notifications,
          privacy: user.privacy,
          preferences: user.preferences,
          security: {
            twoFactorEnabled: user.security.twoFactorEnabled,
            lastPasswordChange: user.security.lastPasswordChange
          },
          status: user.status,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password and last password change timestamp
    await User.findByIdAndUpdate(userId, {
      passwordHash: newPasswordHash,
      'security.lastPasswordChange': new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update notification preferences
const updateNotifications = async (req, res) => {
  try {
    const { email, push, reports, alerts } = req.body;
    const userId = req.userId;

    const updateData = {};
    if (email !== undefined) updateData['notifications.email'] = email;
    if (push !== undefined) updateData['notifications.push'] = push;
    if (reports !== undefined) updateData['notifications.reports'] = reports;
    if (alerts !== undefined) updateData['notifications.alerts'] = alerts;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('notifications');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        notifications: user.notifications
      }
    });

  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update privacy settings
const updatePrivacy = async (req, res) => {
  try {
    const { profileVisibility, dataSharing, analytics } = req.body;
    const userId = req.userId;

    const updateData = {};
    if (profileVisibility) updateData['privacy.profileVisibility'] = profileVisibility;
    if (dataSharing !== undefined) updateData['privacy.dataSharing'] = dataSharing;
    if (analytics !== undefined) updateData['privacy.analytics'] = analytics;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('privacy');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: {
        privacy: user.privacy
      }
    });

  } catch (error) {
    console.error('Update privacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update user preferences
const updatePreferences = async (req, res) => {
  try {
    const { language, timezone, dateFormat, reportFrequency, theme } = req.body;
    const userId = req.userId;

    const updateData = {};
    if (language) updateData['preferences.language'] = language;
    if (timezone) updateData['preferences.timezone'] = timezone;
    if (dateFormat) updateData['preferences.dateFormat'] = dateFormat;
    if (reportFrequency) updateData['preferences.reportFrequency'] = reportFrequency;
    if (theme) updateData['preferences.theme'] = theme;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('preferences');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Google OAuth login
const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture } = payload;

    // Check if user exists
    let user = await User.findOne({
      $or: [
        { email },
        { 'oauth.google.id': googleId }
      ]
    });

    if (user) {
      // Update existing user's Google OAuth info if needed
      if (!user.oauth.google.id) {
        user.oauth.google.id = googleId;
        user.oauth.google.email = email;
        await user.save();
      }

      // Update last login
      await User.findByIdAndUpdate(user._id, {
        lastLogin: new Date()
      });
    } else {
      // Create new user
      user = new User({
        firstName,
        lastName: lastName || '',
        email,
        profilePicture: picture,
        oauth: {
          google: {
            id: googleId,
            email
          }
        },
        preferences: {
          language: 'en',
          timezone: 'UTC-5',
          dateFormat: 'MM/DD/YYYY',
          theme: 'light'
        }
      });

      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          profilePicture: user.profilePicture,
          notifications: user.notifications,
          privacy: user.privacy,
          preferences: user.preferences,
          status: user.status,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        token: jwtToken
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
};

// Link Google account to existing user
const linkGoogleAccount = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.userId;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email } = payload;

    // Check if Google account is already linked to another user
    const existingUser = await User.findOne({ 'oauth.google.id': googleId });
    if (existingUser && existingUser._id.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: 'This Google account is already linked to another user'
      });
    }

    // Update current user's Google OAuth info
    const user = await User.findByIdAndUpdate(
      userId,
      {
        'oauth.google.id': googleId,
        'oauth.google.email': email
      },
      { new: true }
    ).select('-passwordHash -security.twoFactorSecret');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Google account linked successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          oauth: user.oauth
        }
      }
    });

  } catch (error) {
    console.error('Link Google account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link Google account'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  updateNotifications,
  updatePrivacy,
  updatePreferences,
  googleAuth,
  linkGoogleAccount
};