import 'tsconfig-paths/register';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Updating class schedules with weekly lessons...');

  // Mobile Photography & Videography
  await prisma.class.updateMany({
    where: { name: 'Mobile Photography & Videography' },
    data: {
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
      }
    }
  });
  console.log('✓ Updated Mobile Photography & Videography');

  // Advanced Wig-Making
  await prisma.class.updateMany({
    where: { name: 'Advanced Wig-Making & Customization' },
    data: {
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
      }
    }
  });
  console.log('✓ Updated Advanced Wig-Making & Customization');

  // Content Creation Masterclass
  await prisma.class.updateMany({
    where: { name: 'Content Creation Masterclass' },
    data: {
      schedule: {
        days: ['Thursday'],
        time: '5:00 PM - 7:00 PM',
        weeklyLessons: [
          { week: 1, title: 'Introduction to Digital Media' },
          { week: 2, title: 'Personal Branding Basics' },
          { week: 3, title: 'Understanding Niches & Hooks' },
          { week: 4, title: 'Scriptwriting for Social Media' },
          { week: 5, title: 'Voice Note Content Creation' },
          { week: 6, title: 'Content Angles & Engagement' },
          { week: 7, title: 'Platform-Specific Content Strategy' },
          { week: 8, title: 'Content Calendar & Consistency' },
          { week: 9, title: 'Audience Growth Techniques' },
          { week: 10, title: 'Monetization Basics' },
          { week: 11, title: 'Analytics & Performance Tracking' },
          { week: 12, title: 'Final Project & Portfolio Review' }
        ]
      }
    }
  });
  console.log('✓ Updated Content Creation Masterclass');

  // YSA Programming Academy
  await prisma.class.updateMany({
    where: { name: 'YSA Programming Academy: Web & Mobile Development' },
    data: {
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
      }
    }
  });
  console.log('✓ Updated YSA Programming Academy');

  // Barbing for Beginners
  await prisma.class.updateMany({
    where: { name: 'Barbing Class for Beginners' },
    data: {
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
      }
    }
  });
  console.log('✓ Updated Barbing Class for Beginners');

  // Graphic Design Masterclass
  await prisma.class.updateMany({
    where: { name: 'Graphic Design Masterclass' },
    data: {
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
      }
    }
  });
  console.log('✓ Updated Graphic Design Masterclass');

  // Catering Fundamentals
  await prisma.class.updateMany({
    where: { name: 'Catering Fundamentals' },
    data: {
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
      }
    }
  });
  console.log('✓ Updated Catering Fundamentals');

  // Public Speaking
  await prisma.class.updateMany({
    where: { name: 'Public Speaking & Communication Skills' },
    data: {
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
      }
    }
  });
  console.log('✓ Updated Public Speaking & Communication Skills');

  console.log('\n✅ Successfully updated all 8 classes with weekly lessons!');
  console.log('📋 You can now view the schedules in Prisma Studio or use them in the frontend.');
}

main()
  .catch((e) => {
    console.error('❌ Error updating schedules:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
