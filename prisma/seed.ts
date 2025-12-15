import 'tsconfig-paths/register';
import { PrismaClient, UserRole, UserStatus, ApprovalStatus } from '@prisma/client';
import { AuthUtil } from '../src/utils/auth.util';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Wards
  console.log('Creating wards...');
  const wards = await Promise.all([
    prisma.ward.upsert({
      where: { name: 'Central Ward' },
      update: {},
      create: {
        name: 'Central Ward',
        description: 'Central Ward Community',
        isActive: true,
      },
    }),
    prisma.ward.upsert({
      where: { name: 'North Ward' },
      update: {},
      create: {
        name: 'North Ward',
        description: 'North Ward Community',
        isActive: true,
      },
    }),
    prisma.ward.upsert({
      where: { name: 'South Ward' },
      update: {},
      create: {
        name: 'South Ward',
        description: 'South Ward Community',
        isActive: true,
      },
    }),
    prisma.ward.upsert({
      where: { name: 'East Ward' },
      update: {},
      create: {
        name: 'East Ward',
        description: 'East Ward Community',
        isActive: true,
      },
    }),
    prisma.ward.upsert({
      where: { name: 'West Ward' },
      update: {},
      create: {
        name: 'West Ward',
        description: 'West Ward Community',
        isActive: true,
      },
    }),
  ]);
  console.log(`✓ Created ${wards.length} wards`);

  // Create Admin User
  console.log('Creating admin user...');
  const hashedPassword = await AuthUtil.hashPassword('Admin@123');
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@church.org' },
    update: {},
    create: {
      email: 'admin@church.org',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Administrator',
      phone: '+1234567890',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      wardId: wards[0].id,
      emailVerified: true,
    },
  });
  console.log('✓ Created admin user');

  // Create Instructor Users
  console.log('Creating instructor users...');
  const instructorPassword = await AuthUtil.hashPassword('Instructor@123');

  const instructorUser1 = await prisma.user.upsert({
    where: { email: 'instructor1@church.org' },
    update: {},
    create: {
      email: 'instructor1@church.org',
      password: instructorPassword,
      firstName: 'Mary',
      lastName: 'Johnson',
      phone: '+1234567891',
      role: UserRole.INSTRUCTOR,
      status: UserStatus.ACTIVE,
      wardId: wards[0].id,
      emailVerified: true,
    },
  });

  const instructorUser2 = await prisma.user.upsert({
    where: { email: 'instructor2@church.org' },
    update: {},
    create: {
      email: 'instructor2@church.org',
      password: instructorPassword,
      firstName: 'David',
      lastName: 'Williams',
      phone: '+1234567892',
      role: UserRole.INSTRUCTOR,
      status: UserStatus.ACTIVE,
      wardId: wards[1].id,
      emailVerified: true,
    },
  });

  // Create Instructor Profiles
  const instructor1 = await prisma.instructor.upsert({
    where: { userId: instructorUser1.id },
    update: {},
    create: {
      userId: instructorUser1.id,
      skills: ['Tailoring', 'Fashion Design', 'Sewing'],
      bio: 'Experienced tailoring instructor with 10 years of experience',
      experience: 10,
      approvalStatus: ApprovalStatus.APPROVED,
      approvedAt: new Date(),
      documents: [],
    },
  });

  const instructor2 = await prisma.instructor.upsert({
    where: { userId: instructorUser2.id },
    update: {},
    create: {
      userId: instructorUser2.id,
      skills: ['Music', 'Choir Training', 'Piano'],
      bio: 'Professional music instructor and choir director',
      experience: 8,
      approvalStatus: ApprovalStatus.APPROVED,
      approvedAt: new Date(),
      documents: [],
    },
  });
  console.log('✓ Created instructor profiles');

  // Create Student Users
  console.log('Creating student users...');
  const studentPassword = await AuthUtil.hashPassword('Student@123');

  const studentUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'student1@church.org' },
      update: {},
      create: {
        email: 'student1@church.org',
        password: studentPassword,
        firstName: 'Michael',
        lastName: 'Learner',
        phone: '+1234567893',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        wardId: wards[0].id,
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'student2@church.org' },
      update: {},
      create: {
        email: 'student2@church.org',
        password: studentPassword,
        firstName: 'Sarah',
        lastName: 'Wilson',
        phone: '+1234567894',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        wardId: wards[1].id,
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'student3@church.org' },
      update: {},
      create: {
        email: 'student3@church.org',
        password: studentPassword,
        firstName: 'James',
        lastName: 'Smith',
        phone: '+1234567895',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        wardId: wards[2].id,
        emailVerified: true,
      },
    }),
  ]);

  // Create Student Profiles
  const students = await Promise.all(
    studentUsers.map((user) =>
      prisma.student.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
        },
      })
    )
  );
  console.log(`✓ Created ${students.length} student profiles`);

  // Create Classes
  console.log('Creating classes...');
  const classes = await Promise.all([
    prisma.class.create({
      data: {
        name: 'Tailoring & Fashion Design',
        description:
          'Learn the fundamentals of tailoring and fashion design, from basic stitching to creating complete garments.',
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          time: '9:00 AM - 11:00 AM',
        },
        maxCapacity: 20,
        instructorId: instructor1.id,
        wardId: wards[0].id,
        createdById: adminUser.id,
        status: 'ACTIVE',
      },
    }),
    prisma.class.create({
      data: {
        name: 'Music & Choir Training',
        description:
          'Develop your musical talents through vocal training, music theory, and choir practice.',
        schedule: {
          days: ['Saturday'],
          time: '2:00 PM - 5:00 PM',
        },
        maxCapacity: 25,
        instructorId: instructor2.id,
        wardId: wards[1].id,
        createdById: adminUser.id,
        status: 'ACTIVE',
      },
    }),
    prisma.class.create({
      data: {
        name: 'Advanced Sewing Techniques',
        description: 'Master advanced sewing techniques and create professional-quality garments.',
        schedule: {
          days: ['Tuesday', 'Thursday'],
          time: '2:00 PM - 4:00 PM',
        },
        maxCapacity: 15,
        instructorId: instructor1.id,
        wardId: wards[0].id,
        createdById: adminUser.id,
        status: 'ACTIVE',
      },
    }),
  ]);
  console.log(`✓ Created ${classes.length} classes`);

  // Create Sample Enrollments
  console.log('Creating sample enrollments...');
  await Promise.all([
    prisma.enrollment.create({
      data: {
        classId: classes[0].id,
        studentId: students[0].id,
        status: ApprovalStatus.APPROVED,
        approvedAt: new Date(),
      },
    }),
    prisma.enrollment.create({
      data: {
        classId: classes[1].id,
        studentId: students[1].id,
        status: ApprovalStatus.APPROVED,
        approvedAt: new Date(),
      },
    }),
    prisma.enrollment.create({
      data: {
        classId: classes[0].id,
        studentId: students[2].id,
        status: ApprovalStatus.PENDING,
      },
    }),
  ]);
  console.log('✓ Created sample enrollments');

  // Create Sample Notifications
  console.log('Creating sample notifications...');
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: studentUsers[0].id,
        title: 'Welcome!',
        message: 'Welcome to Lekki Gathering Place Skills Training System',
        type: 'SUCCESS',
        read: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: instructorUser1.id,
        title: 'New Enrollment Request',
        message: 'You have a new enrollment request for Tailoring & Fashion Design',
        type: 'INFO',
        read: false,
      },
    }),
  ]);
  console.log('✓ Created sample notifications');

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('Admin: admin@church.org / Admin@123');
  console.log('Instructor: instructor1@church.org / Instructor@123');
  console.log('Student: student1@church.org / Student@123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
