import { User, Letter, Log, Role, LetterStatus, SystemSettings, LetterRecipient } from '../types';

// Initial Data
const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', password: '123', fullName: 'مدیر سیستم', role: Role.ADMIN, position: 'مدیریت کل', avatarUrl: '' },
  { id: '2', username: 'manager', password: '123', fullName: 'رضا علوی', role: Role.MANAGER, position: 'مدیر فنی', avatarUrl: '' },
  { id: '3', username: 'employee', password: '123', fullName: 'سارا محمدی', role: Role.EMPLOYEE, position: 'کارشناس فروش', avatarUrl: '' },
];

const INITIAL_SETTINGS: SystemSettings = {
  siteName: 'نوین اتوماسیون',
  themeColor: '#0ea5e9', // Sky-500
  logoUrl: '',
};

class DBService {
  // Helper to safely save to localStorage
  private setItem(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        alert('خطا: حافظه مرورگر پر شده است! لطفاً حجم فایل‌ها/عکس‌ها را کاهش دهید یا برخی نامه‌های قدیمی را حذف کنید.');
      } else {
        console.error('Storage Error:', e);
      }
      throw e; // Re-throw to stop execution in caller
    }
  }

  // --- Settings ---
  getSettings(): SystemSettings {
    const settings = localStorage.getItem('db_settings');
    return settings ? JSON.parse(settings) : INITIAL_SETTINGS;
  }

  saveSettings(settings: SystemSettings): void {
    this.setItem('db_settings', settings);
  }

  // --- Users ---
  private getUsers(): User[] {
    const users = localStorage.getItem('db_users');
    return users ? JSON.parse(users) : INITIAL_USERS;
  }

  private saveUsers(users: User[]) {
    this.setItem('db_users', users);
  }

  private getLetters(): Letter[] {
    const letters = localStorage.getItem('db_letters');
    return letters ? JSON.parse(letters) : [];
  }

  private saveLetters(letters: Letter[]) {
    this.setItem('db_letters', letters);
  }

  private getLogs(): Log[] {
    const logs = localStorage.getItem('db_logs');
    return logs ? JSON.parse(logs) : [];
  }

  private saveLogs(logs: Log[]) {
    // Keep only last 100 logs to save space
    if (logs.length > 100) logs = logs.slice(0, 100);
    this.setItem('db_logs', logs);
  }

  // --- Auth & User Methods ---

  login(username: string, password: string): User | null {
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      this.addLog(user.id, user.fullName, 'LOGIN', 'User logged in successfully');
      return user;
    }
    return null;
  }

  getAllUsers(): User[] {
    return this.getUsers().map(({ password, ...user }) => user as User);
  }

  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  }

  updateUser(updatedUser: User): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser };
      this.saveUsers(users);
      this.addLog(updatedUser.id, updatedUser.fullName, 'UPDATE_PROFILE', 'User updated profile');
    }
  }

  deleteUser(userId: string): void {
    let users = this.getUsers();
    users = users.filter(u => u.id !== userId);
    this.saveUsers(users);
  }

  // --- Letter Methods ---

  createLetter(letter: Letter): void {
    const letters = this.getLetters();
    letters.push(letter);
    this.saveLetters(letters);
    
    // Log receiver names
    const recipientNames = letter.recipients.map(r => r.userName).join(', ');
    this.addLog(letter.senderId, letter.senderName, 'CREATE_LETTER', `Created letter: ${letter.subject} for ${recipientNames}`);
  }

  getUserLetters(userId: string): Letter[] {
    const letters = this.getLetters();
    return letters.filter(l => 
        l.senderId === userId || 
        (l.recipients && l.recipients.some(r => r.userId === userId))
    ).sort((a, b) => b.createdAt - a.createdAt);
  }

  getAllLettersForAdmin(): Letter[] {
    const letters = this.getLetters();
    return letters.sort((a, b) => b.createdAt - a.createdAt);
  }

  updateLetter(updatedLetter: Letter): void {
    const letters = this.getLetters();
    const index = letters.findIndex(l => l.id === updatedLetter.id);
    if (index !== -1) {
        letters[index] = updatedLetter;
        this.saveLetters(letters);
        this.addLog('ADMIN', 'مدیر سیستم', 'UPDATE_LETTER', `Admin updated letter: ${updatedLetter.subject}`);
    }
  }

  signLetter(letterId: string, signerId: string, signerName: string, status: LetterStatus, comment?: string, signatureImage?: string): void {
    const letters = this.getLetters();
    const index = letters.findIndex(l => l.id === letterId);
    
    if (index !== -1) {
      const letter = letters[index];
      
      // Update specific recipient status
      const recipientIndex = letter.recipients.findIndex(r => r.userId === signerId);
      if (recipientIndex !== -1) {
          letter.recipients[recipientIndex].status = status;
          letter.recipients[recipientIndex].actionDate = Date.now();
          letter.recipients[recipientIndex].comment = comment;
          if (status === LetterStatus.APPROVED) {
              letter.recipients[recipientIndex].signatureImage = signatureImage;
          }
      }

      // Update Overall Letter Status Logic
      const signers = letter.recipients.filter(r => r.role === 'SIGNER');
      let newOverallStatus = LetterStatus.PENDING;

      if (signers.length > 0) {
          const anyRejected = signers.some(r => r.status === LetterStatus.REJECTED);
          const allApproved = signers.every(r => r.status === LetterStatus.APPROVED);

          if (anyRejected) {
              newOverallStatus = LetterStatus.REJECTED;
          } else if (allApproved) {
              newOverallStatus = LetterStatus.APPROVED;
          }
      } else {
          newOverallStatus = LetterStatus.APPROVED; 
      }
      
      letter.status = newOverallStatus;
      letters[index] = letter;
      this.saveLetters(letters);
      
      this.addLog(signerId, signerName, 'SIGN_LETTER', `Letter ${status}: ${letter.subject}`);
    }
  }

  // --- Log Methods ---

  addLog(userId: string, userName: string, action: string, details: string): void {
    try {
        const logs = this.getLogs();
        const newLog: Log = {
          id: Date.now().toString(),
          userId,
          userName,
          action,
          details,
          timestamp: Date.now(),
        };
        logs.unshift(newLog);
        this.saveLogs(logs);
    } catch (e) {
        console.warn("Could not save log due to storage limits.");
    }
  }

  getSystemLogs(): Log[] {
    return this.getLogs();
  }

  init() {
    if (!localStorage.getItem('db_users')) {
      this.saveUsers(INITIAL_USERS);
    }
    if (!localStorage.getItem('db_settings')) {
        this.saveSettings(INITIAL_SETTINGS);
    }
  }
}

export const dbService = new DBService();
dbService.init();