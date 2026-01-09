import prisma from './src/config/database';
import { AuthUtil } from './src/utils/auth.util';

async function testLogin() {
  try {
    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { email: 'admin@church.org' }
    });

    console.log('=== User Check ===');
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (user) {
      console.log('Email:', user.email);
      console.log('Status:', user.status);
      console.log('Role:', user.role);
      console.log('Password hash:', user.password.substring(0, 30) + '...');
      
      // Test password comparison
      console.log('\n=== Password Test ===');
      const testPassword = 'Admin@123';
      const isValid = await AuthUtil.comparePassword(testPassword, user.password);
      console.log(`Password '${testPassword}' is valid:`, isValid);
      
      // Test with wrong password
      const wrongPassword = 'WrongPassword';
      const isWrong = await AuthUtil.comparePassword(wrongPassword, user.password);
      console.log(`Password '${wrongPassword}' is valid:`, isWrong);
    } else {
      console.log('No user found with email admin@church.org');
      console.log('\nChecking all users...');
      const allUsers = await prisma.user.findMany({
        select: { email: true, role: true, status: true }
      });
      console.log('Total users:', allUsers.length);
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.role}) - ${u.status}`));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
