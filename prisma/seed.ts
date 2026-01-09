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
      where: { name: 'Lekki Ward' },
      update: {},
      create: {
        name: 'Lekki Ward',
        description: 'Lekki Ward Community',
        isActive: true,
      },
    }),
    prisma.ward.upsert({
      where: { name: 'Ajah Ward' },
      update: {},
      create: {
        name: 'Ajah Ward',
        description: 'Ajah Ward Community',
        isActive: true,
      },
    }),
    prisma.ward.upsert({
      where: { name: 'Shangotedo Ward' },
      update: {},
      create: {
        name: 'Shangotedo Ward',
        description: 'Shangotedo Ward Community',
        isActive: true,
      },
    }),
    prisma.ward.upsert({
      where: { name: 'Lakowe Ward' },
      update: {},
      create: {
        name: 'Lakowe Ward',
        description: 'Lakowe Ward Community',
        isActive: true,
      },
    }),
    prisma.ward.upsert({
      where: { name: 'Badore Ward' },
      update: {},
      create: {
        name: 'Badore Ward',
        description: 'Badore Ward Community',
        isActive: true,
      },
    }),
    prisma.ward.upsert({
      where: { name: 'Ekpe branch' },
      update: {},
      create: {
        name: 'Ekpe branch',
        description: 'Ekpe Branch Community',
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
    where: { email: 'kingsley.ugwumba@church.org' },
    update: {},
    create: {
      email: 'kingsley.ugwumba@church.org',
      password: instructorPassword,
      firstName: 'Kingsley Peter',
      lastName: 'Ugwumba (Spectra)',
      phone: '+2348012345671',
      role: UserRole.INSTRUCTOR,
      status: UserStatus.ACTIVE,
      wardId: wards[0].id,
      emailVerified: true,
    },
  });

  const instructorUser2 = await prisma.user.upsert({
    where: { email: 'divinegift.ogitie@church.org' },
    update: {},
    create: {
      email: 'divinegift.ogitie@church.org',
      password: instructorPassword,
      firstName: 'Divine-gift',
      lastName: 'Ogitie',
      phone: '+2348012345672',
      role: UserRole.INSTRUCTOR,
      status: UserStatus.ACTIVE,
      wardId: wards[1].id,
      emailVerified: true,
    },
  });

  const instructorUser3 = await prisma.user.upsert({
    where: { email: 'amara.okonkwo@church.org' },
    update: {},
    create: {
      email: 'amara.okonkwo@church.org',
      password: instructorPassword,
      firstName: 'Okonkwo',
      lastName: 'Amara',
      phone: '+2348012345673',
      role: UserRole.INSTRUCTOR,
      status: UserStatus.ACTIVE,
      wardId: wards[2].id,
      emailVerified: true,
    },
  });

  const instructorUser4 = await prisma.user.upsert({
    where: { email: 'ysa.team@church.org' },
    update: {},
    create: {
      email: 'ysa.team@church.org',
      password: instructorPassword,
      firstName: 'YSA Programming',
      lastName: 'Academy Team',
      phone: '+2348012345674',
      role: UserRole.INSTRUCTOR,
      status: UserStatus.ACTIVE,
      wardId: wards[0].id,
      emailVerified: true,
    },
  });

  // Create Instructor Profiles
  const instructor1 = await prisma.instructor.upsert({
    where: { userId: instructorUser1.id },
    update: {},
    create: {
      userId: instructorUser1.id,
      skills: ['Mobile Photography', 'Videography', 'Content Creation', 'Canva', 'CapCut'],
      bio: 'Expert in mobile photography and videography, helping beginners create stunning social media content',
      experience: 5,
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
      skills: ['Wig Making', 'Hair Styling', 'Lace Customization', 'Beauty'],
      bio: 'Professional wig-making instructor specializing in advanced techniques and salon-grade results',
      experience: 8,
      approvalStatus: ApprovalStatus.APPROVED,
      approvedAt: new Date(),
      documents: [],
    },
  });

  const instructor3 = await prisma.instructor.upsert({
    where: { userId: instructorUser3.id },
    update: {},
    create: {
      userId: instructorUser3.id,
      skills: ['Content Creation', 'Scriptwriting', 'Voice-over', 'Social Media'],
      bio: 'Content creation specialist teaching multi-niche content strategies and engagement techniques',
      experience: 6,
      approvalStatus: ApprovalStatus.APPROVED,
      approvedAt: new Date(),
      documents: [],
    },
  });

  const instructor4 = await prisma.instructor.upsert({
    where: { userId: instructorUser4.id },
    update: {},
    create: {
      userId: instructorUser4.id,
      skills: ['Web Development', 'Mobile Development', 'React', 'React Native', 'JavaScript', 'TypeScript'],
      bio: 'YSA Programming Academy - Training young adults in modern web and mobile development',
      experience: 10,
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
        phone: '+2348012345681',
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
        phone: '+2348012345682',
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
        phone: '+2348012345683',
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

  // Create Classes with Real Data
  console.log('Creating classes...');
  const classes = await Promise.all([
    // Mobile Photography & Videography
    prisma.class.create({
      data: {
        name: 'Mobile Photography & Videography',
        category: 'Media & Content Creation',
        level: 'Beginner',
        mode: 'In-person / Practical',
        overview: 'This course introduces beginners to the fundamentals of mobile photography and videography using smartphones. Students learn camera setup, composition, lighting, video stability, and professional editing using Canva and CapCut. The program combines theory with hands-on practice to help students create social-media-ready content.',
        description: 'Learn mobile photography and videography from scratch using your smartphone',
        schedule: {
          days: ['Thursday'],
          time: '6:00 PM - 8:00 PM',
          weeklyLessons: [
            { week: 1, title: 'Introduction to Mobile Photography & Videography', objectives: ['Understand course structure', 'Explore smartphone camera interface'], activities: ['Camera tour', 'Exploring camera modes'] },
            { week: 2, title: 'Understanding Mobile Camera Settings', objectives: ['Learn focus, exposure, HDR, resolution, and stabilization'], activities: ['Adjust camera settings', 'Capture test photos and videos'] },
            { week: 3, title: 'Lighting Basics & Natural Light Techniques', objectives: ['Understand lighting positions and shadows'], activities: ['Indoor window-light practice', 'Outdoor lighting exercises'] },
            { week: 4, title: 'Angles & Composition Techniques', objectives: ['Apply rule of thirds, symmetry, and framing'], activities: ['Composition-based photo shooting'] },
            { week: 5, title: 'Mobile Videography Basics', objectives: ['Learn stable shooting and transitions'], activities: ['Record short clips using correct angles'] },
            { week: 6, title: 'Editing Photos with Canva', objectives: ['Apply filters and color correction'], activities: ['Edit multiple photos for social media'] },
            { week: 7, title: 'Editing Videos with CapCut', objectives: ['Learn cuts, transitions, text, and audio'], activities: ['Edit a short-form video'] },
            { week: 8, title: 'Colour Grading & Sound Choices', objectives: ['Enhance mood and audio quality'], activities: ['Color grading practice', 'Music synchronization'] },
            { week: 9, title: 'Creating Social Media Content', objectives: ['Understand platform-specific formats'], activities: ['Create a complete social media post'] },
            { week: 10, title: 'Assessment, Portfolio Review & Certification', objectives: ['Demonstrate skill mastery'], activities: ['Submit final photo and video project'] },
          ],
        },
        maxCapacity: 25,
        instructorId: instructor1.id,
        instructorName: 'Kingsley Peter Ugwumba (Spectra)',
        instructorProfileSlug: 'kingsley-ugwumba',
        wardId: wards[0].id,
        createdById: adminUser.id,
        status: 'ACTIVE',
        totalLessons: 10,
        totalWeeks: 10,
        learningOutcomes: [
          'Understand smartphone camera settings including focus, exposure, HDR, frame rate, and stabilization',
          'Capture clear, sharp, and well-composed photographs',
          'Record smooth and properly framed video clips',
          'Edit photos professionally using Canva',
          'Edit videos using CapCut including cuts, transitions, text, and music syncing',
          'Create content optimized for Instagram, TikTok, and YouTube',
        ],
        courseRequirements: [
          'Smartphone with a functional camera (Android or iPhone)',
          'Canva application installed',
          'CapCut application installed',
          'Access to good lighting or natural light',
          'Notebook for note-taking',
        ],
        toolsAndMaterials: [
          'Smartphone camera',
          'Canva app',
          'CapCut app',
          'Tripod or phone stabilizer (optional)',
          'LED or ring light (optional)',
          'Phone cleaning cloth',
        ],
        certificationIssued: true,
        certificationCriteria: 'Completion of final assessment and submission of required projects',
      },
    }),

    // Advanced Wig-Making & Customization
    prisma.class.create({
      data: {
        name: 'Advanced Wig-Making & Customization',
        category: 'Fashion & Beauty',
        level: 'Intermediate to Advanced',
        mode: 'In-person / Practical',
        overview: 'This advanced course teaches professional wig-making techniques including lace identification, knot bleaching, lace tinting, hairline customization, bundle sewing, and salon-grade styling. Students complete a premium-quality wig from start to finish.',
        description: 'Master professional wig-making and customization techniques',
        schedule: {
          days: ['Saturday'],
          time: '10:00 AM - 1:00 PM',
          weeklyLessons: [
            { week: 1, title: 'Tools, Products & Lace Identification' },
            { week: 2, title: 'Bleaching Knots (Professional Method)' },
            { week: 3, title: 'Lace Tinting & Skin Tone Matching' },
            { week: 4, title: 'Advanced Plucking & Hairline Customization' },
            { week: 5, title: 'Sewing Bundles – Foundation' },
            { week: 6, title: 'Sewing Bundles – Completion' },
            { week: 7, title: 'Advanced Styling Techniques' },
            { week: 8, title: 'Complete Wig Assembly' },
            { week: 9, title: 'Professional Wig Finishing' },
            { week: 10, title: 'Final Assessment & Certification' },
          ],
        },
        maxCapacity: 15,
        instructorId: instructor2.id,
        instructorName: 'Divine-gift Ogitie',
        instructorProfileSlug: 'divinegift-ogitie',
        wardId: wards[1].id,
        createdById: adminUser.id,
        status: 'ACTIVE',
        totalLessons: 10,
        totalWeeks: 10,
        learningOutcomes: [
          'Identify professional wig-making tools and lace types',
          'Bleach knots safely and evenly',
          'Tint lace to match different skin tones',
          'Customize realistic hairlines using advanced plucking',
          'Sew bundles professionally',
          'Apply salon-grade styling techniques',
          'Complete a premium wig build independently',
        ],
        courseRequirements: [
          'Frontal or closure',
          '2–3 bundles of quality hair',
          'Mannequin head and tripod',
          'Sewing and ventilating tools',
          'Notebook for notes',
        ],
        toolsAndMaterials: [
          'HD or transparent lace',
          'Mannequin head with tripod',
          'Bundles of hair',
          'Needle, thread, scissors, T-pins',
          'Bleaching products',
          'Lace tint or foundation',
          'Hot comb and heat protectant',
        ],
        certificationIssued: true,
        certificationCriteria: 'Successful completion of final wig build and instructor grading',
      },
    }),

    // Content Creation Masterclass
    prisma.class.create({
      data: {
        name: 'Content Creation Masterclass',
        category: 'Digital Media',
        level: 'Beginner to Intermediate',
        mode: 'In-person',
        overview: 'This class teaches students how to create content across multiple niches, craft attention-grabbing hooks, write scripts, and produce voice-note-based content for social media platforms.',
        description: 'Create engaging content for social media across multiple niches',
        schedule: {
          days: ['Friday'],
          time: '5:00 PM - 7:00 PM',
          weeklyLessons: [
            { week: 1, title: 'Understanding Niches & Hooks' },
            { week: 2, title: 'Scriptwriting for Social Media' },
            { week: 3, title: 'Voice Note Content Creation' },
            { week: 4, title: 'Content Angles & Engagement' },
          ],
        },
        maxCapacity: 30,
        instructorId: instructor3.id,
        instructorName: 'Okonkwo Amara',
        instructorProfileSlug: 'amara-okonkwo',
        wardId: wards[2].id,
        createdById: adminUser.id,
        status: 'ACTIVE',
        totalLessons: 4,
        totalWeeks: 4,
        learningOutcomes: [
          'Understand multiple content niches',
          'Create effective content hooks',
          'Write scripts for short-form platforms',
          'Produce engaging voice-note content',
          'Adapt content for different audiences',
        ],
        courseRequirements: [
          'Smartphone',
          'Internet access',
          'Notebook',
        ],
        toolsAndMaterials: [
          'Smartphone microphone',
          'Social media apps',
          'Quiet recording space',
        ],
        certificationIssued: true,
        certificationCriteria: 'Completion of weekly assignments',
      },
    }),

    // YSA Programming Academy
    prisma.class.create({
      data: {
        name: 'YSA Programming Academy: Web & Mobile Development',
        category: 'Technology & Software Development',
        level: 'Beginner to Job-Ready',
        mode: 'In-person / Practical',
        overview: 'A comprehensive programming course designed to take young single adults from beginner level to job-ready web and mobile developers. The program combines structured teaching, weekly hands-on projects, and real-world tools covering frontend, backend, mobile development, deployment, and career preparation.',
        description: 'Complete programming bootcamp for web and mobile development',
        schedule: {
          days: ['Thursday'],
          time: '5:00 PM - 7:00 PM',
          weeklyLessons: [
            { week: 1, phase: 'Web Foundations', title: 'Introduction to Web Development', topics: ['What is web development?', 'Frontend vs Backend', 'How the internet works (DNS, HTTP, browsers)', 'Setting up development environment', 'HTML structure and semantics'], miniProject: 'Personal Bio Page', resources: ['MDN Web Docs', 'VS Code', 'freeCodeCamp HTML Course'] },
            { week: 2, phase: 'Web Foundations', title: 'Styling with CSS', topics: ['CSS syntax and selectors', 'Colors, fonts, and typography', 'Box model', 'Flexbox layout'], miniProject: 'Styled Profile Card', resources: ['CSS Tricks Flexbox Guide', 'Google Fonts', 'Flexbox Froggy'] },
            { week: 3, phase: 'Web Foundations', title: 'Responsive Design & CSS Grid', topics: ['Mobile-first design', 'Media queries', 'CSS Grid', 'Introduction to Tailwind CSS'], miniProject: 'Responsive Photo Gallery', resources: ['CSS Grid Garden', 'Tailwind CSS Documentation'] },
            { week: 4, phase: 'JavaScript & Interactivity', title: 'JavaScript Fundamentals', topics: ['Variables and data types', 'Functions and control flow', 'Arrays and objects', 'DOM manipulation'], miniProject: 'Interactive Quiz App', resources: ['JavaScript.info', 'Eloquent JavaScript'] },
            { week: 5, phase: 'JavaScript & Interactivity', title: 'Modern JavaScript & APIs', topics: ['ES6+ features', 'Async/Await and Promises', 'Fetching APIs', 'Working with JSON'], miniProject: 'Weather Dashboard', resources: ['Public APIs List', 'RapidAPI Hub'] },
            { week: 6, phase: 'React Development', title: 'Introduction to React', topics: ['What is React', 'Components and JSX', 'Props and composition', 'Project setup with Vite'], miniProject: 'Component Library', resources: ['React Official Docs', 'Vite Documentation'] },
            { week: 7, phase: 'React Development', title: 'React State & Hooks', topics: ['useState', 'useEffect', 'Event handling', 'Conditional rendering'], miniProject: 'Task Manager App', resources: ['React Hooks Documentation'] },
            { week: 8, phase: 'React Development', title: 'Routing & Full React Apps', topics: ['React Router', 'Multi-page applications', 'Shared layouts', 'UI libraries (shadcn/ui)'], miniProject: 'Personal Portfolio Website', resources: ['React Router Docs', 'shadcn/ui'] },
            { week: 9, phase: 'Mobile Development', title: 'Introduction to Mobile Development', topics: ['Native vs cross-platform', 'React Native basics', 'Expo setup', 'Mobile UI principles'], miniProject: 'Hello Mobile App', resources: ['React Native Docs', 'Expo Documentation'] },
            { week: 10, phase: 'Mobile Development', title: 'Mobile UI Components & Navigation', topics: ['Core React Native components', 'React Navigation', 'Forms and input', 'Platform-specific styling'], miniProject: 'Scripture Journal App', resources: ['React Navigation Docs', 'AsyncStorage'] },
            { week: 11, phase: 'Full Stack Integration', title: 'Backend Basics & Databases', topics: ['Backend fundamentals', 'Database basics', 'Supabase integration', 'Authentication'], miniProject: 'Backend-Enabled Portfolio', resources: ['Supabase Docs', 'SQL Tutorials'] },
            { week: 12, phase: 'Launch & Career', title: 'Deployment & Career Preparation', topics: ['Web deployment', 'Mobile publishing overview', 'Portfolio building', 'Job search strategies'], miniProject: 'Launch Day & Showcase', resources: ['Vercel', 'Netlify', 'Tech Interview Handbook'] },
          ],
        },
        maxCapacity: 40,
        instructorId: instructor4.id,
        instructorName: 'YSA Programming Academy Team',
        instructorProfileSlug: 'ysa-programming-academy',
        wardId: wards[0].id,
        createdById: adminUser.id,
        status: 'ACTIVE',
        totalLessons: 12,
        totalWeeks: 12,
        learningOutcomes: [
          'Understand how the web works and how frontend and backend systems interact',
          'Build responsive websites using HTML, CSS, Tailwind CSS, and modern design principles',
          'Write clean, modern JavaScript and work with APIs',
          'Build dynamic web applications using React',
          'Develop cross-platform mobile applications using React Native and Expo',
          'Integrate backend services, databases, and authentication',
          'Deploy web applications and prepare a professional developer portfolio',
          'Gain confidence for internships, freelance work, or entry-level developer roles',
        ],
        courseRequirements: [
          'Laptop capable of running development tools',
          'Basic computer literacy',
          'Willingness to practice outside class hours',
          'Stable internet access',
        ],
        toolsAndMaterials: [
          'VS Code',
          'Web browser (Chrome recommended)',
          'Node.js',
          'Git & GitHub',
          'Tailwind CSS',
          'React',
          'React Native',
          'Expo',
          'Supabase',
          'Vercel or Netlify',
        ],
        certificationIssued: true,
        certificationCriteria: 'Completion of weekly projects, final deployment, and active participation',
      },
    }),
  ]);
  console.log(`✓ Created ${classes.length} classes`);

  // Create Sample Enrollments
  console.log('Creating sample enrollments...');
  await Promise.all([
    prisma.enrollment.create({
      data: {
        classId: classes[0].id, // Mobile Photography
        studentId: students[0].id,
        status: ApprovalStatus.APPROVED,
        approvedAt: new Date(),
      },
    }),
    prisma.enrollment.create({
      data: {
        classId: classes[1].id, // Wig Making
        studentId: students[1].id,
        status: ApprovalStatus.APPROVED,
        approvedAt: new Date(),
      },
    }),
    prisma.enrollment.create({
      data: {
        classId: classes[3].id, // Programming
        studentId: students[2].id,
        status: ApprovalStatus.APPROVED,
        approvedAt: new Date(),
      },
    }),
    prisma.enrollment.create({
      data: {
        classId: classes[2].id, // Content Creation
        studentId: students[0].id,
        status: ApprovalStatus.PENDING,
      },
    }),
  ]);
  console.log('✓ Created sample enrollments');

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Admin: admin@church.org / Admin@123');
  console.log('   Instructor 1: kingsley.ugwumba@church.org / Instructor@123');
  console.log('   Instructor 2: divinegift.ogitie@church.org / Instructor@123');
  console.log('   Instructor 3: amara.okonkwo@church.org / Instructor@123');
  console.log('   Instructor 4: ysa.team@church.org / Instructor@123');
  console.log('   Student 1: student1@church.org / Student@123');
  console.log('   Student 2: student2@church.org / Student@123');
  console.log('   Student 3: student3@church.org / Student@123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
