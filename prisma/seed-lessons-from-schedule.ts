import 'tsconfig-paths/register';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Creating published lessons from weekly schedules...');

  // Get all classes with weekly lesson schedules
  const classes = await prisma.class.findMany({
    where: {
      schedule: {
        path: ['weeklyLessons'],
        not: null,
      },
    },
  });

  console.log(`Found ${classes.length} classes with weekly schedules`);

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const classItem of classes) {
    const schedule = classItem.schedule as any;
    const weeklyLessons = schedule?.weeklyLessons || [];

    if (weeklyLessons.length === 0) {
      console.log(`⚠️  ${classItem.name}: No weekly lessons in schedule`);
      continue;
    }

    console.log(`\n📚 Processing: ${classItem.name} (${weeklyLessons.length} weeks)`);

    for (const weekData of weeklyLessons) {
      const weekNumber = weekData.week;
      
      // Check if lesson already exists
      const existingLesson = await prisma.lesson.findUnique({
        where: {
          classId_weekNumber: {
            classId: classItem.id,
            weekNumber: weekNumber,
          },
        },
      });

      if (existingLesson) {
        console.log(`   ⏭️  Week ${weekNumber}: Already exists (${existingLesson.title})`);
        totalSkipped++;
        continue;
      }

      // Build comprehensive description from schedule data
      let description = '';
      
      if (weekData.phase) {
        description += `Phase: ${weekData.phase}\n\n`;
      }

      if (weekData.objectives && weekData.objectives.length > 0) {
        description += '📋 Learning Objectives:\n';
        weekData.objectives.forEach((obj: string) => {
          description += `• ${obj}\n`;
        });
        description += '\n';
      }

      if (weekData.topics && weekData.topics.length > 0) {
        description += '📖 Topics Covered:\n';
        weekData.topics.forEach((topic: string) => {
          description += `• ${topic}\n`;
        });
        description += '\n';
      }

      if (weekData.activities && weekData.activities.length > 0) {
        description += '🎯 Activities:\n';
        weekData.activities.forEach((act: string) => {
          description += `• ${act}\n`;
        });
        description += '\n';
      }

      if (weekData.miniProject) {
        description += `💡 Mini Project: ${weekData.miniProject}\n\n`;
      }

      if (weekData.resources && weekData.resources.length > 0) {
        description += '📚 Resources:\n';
        weekData.resources.forEach((resource: string) => {
          description += `• ${resource}\n`;
        });
      }

      // Create the lesson with isPublished = true
      try {
        const newLesson = await prisma.lesson.create({
          data: {
            classId: classItem.id,
            weekNumber: weekNumber,
            title: weekData.title || `Week ${weekNumber}`,
            description: description.trim() || `Lesson content for Week ${weekNumber}`,
            completionRequired: true,
            orderIndex: weekNumber - 1,
            isPublished: true, // ✅ Published by default
          },
        });

        console.log(`   ✅ Week ${weekNumber}: Created and published - "${newLesson.title}"`);
        totalCreated++;
      } catch (error) {
        console.error(`   ❌ Week ${weekNumber}: Failed to create - ${error}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Lesson creation complete!`);
  console.log(`   📝 Created: ${totalCreated} lessons`);
  console.log(`   ⏭️  Skipped: ${totalSkipped} lessons (already exist)`);
  console.log('='.repeat(60));
  console.log('\n💡 All lessons are published and ready for instructors to:');
  console.log('   • Add course materials (PDFs, videos, documents)');
  console.log('   • Edit content and descriptions');
  console.log('   • Unpublish if needed for future editing\n');
}

main()
  .catch((e) => {
    console.error('❌ Error creating lessons:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
