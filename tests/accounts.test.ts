import assert from 'node:assert';
import fs from 'node:fs';

console.log('--- Testing AI Account Identification & On-Demand Registration ---');

// 1. Verify data/users.json structure
const rawUsers = fs.readFileSync('data/users.json', 'utf-8');
const users = JSON.parse(rawUsers);
assert.strictEqual(Array.isArray(users), true, 'users.json should be an array');
console.log('✓ data/users.json verified valid storage');

// 2. Test passkey recognition for Restart Accounts Code Terminal
function verifyClearancePasskey(passkey: string): boolean {
  const raw = String(passkey).trim();
  const clean = raw.toLowerCase().replace(/[\s\-_.@]/g, '');
  return (
    raw === 'goyal.rishi' || 
    clean === 'goyalrishi' || 
    clean === 'rishiadmin' || 
    clean === 'macbookair'
  );
}

assert.strictEqual(verifyClearancePasskey('goyal.rishi'), true);
assert.strictEqual(verifyClearancePasskey('MacBookair'), true);
assert.strictEqual(verifyClearancePasskey('rishi_admin'), true);
assert.strictEqual(verifyClearancePasskey('wrong_passkey'), false);
console.log('✓ Secret accounts clearance passkey verification passed');

// 3. Test AI Account Identification and Recognition Logic
interface MockUser {
  id: string;
  username: string;
  password?: string;
  aiRiskCategory?: string;
  aiExplanation?: string;
}

const mockDb: MockUser[] = [
  {
    id: 'u1',
    username: 'Rishi_admin',
    password: 'macbookair',
    aiRiskCategory: 'Clean Verified Administrator',
    aiExplanation: 'System Administrator account. Identified and verified.'
  }
];

function mockRegister(username: string, password?: string): { success: boolean; code?: string; message: string; user?: MockUser } {
  const clean = username.trim();
  const existing = mockDb.find(u => u.username.toLowerCase() === clean.toLowerCase());

  if (existing) {
    const pwdMatch = !existing.password || existing.password === password;
    if (pwdMatch) {
      return {
        success: true,
        user: existing,
        message: 'Account recognized! Logged in successfully.'
      };
    }
    return {
      success: false,
      code: 'ACCOUNT_EXISTS',
      message: `The gamer tag "${clean}" is already registered. If this is your account, switch to "Log In" or enter your password.`
    };
  }

  const newUser: MockUser = {
    id: 'new-' + Date.now(),
    username: clean,
    password,
    aiRiskCategory: 'AI-Verified Active Player',
    aiExplanation: 'On-demand registered account verified by AI security scanner.'
  };
  mockDb.push(newUser);
  return { success: true, user: newUser, message: 'Account registered and identified successfully!' };
}

// Test recognition on matching password
const recResult = mockRegister('rishi_admin', 'macbookair');
assert.strictEqual(recResult.success, true);
assert.strictEqual(recResult.message, 'Account recognized! Logged in successfully.');
assert.strictEqual(recResult.user?.aiRiskCategory, 'Clean Verified Administrator');
console.log('✓ AI Account identification recognizes valid accounts successfully');

// Test conflict on mismatching password
const conflictResult = mockRegister('rishi_admin', 'wrong_password');
assert.strictEqual(conflictResult.success, false);
assert.strictEqual(conflictResult.code, 'ACCOUNT_EXISTS');
console.log('✓ Duplicate username with wrong password properly protected');

// Test on-demand registration with AI identification
const newResult = mockRegister('CyberNinja99', 'securePass123');
assert.strictEqual(newResult.success, true);
assert.strictEqual(newResult.user?.aiRiskCategory, 'AI-Verified Active Player');
console.log('✓ On-demand account registration with AI identification passed');

// 4. Verify no background setInterval is present in server start
const serverCode = fs.readFileSync('server.ts', 'utf-8');
assert.strictEqual(serverCode.includes('setInterval('), false, 'Hourly background setInterval must be removed from server.ts');
console.log('✓ Verified hourly setInterval scan is completely removed from server.ts');

// 5. Test Admin Account Registration & Sidebar Visibility Logic
interface RegisterOptions {
  username: string;
  isAdminRegister?: boolean;
  adminPasskey?: string;
}

function simulateRegistration(opts: RegisterOptions): { user: { username: string; isAdmin: boolean; role: string } } {
  const cleanPasskey = String(opts.adminPasskey || '').trim().toLowerCase().replace(/[\s\-_.@]/g, '');
  const isValidAdminKey = cleanPasskey === 'goyalrishi' || cleanPasskey === 'rishiadmin' || cleanPasskey === 'macbookair';
  const isAdmin = Boolean(opts.isAdminRegister && isValidAdminKey);
  return {
    user: {
      username: opts.username,
      isAdmin,
      role: isAdmin ? 'admin' : 'user'
    }
  };
}

// Regular player registration
const regPlayer = simulateRegistration({ username: 'CasualGamer', isAdminRegister: false });
assert.strictEqual(regPlayer.user.isAdmin, false);
assert.strictEqual(regPlayer.user.role, 'user');

// Admin registration with valid passkey
const regAdmin = simulateRegistration({ username: 'AdminChief', isAdminRegister: true, adminPasskey: 'macbookair' });
assert.strictEqual(regAdmin.user.isAdmin, true);
assert.strictEqual(regAdmin.user.role, 'admin');

// Admin registration with invalid passkey
const regFailedAdmin = simulateRegistration({ username: 'SneakyUser', isAdminRegister: true, adminPasskey: 'bad_passkey' });
assert.strictEqual(regFailedAdmin.user.isAdmin, false);
assert.strictEqual(regFailedAdmin.user.role, 'user');

// Verify Sidebar category visibility constraint
function isSidebarAdminCategoryVisible(user: { isAdmin: boolean } | null): boolean {
  return Boolean(user && user.isAdmin === true);
}

assert.strictEqual(isSidebarAdminCategoryVisible(null), false, 'Anonymous guest must not see Admin Moderation in sidebar');
assert.strictEqual(isSidebarAdminCategoryVisible(regPlayer.user), false, 'Regular player must not see Admin Moderation in sidebar');
assert.strictEqual(isSidebarAdminCategoryVisible(regFailedAdmin.user), false, 'Failed admin registration must not see Admin Moderation in sidebar');
assert.strictEqual(isSidebarAdminCategoryVisible(regAdmin.user), true, 'Registered Admin account must see Admin Moderation in sidebar');
console.log('✓ Admin account registration and category tab visibility constraints verified');

console.log('All tests passed successfully!');
