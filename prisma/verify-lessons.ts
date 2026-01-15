import 'tsconfig-paths/register';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n📊 Lesson Database Summary\n');
  console.log('='.repeat(60));
  
  const lessons = await prisma.lesson.findMany({
    include: {
      class: {
        select: { name: true }
      }
    },
    orderBy: [
      { class: { name: 'asc' } },
      { weekNumber: 'asc' }
    ]
  });

  const totalLessons = lessons.length;
  const published = lessons.filter(l => l.isPublished).length;
  const drafts = totalLessons - published;

  console.log(`\n📚 Total Lessons: ${totalLessons}`);
  console.log(`✅ Published: ${published} (${((published/totalLessons)*100).toFixed(1)}%)`);
  console.log(`📝 Drafts: ${drafts} (${((drafts/totalLessons)*100).toFixed(1)}%)`);
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 Breakdown by Class:\n');

  const byClass: Record<string, { total: number; published: number; drafts: number }> = {};
  
  lessons.forEach(l => {
    const className = l.class.name;
    if (!byClass[className]) {
      byClass[className] = { total: 0, published: 0, drafts: 0 };
    }
    byClass[className].total++;
    if (l.isPublished) {
      byClass[className].published++;
    } else {
      byClass[className].drafts++;
    }
  });

  Object.entries(byClass)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([name, stats]) => {
      const publishedPercent = ((stats.published / stats.total) * 100).toFixed(0);
      console.log(`  ${name}`);
      console.log(`    Total: ${stats.total} | Published: ${stats.published} (${publishedPercent}%) | Drafts: ${stats.drafts}`);
      console.log('');
    });

  console.log('='.repeat(60));
  
  if (published === totalLessons) {
    console.log('\n✨ Perfect! All lessons are published and ready for students!\n');
  } else if (published > 0) {
    console.log(`\n⚠️  ${drafts} lesson(s) are still in draft mode.\n`);
  } else {
    console.log('\n❌ No lessons are published yet.\n');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
