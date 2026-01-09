import 'tsconfig-paths/register';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Deleting all existing classes...');
  
  // Delete all class-related data first (due to foreign key constraints)
  await prisma.grade.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.class.deleteMany({});
  
  console.log('✓ Deleted all existing classes and related data');

  console.log('🌱 Seeding new class data...');

  // Get wards and instructors
  const lekkiWard = await prisma.ward.findUnique({ where: { name: 'Lekki Ward' } });
  const ajahWard = await prisma.ward.findUnique({ where: { name: 'Ajah Ward' } });
  const shangotedoWard = await prisma.ward.findUnique({ where: { name: 'Shangotedo Ward' } });

  if (!lekkiWard || !ajahWard || !shangotedoWard) {
    throw new Error('Required wards not found. Please run the main seed file first.');
  }

  // Get admin user for createdBy
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@church.org' } });
  
  if (!adminUser) {
    throw new Error('Admin user not found. Please run the main seed file first.');
  }

  // Get instructors
  const kingsleyUser = await prisma.user.findUnique({ where: { email: 'kingsley.ugwumba@church.org' } });
  const divineGiftUser = await prisma.user.findUnique({ where: { email: 'divinegift.ogitie@church.org' } });
  const amaraUser = await prisma.user.findUnique({ where: { email: 'amara.okonkwo@church.org' } });
  const davidUser = await prisma.user.findUnique({ where: { email: 'david.ogbaudu@church.org' } });
  const francisUser = await prisma.user.findUnique({ where: { email: 'francis.happy@church.org' } });
  const rachelUser = await prisma.user.findUnique({ where: { email: 'rachel.akpan@church.org' } });
  const amaraDorindaUser = await prisma.user.findUnique({ where: { email: 'amara.dorinda@church.org' } });

  if (!kingsleyUser || !divineGiftUser || !amaraUser || !davidUser || !francisUser || !rachelUser || !amaraDorindaUser) {
    throw new Error('Required instructor users not found. Please run the main seed file first.');
  }

  // Get instructor records
  const kingsleyInstructor = await prisma.instructor.findUnique({ where: { userId: kingsleyUser.id } });
  const divineGiftInstructor = await prisma.instructor.findUnique({ where: { userId: divineGiftUser.id } });
  const amaraInstructor = await prisma.instructor.findUnique({ where: { userId: amaraUser.id } });
  const davidInstructor = await prisma.instructor.findUnique({ where: { userId: davidUser.id } });
  const francisInstructor = await prisma.instructor.findUnique({ where: { userId: francisUser.id } });
  const rachelInstructor = await prisma.instructor.findUnique({ where: { userId: rachelUser.id } });
  const amaraDorindaInstructor = await prisma.instructor.findUnique({ where: { userId: amaraDorindaUser.id } });

  if (!kingsleyInstructor || !divineGiftInstructor || !amaraInstructor || !davidInstructor || !francisInstructor || !rachelInstructor || !amaraDorindaInstructor) {
    throw new Error('Required instructor records not found. Please run the main seed file first.');
  }

  // Mobile Photography & Videography
  const mobilePhotography = await prisma.class.create({
    data: {
      name: 'Mobile Photography & Videography',
      description: 'Learn mobile photography and videography using smartphones',
      overview: 'This course introduces beginners to the fundamentals of mobile photography and videography using smartphones. Students learn camera setup, composition, lighting, video stability, and professional editing using Canva and CapCut. The program combines theory with hands-on practice to help students create social-media-ready content.',
      category: 'Media & Content Creation',
      level: 'Beginner to advanced',
      mode: 'In-person / Practical',
      schedule: {
        days: ['Friday'],
        time: '5:00 PM - 7:00 PM',
        weeklyLessons: [
          { week: 1, title: 'Orientation & Fundamentals', objectives: ['Course introduction and expectations', 'Importance of mobile visual content'], activities: ['Instructor introductions', 'Reviewing examples of mobile content'] },
          { week: 2, title: 'Visual Storytelling Basics', objectives: ['Introduction to storytelling through lenses', 'Analyzing visual trends'], activities: ['Group discussion on viral content', 'Basic creative brainstorming'] },
          { week: 3, title: 'Introduction to Mobile Photography & Videography', objectives: ['Understand course structure', 'Explore smartphone camera interface'], activities: ['Camera tour', 'Exploring camera modes'] },
          { week: 4, title: 'Understanding Mobile Camera Settings', objectives: ['Learn focus, exposure, HDR, resolution, and stabilization'], activities: ['Adjust camera settings', 'Capture test photos and videos'] },
          { week: 5, title: 'Lighting Basics & Natural Light Techniques', objectives: ['Understand lighting positions and shadows'], activities: ['Indoor window-light practice', 'Outdoor lighting exercises'] },
          { week: 6, title: 'Angles & Composition Techniques', objectives: ['Apply rule of thirds, symmetry, and framing'], activities: ['Composition-based photo shooting'] },
          { week: 7, title: 'Mobile Videography Basics', objectives: ['Learn stable shooting and transitions'], activities: ['Record short clips using correct angles'] },
          { week: 8, title: 'Editing Photos with Canva', objectives: ['Apply filters and color correction'], activities: ['Edit multiple photos for social media'] },
          { week: 9, title: 'Editing Videos with CapCut', objectives: ['Learn cuts, transitions, text, and audio'], activities: ['Edit a short-form video'] },
          { week: 10, title: 'Colour Grading & Sound Choices', objectives: ['Enhance mood and audio quality'], activities: ['Color grading practice', 'Music synchronization'] },
          { week: 11, title: 'Creating Social Media Content', objectives: ['Understand platform-specific formats'], activities: ['Create a complete social media post'] },
          { week: 12, title: 'Assessment, Portfolio Review & Certification', objectives: ['Demonstrate skill mastery'], activities: ['Submit final photo and video project'] }
        ]
      },
      maxCapacity: 30,
      totalLessons: 12,
      totalWeeks: 12,
      learningOutcomes: [
        'Understand smartphone camera settings including focus, exposure, HDR, frame rate, and stabilization',
        'Capture clear, sharp, and well-composed photographs',
        'Record smooth and properly framed video clips',
        'Edit photos professionally using Canva',
        'Edit videos using CapCut including cuts, transitions, text, and music syncing',
        'Create content optimized for Instagram, TikTok, and YouTube'
      ],
      courseRequirements: [
        'Smartphone with a functional camera (Android or iPhone)',
        'Canva application installed',
        'CapCut application installed',
        'Access to good lighting or natural light',
        'Notebook for note-taking'
      ],
      toolsAndMaterials: [
        'Smartphone camera',
        'Canva app',
        'CapCut app',
        'Tripod or phone stabilizer (optional)',
        'LED or ring light (optional)',
        'Phone cleaning cloth'
      ],
      instructorName: 'Kingsley Peter Ugwumba (Spectra)',
      instructorProfileSlug: 'kingsley-ugwumba',
      certificationIssued: true,
      certificationCriteria: 'Completion of final assessment and submission of required projects',
      instructorId: kingsleyInstructor.id,
      wardId: lekkiWard.id,
      createdById: adminUser.id,
    }
  });

  // Advanced Wig-Making
  const wigMaking = await prisma.class.create({
    data: {
      name: 'Advanced Wig-Making & Customization',
      description: 'Professional wig-making techniques and customization',
      overview: 'This advanced course teaches professional wig-making techniques including lace identification, knot bleaching, lace tinting, hairline customization, bundle sewing, and salon-grade styling. Students complete a premium-quality wig from start to finish.',
      category: 'Fashion & Beauty',
      level: 'Intermediate to Advanced',
      mode: 'In-person / Practical',
      schedule: {
        days: ['Friday'],
        time: '5:00 PM - 7:00 PM',
        weeklyLessons: [
          { week: 1, title: 'Orientation & Safety Standards' },
          { week: 2, title: 'Introduction to Hair Textures & Quality' },
          { week: 3, title: 'Tools, Products & Lace Identification' },
          { week: 4, title: 'Bleaching Knots (Professional Method)' },
          { week: 5, title: 'Lace Tinting & Skin Tone Matching' },
          { week: 6, title: 'Advanced Plucking & Hairline Customization' },
          { week: 7, title: 'Sewing Bundles – Foundation' },
          { week: 8, title: 'Sewing Bundles – Completion' },
          { week: 9, title: 'Advanced Styling Techniques' },
          { week: 10, title: 'Complete Wig Assembly' },
          { week: 11, title: 'Professional Wig Finishing' },
          { week: 12, title: 'Final Assessment & Certification' }
        ]
      },
      maxCapacity: 20,
      totalLessons: 12,
      totalWeeks: 12,
      learningOutcomes: [
        'Identify professional wig-making tools and lace types',
        'Bleach knots safely and evenly',
        'Tint lace to match different skin tones',
        'Customize realistic hairlines using advanced plucking',
        'Sew bundles professionally',
        'Apply salon-grade styling techniques',
        'Complete a premium wig build independently'
      ],
      courseRequirements: [
        'Frontal or closure',
        '2–3 bundles of quality hair',
        'Mannequin head and tripod',
        'Sewing and ventilating tools',
        'Notebook for notes'
      ],
      toolsAndMaterials: [
        'HD or transparent lace',
        'Mannequin head with tripod',
        'Bundles of hair',
        'Needle, thread, scissors, T-pins',
        'Bleaching products',
        'Lace tint or foundation',
        'Hot comb and heat protectant'
      ],
      instructorName: 'Divine-gift Ogitie',
      instructorProfileSlug: 'divine-gift-ogite',
      certificationIssued: true,
      certificationCriteria: 'Successful completion of final wig build and instructor grading',
      instructorId: divineGiftInstructor.id,
      wardId: ajahWard.id,
      createdById: adminUser.id,
    }
  });

  // Content Creation Masterclass
  const contentCreation = await prisma.class.create({
    data: {
      name: 'Content Creation Masterclass',
      description: 'Master content creation across multiple platforms and niches',
      overview: 'This class teaches students how to create content across multiple niches, craft attention-grabbing hooks, write scripts, and produce voice-note-based content for social media platforms.',
      category: 'Digital Media',
      level: 'Beginner to Intermediate',
      mode: 'In-person',
      schedule: {
        days: ['Thursday'],
        time: '5:00 PM - 7:00 PM',
        weeklyLessons: [
          { week: 1, title: 'Introduction to Digital Media' },
          { week: 2, title: 'Personal Branding Basics' },
          { week: 3, title: 'Understanding Niches & Hooks' },
          { week: 4, title: 'Scriptwriting for Social Media' },
          { week: 5, title: 'Voice Note Content Creation' },
          { week: 6, title: 'Content Angles & Engagement' }
        ]
      },
      maxCapacity: 30,
      totalLessons: 12,
      totalWeeks: 12,
      learningOutcomes: [
        'Understand multiple content niches',
        'Create effective content hooks',
        'Write scripts for short-form platforms',
        'Produce engaging voice-note content',
        'Adapt content for different audiences'
      ],
      courseRequirements: [
        'Smartphone',
        'Internet access',
        'Notebook'
      ],
      toolsAndMaterials: [
        'Smartphone microphone',
        'Social media apps',
        'Quiet recording space'
      ],
      instructorName: 'Okonkwo Amara',
      instructorProfileSlug: 'amara-okonkwo',
      certificationIssued: true,
      certificationCriteria: 'Completion of weekly assignments',
      instructorId: amaraInstructor.id,
      wardId: shangotedoWard.id,
      createdById: adminUser.id,
    }
  });

  // YSA Programming Academy
  const programming = await prisma.class.create({
    data: {
      name: 'YSA Programming Academy: Web & Mobile Development',
      description: 'Comprehensive web and mobile development training',
      overview: 'A comprehensive programming course designed to take young single adults from beginner level to job-ready web and mobile developers. The program combines structured teaching, weekly hands-on projects, and real-world tools covering frontend, backend, mobile development, deployment, and career preparation.',
      category: 'Technology & Software Development',
      level: 'Beginner to Job-Ready',
      mode: 'In-person / Practical',
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
          { week: 12, phase: 'Launch & Career', title: 'Deployment & Career Preparation', topics: ['Web deployment', 'Mobile publishing overview', 'Portfolio building', 'Job search strategies'], miniProject: 'Launch Day & Showcase', resources: ['Vercel', 'Netlify', 'Tech Interview Handbook'] }
        ]
      },
      maxCapacity: 25,
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
        'Gain confidence for internships, freelance work, or entry-level developer roles'
      ],
      courseRequirements: [
        'Laptop capable of running development tools',
        'Basic computer literacy',
        'Willingness to practice outside class hours',
        'Stable internet access'
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
        'Vercel or Netlify'
      ],
      instructorName: 'David Ogbaudu',
      instructorProfileSlug: 'david-ogbaudu',
      certificationIssued: true,
      certificationCriteria: 'Completion of weekly projects, final deployment, and active participation',
      instructorId: davidInstructor.id,
      wardId: lekkiWard.id,
      createdById: adminUser.id,
    }
  });

  // Barbing for Beginners
  const barbing = await prisma.class.create({
    data: {
      name: 'Barbing Class for Beginners',
      description: 'Professional grooming and barbering skills',
      overview: 'This beginner barbering course introduces students to professional grooming skills, covering sanitation, tool handling, hair cutting techniques, beard grooming, and customer service.',
      category: 'Fashion & Grooming',
      level: 'Beginner',
      mode: 'In-person / Practical',
      schedule: {
        days: ['Thursday'],
        time: '5:00 PM - 6:00 PM',
        weeklyLessons: [
          { week: 1, title: 'Course Orientation & Safety Basics' },
          { week: 2, title: 'Workstation Setup & Hygiene' },
          { week: 3, title: 'Tools Identification & Maintenance' },
          { week: 4, title: 'Clipper Handling & Buzz Cuts' },
          { week: 5, title: 'Tapers & Blending Basics' },
          { week: 6, title: 'Fade Techniques (Low & Mid)' },
          { week: 7, title: 'Scissor Work & Trimming' },
          { week: 8, title: 'Detailing & Line-Up Techniques' },
          { week: 9, title: 'Beard & Moustache Grooming' },
          { week: 10, title: 'Popular Beginner Haircuts' },
          { week: 11, title: 'Client Consultation & Aftercare' },
          { week: 12, title: 'Final Assessment & Certification' }
        ]
      },
      maxCapacity: 15,
      totalLessons: 12,
      totalWeeks: 12,
      learningOutcomes: [
        'Understand hygiene, sanitation, and safety procedures',
        'Identify and maintain barbering tools',
        'Perform beginner haircuts including buzz cuts, tapers, and fades',
        'Execute beard trimming and shaping',
        'Communicate effectively with clients'
      ],
      courseRequirements: [
        'Barber chair or steady chair',
        'Starter barbering tool kit',
        'Good lighting and mirror',
        'Notebook'
      ],
      toolsAndMaterials: [
        'Clippers with guards',
        'Detail trimmers',
        'Scissors and thinning scissors',
        'Clipper combs',
        'Barber cape and neck brush',
        'Disinfectants and sanitizers'
      ],
      instructorName: 'Kingsley Peter Ugwumba (Spectra)',
      instructorProfileSlug: 'kingsley-ugwumba',
      certificationIssued: true,
      certificationCriteria: 'Successful completion of final haircut assessment',
      instructorId: kingsleyInstructor.id,
      wardId: lekkiWard.id,
      createdById: adminUser.id,
    }
  });

  // Graphic Design Masterclass
  const graphicDesign = await prisma.class.create({
    data: {
      name: 'Graphic Design Masterclass',
      description: 'Professional graphic design using Adobe tools',
      overview: 'A comprehensive graphic design program covering Photoshop and Illustrator, focusing on visual design, branding, typography, and portfolio development.',
      category: 'Design & Visual Communication',
      level: 'Beginner to Intermediate',
      mode: 'In-person / Practical',
      schedule: {
        days: ['Friday'],
        time: '5:00 PM - 7:00 PM',
        weeklyLessons: [
          { week: 1, title: 'Introduction to Graphic Design & Photoshop' },
          { week: 2, title: 'Layers & Selections' },
          { week: 3, title: 'Photo Retouching & Color Correction' },
          { week: 4, title: 'Typography & Layout Design' },
          { week: 5, title: 'Advanced Compositing & Blending' },
          { week: 6, title: 'Introduction to Adobe Illustrator' },
          { week: 7, title: 'Mastering the Pen Tool' },
          { week: 8, title: 'Color, Gradients & Patterns' },
          { week: 9, title: 'Typography & Logo Design' },
          { week: 10, title: 'Advanced Workflow (Illustrator + Photoshop)' },
          { week: 11, title: 'Portfolio & Career Development' },
          { week: 12, title: 'Final Review & Certification' }
        ]
      },
      maxCapacity: 25,
      totalLessons: 12,
      totalWeeks: 12,
      learningOutcomes: [
        'Edit and retouch images professionally',
        'Design social media graphics and posters',
        'Create vector logos and illustrations',
        'Apply typography and layout principles',
        'Build a professional design portfolio'
      ],
      courseRequirements: [
        'Laptop',
        'Adobe Photoshop',
        'Adobe Illustrator',
        'Notebook'
      ],
      toolsAndMaterials: [
        'Adobe Photoshop',
        'Adobe Illustrator',
        'Graphics tablet (optional)',
        'Stock image resources'
      ],
      instructorName: 'Francis Happy',
      instructorProfileSlug: 'francis-happy',
      certificationIssued: true,
      certificationCriteria: 'Submission of final portfolio project',
      instructorId: francisInstructor.id,
      wardId: lekkiWard.id,
      createdById: adminUser.id,
    }
  });

  // Catering Fundamentals
  const catering = await prisma.class.create({
    data: {
      name: 'Catering Fundamentals',
      description: 'Food preparation, hygiene, and catering business fundamentals',
      overview: 'This course introduces students to food preparation, hygiene, menu planning, catering operations, and food business fundamentals.',
      category: 'Hospitality & Food Services',
      level: 'Beginner',
      mode: 'In-person / Practical',
      schedule: {
        days: ['Thursday'],
        time: '5:00 PM - 7:00 PM',
        weeklyLessons: [
          { week: 1, title: 'Course Orientation & Kitchen Safety' },
          { week: 2, title: 'Food Hygiene & Sanitation' },
          { week: 3, title: 'Knife Skills & Food Prep' },
          { week: 4, title: 'Local Dishes Preparation' },
          { week: 5, title: 'Continental Dishes Basics' },
          { week: 6, title: 'Menu Planning' },
          { week: 7, title: 'Event Catering Workflow' },
          { week: 8, title: 'Food Presentation & Plating' },
          { week: 9, title: 'Costing & Pricing' },
          { week: 10, title: 'Small Catering Business Setup' },
          { week: 11, title: 'Customer Service & Management' },
          { week: 12, title: 'Final Practical Assessment' }
        ]
      },
      maxCapacity: 20,
      totalLessons: 12,
      totalWeeks: 12,
      learningOutcomes: [
        'Understand food hygiene and safety',
        'Prepare basic local and continental dishes',
        'Plan menus for events',
        'Manage catering workflow',
        'Understand food costing and pricing'
      ],
      courseRequirements: [
        'Apron',
        'Notebook',
        'Basic cooking tools'
      ],
      toolsAndMaterials: [
        'Cooking utensils',
        'Gas cooker',
        'Ingredients',
        'Food storage containers'
      ],
      instructorName: 'Rachel Akpan',
      instructorProfileSlug: 'rachel-akpan',
      certificationIssued: true,
      certificationCriteria: 'Successful completion of final cooking assessment',
      instructorId: rachelInstructor.id,
      wardId: lekkiWard.id,
      createdById: adminUser.id,
    }
  });

  // Public Speaking
  const publicSpeaking = await prisma.class.create({
    data: {
      name: 'Public Speaking & Communication Skills',
      description: 'Develop confidence and effective communication skills',
      overview: 'This course equips students with confidence, clarity, and effective communication skills for public speaking, presentations, and leadership.',
      category: 'Leadership & Personal Development',
      level: 'Beginner to Intermediate',
      mode: 'In-person',
      schedule: {
        days: ['Friday'],
        time: '6:00 PM - 7:00 PM',
        weeklyLessons: [
          { week: 1, title: 'Introduction to Public Speaking' },
          { week: 2, title: 'Confidence & Stage Presence' },
          { week: 3, title: 'Speech Structure & Flow' },
          { week: 4, title: 'Voice Control & Diction' },
          { week: 5, title: 'Body Language & Gestures' },
          { week: 6, title: 'Storytelling Techniques' },
          { week: 7, title: 'Audience Engagement' },
          { week: 8, title: 'Impromptu Speaking' },
          { week: 9, title: 'Presentation Skills' },
          { week: 10, title: 'Persuasive Speaking' },
          { week: 11, title: 'Leadership Communication' },
          { week: 12, title: 'Final Speech & Certification' }
        ]
      },
      maxCapacity: 30,
      totalLessons: 12,
      totalWeeks: 12,
      learningOutcomes: [
        'Overcome stage fright',
        'Structure effective speeches',
        'Communicate confidently',
        'Use voice and body language effectively',
        'Engage audiences'
      ],
      courseRequirements: [
        'Notebook',
        'Willingness to participate'
      ],
      toolsAndMaterials: [
        'Microphone',
        'Presentation slides',
        'Timer'
      ],
      instructorName: 'Amara Dorinda',
      instructorProfileSlug: 'amara-dorinda',
      certificationIssued: true,
      certificationCriteria: 'Delivery of final assessed speech',
      instructorId: amaraDorindaInstructor.id,
      wardId: shangotedoWard.id,
      createdById: adminUser.id,
    }
  });

  console.log('✅ Successfully seeded 8 classes:');
  console.log(`   - ${mobilePhotography.name}`);
  console.log(`   - ${wigMaking.name}`);
  console.log(`   - ${contentCreation.name}`);
  console.log(`   - ${programming.name}`);
  console.log(`   - ${barbing.name}`);
  console.log(`   - ${graphicDesign.name}`);
  console.log(`   - ${catering.name}`);
  console.log(`   - ${publicSpeaking.name}`);
}

main()
  .catch((e) => {
    console.error('Error seeding classes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
