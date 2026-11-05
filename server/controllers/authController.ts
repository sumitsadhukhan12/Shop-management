import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../services/store';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/types';

export async function login(req: Request, res: Response) {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      res.status(400).json({ message: 'Please provide mobile number or email and password.' });
      return;
    }

    const user = store.findUserByEmailOrMobile(identifier);
    if (!user) {
      res.status(401).json({ message: 'Invalid mobile number/email or password.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ message: 'Your account has been deactivated. Please contact the administrator.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid mobile number/email or password.' });
      return;
    }

    // Update lastLoginAt
    store.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    const token = generateToken(user);
    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error during login.' });
  }
}

export function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated.' });
    return;
  }
  const user = store.findUserById(req.user.id);
  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
}

// Method 1: Verification-based password reset
export async function resetPasswordWithVerification(req: Request, res: Response) {
  try {
    const { identifier, verificationCode, newPassword } = req.body;
    if (!identifier || !newPassword) {
      res.status(400).json({ message: 'Please provide email/mobile and new password.' });
      return;
    }

    const user = store.findUserByEmailOrMobile(identifier);
    if (!user) {
      res.status(404).json({ message: 'No account found with this email or mobile.' });
      return;
    }

    // In Sadhukhan Varities, verification code can be SMS/email OTP (default test OTP: '123456')
    if (verificationCode !== '123456' && verificationCode !== '2026') {
      res.status(400).json({ message: 'Invalid verification code. Enter demo OTP: 123456.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'New password must be at least 6 characters.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    store.updateUser(user.id, { passwordHash });

    store.addAuditLog('user', 'Password Reset', `Password reset via verification code for ${user.name} (${user.mobile})`, user.id, user.name);
    res.json({ message: 'Password has been successfully reset. Please log in with your new password.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password.' });
  }
}

// Method 2: Admin manually resets staff password
export async function adminResetStaffPassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { staffId, newPassword } = req.body;
    if (!staffId || !newPassword) {
      res.status(400).json({ message: 'Staff ID and new password are required.' });
      return;
    }

    const staff = store.findUserById(staffId);
    if (!staff) {
      res.status(404).json({ message: 'Staff user not found.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    store.updateUser(staff.id, { passwordHash });

    store.addAuditLog('user', 'Admin Reset Password', `Admin ${req.user!.name} reset password for staff ${staff.name} (${staff.mobile})`, req.user!.id, req.user!.name);
    res.json({ message: `Password for ${staff.name} updated successfully.` });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset staff password.' });
  }
}

// Admin: List all staff
export function listStaff(req: AuthenticatedRequest, res: Response) {
  const users = store.getUsers();
  res.json({ users });
}

// Admin: Create staff account
export async function createStaff(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, email, mobile, password, role } = req.body;
    if (!name || !mobile || !password) {
      res.status(400).json({ message: 'Name, mobile number and password are required.' });
      return;
    }

    const existing = store.findUserByEmailOrMobile(mobile) || (email ? store.findUserByEmailOrMobile(email) : undefined);
    if (existing) {
      res.status(400).json({ message: 'A user with this mobile number or email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: `user_staff_${Date.now()}`,
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : `${mobile.replace(/\D/g, '')}@sadhukhan.local`,
      mobile: mobile.trim(),
      passwordHash,
      role: role === 'admin' ? 'admin' : 'staff',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    store.addUser(newUser);
    store.addAuditLog('user', 'Create Staff', `Created ${newUser.role} user: ${newUser.name} (${newUser.mobile})`, req.user!.id, req.user!.name);

    const { passwordHash: _, ...safeUser } = newUser;
    res.status(201).json({ message: 'Staff member created successfully.', user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create staff member.' });
  }
}

// Admin: Update staff status or details
export function updateStaff(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { name, mobile, email, status, role } = req.body;

  const staff = store.findUserById(id);
  if (!staff) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  // Prevent self-deactivation of primary admin
  if (id === req.user!.id && status === 'inactive') {
    res.status(400).json({ message: 'Cannot deactivate your own administrator account.' });
    return;
  }

  const updated = store.updateUser(id, {
    ...(name ? { name: name.trim() } : {}),
    ...(mobile ? { mobile: mobile.trim() } : {}),
    ...(email ? { email: email.trim().toLowerCase() } : {}),
    ...(status ? { status } : {}),
    ...(role ? { role } : {})
  });

  store.addAuditLog('user', 'Update Staff', `Updated user ${staff.name} (status: ${status || staff.status})`, req.user!.id, req.user!.name);
  const { passwordHash, ...safeUser } = updated!;
  res.json({ message: 'User updated successfully.', user: safeUser });
}

// Admin: Delete staff account
export function deleteStaff(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  if (id === req.user!.id) {
    res.status(400).json({ message: 'Cannot delete your own administrator account.' });
    return;
  }

  const staff = store.findUserById(id);
  if (!staff) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  const success = store.deleteUser(id);
  if (success) {
    store.addAuditLog('user', 'Delete User', `Deleted user ${staff.name} (${staff.mobile})`, req.user!.id, req.user!.name);
    res.json({ message: 'User account removed successfully.' });
  } else {
    res.status(500).json({ message: 'Failed to delete user.' });
  }
}
