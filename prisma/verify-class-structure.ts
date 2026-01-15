import 'tsconfig-paths/register';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Fetching class data from database...\n');

  const classes = await prisma.class.findMany({
    include: {
      instructor: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        }
      },
      ward: true,
    }
  });

  console.log(`📊 Found ${classes.length} classes in database\n`);
  console.log('='.repeat(80));

  classes.forEach((cls, index) => {
    console.log(`\n[${index + 1}] ${cls.name}`);
    console.log('-'.repeat(80));
    console.log(`ID: ${cls.id}`);
    console.log(`Category: ${cls.category}`);
    console.log(`Level: ${cls.level}`);
    console.log(`Total Weeks: ${cls.totalWeeks}`);
    console.log(`Instructor: ${cls.instructor?.user.firstName} ${cls.instructor?.user.lastName}`);
    console.log(`Ward: ${cls.ward.name}`);
    
    // Check schedule structure
    console.log('\n📅 Schedule Structure:');
    if (cls.schedule) {
      const schedule = cls.schedule as any;
      console.log(`   Days: ${schedule.days ? JSON.stringify(schedule.days) : 'Not set'}`);
      console.log(`   Time: ${schedule.time || 'Not set'}`);
      
      if (schedule.weeklyLessons && Array.isArray(schedule.weeklyLessons)) {
        console.log(`   ✅ Weekly Lessons: ${schedule.weeklyLessons.length} weeks configured`);
        
        // Show first 3 weeks as sample
        console.log('\n   Sample Weekly Lessons (First 3):');
        schedule.weeklyLessons.slice(0, 3).forEach((lesson: any) => {
          console.log(`      Week ${lesson.week}: ${lesson.title}`);
          if (lesson.objectives) {
            console.log(`         Objectives: ${lesson.objectives.length} items`);
          }
          if (lesson.activities) {
            console.log(`         Activities: ${lesson.activities.length} items`);
          }
          if (lesson.topics) {
            console.log(`         Topics: ${lesson.topics.length} items`);
          }
        });
      } else {
        console.log('   ❌ No weeklyLessons array found');
      }
    } else {
      console.log('   ❌ No schedule data');
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n📋 FRONTEND VERIFICATION CHECKLIST:');
  console.log('='.repeat(80));
  console.log('\n1. Instructor Modules Page:');
  console.log('   - URL: /canvas/instructor/class/{classId}/modules');
  console.log('   - Should fetch: GET /api/v1/classes/{classId}');
  console.log('   - Should display: schedule.weeklyLessons array');
  console.log('   - Properties needed: week, title, objectives, activities\n');
  
  console.log('2. Student Modules Page:');
  console.log('   - URL: /canvas/student/class/{classId}/modules');
  console.log('   - Should fetch: GET /api/v1/classes/{classId}');
  console.log('   - Should display: schedule.weeklyLessons array');
  console.log('   - Same structure as instructor view\n');

  console.log('3. Lessons API:');
  console.log('   - URL: GET /api/v1/lessons/class/{classId}');
  console.log('   - Returns: Lesson[] with weekNumber, title, description');
  console.log('   - Used for: Instructor-created custom lessons\n');

  console.log('\n📝 PRISMA MODEL ALIGNMENT:');
  console.log('='.repeat(80));
  console.log('\nClass model:');
  console.log('  - schedule: Json (contains days, time, weeklyLessons)');
  console.log('  - totalWeeks: Int');
  console.log('  - instructorId: String');
  console.log('\nLesson model:');
  console.log('  - weekNumber: Int (matches schedule.weeklyLessons[].week)');
  console.log('  - title: String');
  console.log('  - description: String?');
  console.log('  - isPublished: Boolean');
  console.log('  - courseMaterials: CourseMaterial[]');

  console.log('\n✅ Database query completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
