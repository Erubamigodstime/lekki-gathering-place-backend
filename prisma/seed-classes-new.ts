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
  console.log('ℹ️  Classes will be created WITHOUT instructors');
  console.log('ℹ️  Instructors will be assigned when they register and select their class');

  // Get wards
  const lekkiWard = await prisma.ward.findUnique({ where: { name: 'Lekki Ward' } });
  const ajahWard = await prisma.ward.findUnique({ where: { name: 'Ajah Ward' } });
  const shangotedoWard = await prisma.ward.findUnique({ where: { name: 'Shangotedo Ward' } });

  if (!lekkiWard || !ajahWard || !shangotedoWard) {
    throw new Error('Required wards not found. Please run the main seed file first.');
  }

  const classes = [
    // Mobile Photography & Videography
    {
      name: 'Mobile Photography & Videography',
      description: 'Learn professional mobile photography and videography using smartphones',
      overview: 'This course introduces beginners to the fundamentals of mobile photography and videography using smartphones. Students learn camera setup, composition, lighting, video stability, and professional editing using Canva and CapCut. The program combines theory with hands-on practice to help students create social-media-ready content.',
      category: 'Media & Content Creation',
      level: 'Beginner to Advanced',
      mode: 'In-person / Practical',
      schedule: {
        days: ['Friday'],
        time: '5:00 PM - 7:00 PM'
      },
      maxCapacity: 30,
      totalLessons: 12,
      totalWeeks: 12,
      wardId: lekkiWard.id,
      instructorName: 'Kingsley Peter Ugwumba (Spectra)',
      instructorProfileSlug: 'kingsley-ugwumba',
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
      certificationIssued: true,
      certificationCriteria: 'Completion of final assessment and submission of required projects'
    },
    // Advanced Wig-Making
    {
      name: 'Advanced Wig-Making & Customization',
      description: 'Master professional wig-making techniques from start to finish',
      overview: 'This advanced course teaches professional wig-making techniques including lace identification, knot bleaching, lace tinting, hairline customization, bundle sewing, and salon-grade styling. Students complete a premium-quality wig from start to finish.',
      category: 'Fashion & Beauty',
      level: 'Intermediate to Advanced',
      mode: 'In-person / Practical',
      schedule: {
        days: ['Friday'],
        time: '5:00 PM - 7:00 PM'
      },
      maxCapacity: 20,
      totalLessons: 12,
      totalWeeks: 12,
      wardId: ajahWard.id,
      instructorName: 'Divine-gift Ogitie',
      instructorProfileSlug: 'divine-gift-ogite',
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
      certificationIssued: true,
      certificationCriteria: 'Successful completion of final wig build and instructor grading'
    },
    // Content Creation Masterclass
    {
      name: 'Content Creation Masterclass',
      description: 'Create engaging content across multiple niches and platforms',
      overview: 'This class teaches students how to create content across multiple niches, craft attention-grabbing hooks, write scripts, and produce voice-note-based content for social media platforms.',
      category: 'Digital Media',
      level: 'Beginner to Intermediate',
      mode: 'In-person',
      schedule: {
        days: ['Thursday'],
        time: '5:00 PM - 7:00 PM'
      },
      maxCapacity: 40,
      totalLessons: 12,
      totalWeeks: 12,
      wardId: lekkiWard.id,
      instructorName: 'Okonkwo Amara',
      instructorProfileSlug: 'amara-okonkwo',
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
      certificationIssued: true,
      certificationCriteria: 'Completion of weekly assignments'
    },
    // YSA Programming Academy
    {
      name: 'YSA Programming Academy: Web & Mobile Development',
      description: 'From beginner to job-ready web and mobile developer',
      overview: 'A comprehensive programming course designed to take young single adults from beginner level to job-ready web and mobile developers. The program combines structured teaching, weekly hands-on projects, and real-world tools covering frontend, backend, mobile development, deployment, and career preparation.',
      category: 'Technology & Software Development',
      level: 'Beginner to Job-Ready',
      mode: 'In-person / Practical',
      schedule: {
        days: ['Thursday'],
        time: '5:00 PM - 7:00 PM'
      },
      maxCapacity: 25,
      totalLessons: 12,
      totalWeeks: 12,
      wardId: lekkiWard.id,
      instructorName: 'David Ogbaudu',
      instructorProfileSlug: 'david-ogbaudu',
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
      certificationIssued: true,
      certificationCriteria: 'Completion of weekly projects, final deployment, and active participation'
    },
    // Barbing for Beginners
    {
      name: 'Barbing Class for Beginners',
      description: 'Learn professional barbering and grooming skills',
      overview: 'This beginner barbering course introduces students to professional grooming skills, covering sanitation, tool handling, hair cutting techniques, beard grooming, and customer service.',
      category: 'Fashion & Grooming',
      level: 'Beginner',
      mode: 'In-person / Practical',
      schedule: {
        days: ['Thursday'],
        time: '5:00 PM - 6:00 PM'
      },
      maxCapacity: 15,
      totalLessons: 12,
      totalWeeks: 12,
      wardId: lekkiWard.id,
      instructorName: 'Kingsley Peter Ugwumba (Spectra)',
      instructorProfileSlug: 'kingsley-ugwumba',
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
      certificationIssued: true,
      certificationCriteria: 'Successful completion of final haircut assessment'
    },
    // Graphic Design Masterclass
    {
      name: 'Graphic Design Masterclass',
      description: 'Master Photoshop and Illustrator for professional design',
      overview: 'A comprehensive graphic design program covering Photoshop and Illustrator, focusing on visual design, branding, typography, and portfolio development.',
      category: 'Design & Visual Communication',
      level: 'Beginner to Intermediate',
      mode: 'In-person / Practical',
      schedule: {
        days: ['Friday'],
        time: '5:00 PM - 7:00 PM'
      },
      maxCapacity: 30,
      totalLessons: 12,
      totalWeeks: 12,
      wardId: lekkiWard.id,
      instructorName: 'Francis Happy',
      instructorProfileSlug: 'francis-happy',
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
      certificationIssued: true,
      certificationCriteria: 'Submission of final portfolio project'
    },
    // Catering Fundamentals
    {
      name: 'Catering Fundamentals',
      description: 'Learn food preparation, hygiene, and catering business basics',
      overview: 'This course introduces students to food preparation, hygiene, menu planning, catering operations, and food business fundamentals.',
      category: 'Hospitality & Food Services',
      level: 'Beginner',
      mode: 'In-person / Practical',
      schedule: {
        days: ['Thursday'],
        time: '5:00 PM - 7:00 PM'
      },
      maxCapacity: 20,
      totalLessons: 12,
      totalWeeks: 12,
      wardId: lekkiWard.id,
      instructorName: 'Rachel Akpan',
      instructorProfileSlug: 'rachel-akpan',
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
      certificationIssued: true,
      certificationCriteria: 'Successful completion of final cooking assessment'
    },
    // Public Speaking
    {
      name: 'Public Speaking & Communication Skills',
      description: 'Build confidence and master effective communication',
      overview: 'This course equips students with confidence, clarity, and effective communication skills for public speaking, presentations, and leadership.',
      category: 'Leadership & Personal Development',
      level: 'Beginner to Intermediate',
      mode: 'In-person',
      schedule: {
        days: ['First Friday of every month'],
        time: '6:00 PM - 7:00 PM'
      },
      maxCapacity: 50,
      totalLessons: 12,
      totalWeeks: 12,
      wardId: shangotedoWard.id,
      instructorName: 'Amara Dorinda',
      instructorProfileSlug: 'amara-dorinda',
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
      certificationIssued: true,
      certificationCriteria: 'Delivery of final assessed speech'
    }
  ];

  console.log(`Creating ${classes.length} classes...`);
  
  for (const classItem of classes) {
    const createdClass = await prisma.class.create({
      data: classItem
    });
    console.log(`✓ Created: ${createdClass.name}`);
  }

  console.log(`\n✨ Successfully seeded ${classes.length} classes!`);
  console.log('\n📋 Next steps:');
  console.log('1. Instructors register on the platform');
  console.log('2. During registration, they select which class(es) they teach');
  console.log('3. System validates and assigns them to the correct class');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding classes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
