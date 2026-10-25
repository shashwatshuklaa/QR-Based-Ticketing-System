const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const SuperAdmin = require('../models/SuperAdmin');
const Admin = require('../models/Admin');
const Event = require('../models/Event');

/**
 * Prompt for regular text input via readline
 */
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

/**
 * Prompt for password input privately (masked with asterisks in TTY mode)
 * Never prints or stores the password value.
 */
function askPassword(promptText) {
  return new Promise((resolve) => {
    process.stdout.write(promptText);

    // Non-interactive fallback (e.g. piped input)
    if (!process.stdin.isTTY) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
      });
      rl.question('', (ans) => {
        rl.close();
        resolve(ans.trim());
      });
      return;
    }

    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\n' || char === '\r' || char === '\u0004') {
          // Enter key
          stdin.removeListener('data', onData);
          stdin.setRawMode(wasRaw);
          stdin.pause();
          process.stdout.write('\n');
          return resolve(password);
        } else if (char === '\u0003') {
          // Ctrl+C
          process.stdout.write('\nOperation cancelled.\n');
          process.exit(1);
        } else if (char === '\u007f' || char === '\b') {
          // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
        } else if (char.charCodeAt(0) >= 32) {
          // Printable characters
          password += char;
          process.stdout.write('*');
        }
      }
    };

    stdin.on('data', onData);
  });
}

async function createAccount() {
  const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, val] = arg.replace(/^--/, '').split('=');
    if (key && val) acc[key] = val;
    return acc;
  }, {});

  // Reject --password flag for security (passwords must never be entered on CLI flags)
  if (args.password || process.argv.some((a) => a.startsWith('--password'))) {
    console.error('\nSecurity Warning: Supplying passwords via command-line flags (--password) is disabled.');
    console.error('Please run the script without --password and enter your password privately when prompted.\n');
    process.exit(1);
  }

  console.log('\n=======================================');
  console.log('  QR Ticketing — Safe Admin Creation  ');
  console.log('=======================================\n');

  // 1. Role Selection
  let type = (args.type || '').toLowerCase();
  if (type !== 'superadmin' && type !== 'admin') {
    console.log('Select Account Role:');
    console.log('  1) Super Administrator (Global event & staff management)');
    console.log('  2) Gate Staff Admin (Scanner & attendee check-ins)');
    const choice = await askQuestion('Enter choice (1 or 2, default: 1): ');
    type = choice === '2' ? 'admin' : 'superadmin';
  }

  // 2. Email Address
  let email = (args.email || '').trim().toLowerCase();
  while (!email || !email.includes('@')) {
    email = (await askQuestion(`Enter ${type === 'superadmin' ? 'Super Admin' : 'Staff Admin'} email: `)).trim().toLowerCase();
    if (!email || !email.includes('@')) {
      console.log('Please enter a valid email address.');
    }
  }

  // 3. Display Name
  let name = args.name || '';
  if (!name) {
    name = (await askQuestion(`Enter Full Name (optional, default: ${type === 'superadmin' ? 'Super Administrator' : 'Gate Staff'}): `)).trim();
    if (!name) name = type === 'superadmin' ? 'Super Administrator' : 'Gate Staff';
  }

  // 4. Password Input (Private & Masked)
  let password = '';
  let confirmPassword = '';

  while (!password || password.length < 8) {
    password = await askPassword('Enter private password (min 8 characters): ');
    if (password.length < 8) {
      console.log('Password is too short. Minimum 8 characters required.');
      continue;
    }
    confirmPassword = await askPassword('Confirm private password: ');
    if (password !== confirmPassword) {
      console.log('Passwords do not match. Please try again.\n');
      password = '';
    }
  }

  // 5. Connect to MongoDB and save
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/qr-ticketing';
    console.log('\nConnecting to database...');
    await mongoose.connect(mongoUri);

    const hashedPassword = await bcrypt.hash(password, 12);
    // Erase plaintext variable from memory
    password = null;
    confirmPassword = null;

    if (type === 'superadmin') {
      const existing = await SuperAdmin.findOne({ email });
      if (existing) {
        existing.password = hashedPassword;
        existing.name = name;
        await existing.save();
        console.log(`\n✓ Super Admin account for "${email}" updated successfully.`);
      } else {
        await SuperAdmin.create({ email, password: hashedPassword, name });
        console.log(`\n✓ Super Admin account for "${email}" created successfully.`);
      }
    } else {
      const existing = await Admin.findOne({ email });
      const firstEvent = await Event.findOne();
      const eventIds = firstEvent ? [firstEvent._id] : [];

      if (existing) {
        existing.password = hashedPassword;
        existing.name = name;
        await existing.save();
        console.log(`\n✓ Staff Admin account for "${email}" updated successfully.`);
      } else {
        await Admin.create({ email, password: hashedPassword, name, eventIds });
        console.log(`\n✓ Staff Admin account for "${email}" created successfully and assigned to events.`);
      }
    }

    console.log('\nYou can now use these credentials to log in on the browser:');
    if (type === 'superadmin') {
      console.log('  URL: http://localhost:3000/super-admin');
    } else {
      console.log('  URL: http://localhost:3000/admin');
    }
    console.log('=======================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\nDatabase operation failed:', error.message);
    process.exit(1);
  }
}

createAccount();
