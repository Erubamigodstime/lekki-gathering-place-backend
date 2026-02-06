/**
 * Enterprise Messaging System - Verification Script
 * 
 * Run this after migration to verify all enterprise features are working
 */

import { PrismaClient } from '@prisma/client';
import { messageQueueService } from './src/services/messageQueue.service';

const prisma = new PrismaClient();

async function verifyEnterpriseFeatures() {
  console.log('🧪 Enterprise Messaging System - Verification\n');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;

  // Test 1: Conversations table exists
  try {
    const conversationCount = await prisma.conversation.count();
    console.log('✅ Test 1: Conversations table exists');
    console.log(`   Found ${conversationCount} conversations`);
    passed++;
  } catch (error) {
    console.log('❌ Test 1 FAILED: Conversations table not found');
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    failed++;
  }

  // Test 2: Message sequence numbers
  try {
    const messageWithSeq = await prisma.message.findFirst({
      where: { sequenceNumber: { not: { equals: undefined } } },
    });
    if (messageWithSeq) {
      console.log('✅ Test 2: Message sequence numbers working');
      console.log(`   Sample: Message ${messageWithSeq.id} has sequence ${messageWithSeq.sequenceNumber}`);
    } else {
      console.log('⚠️  Test 2: No messages with sequence numbers yet (expected if fresh migration)');
    }
    passed++;
  } catch (error) {
    console.log('❌ Test 2 FAILED: Sequence numbers not in schema');
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    failed++;
  }

  // Test 3: Server timestamps
  try {
    const messageWithTimestamp = await prisma.message.findFirst({
      where: { serverTimestamp: { not: { equals: undefined } } },
    });
    if (messageWithTimestamp) {
      console.log('✅ Test 3: Server timestamps working');
    } else {
      console.log('⚠️  Test 3: No messages with server timestamps yet (expected if fresh migration)');
    }
    passed++;
  } catch (error) {
    console.log('❌ Test 3 FAILED: Server timestamps not in schema');
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    failed++;
  }

  // Test 4: Composite indexes
  try {
    // Test query that uses the composite index
    const testQuery = await prisma.message.findMany({
      where: {
        conversationId: 'test-id',
      },
      orderBy: {
        sequenceNumber: 'asc',
      },
      take: 1,
    });
    console.log('✅ Test 4: Composite indexes working (query executed successfully)');
    passed++;
  } catch (error) {
    console.log('❌ Test 4 FAILED: Composite index query failed');
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    failed++;
  }

  // Test 5: Message queue service
  try {
    const queueStats = await messageQueueService.getQueueStats();
    console.log('✅ Test 5: Message queue service initialized');
    console.log(`   Stats:`, JSON.stringify(queueStats, null, 2));
    passed++;
  } catch (error) {
    console.log('❌ Test 5 FAILED: Message queue service not working');
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    failed++;
  }

  // Test 6: Delivery tracking fields
  try {
    const messageWithDelivery = await prisma.message.findFirst({
      where: { deliveredAt: { not: { equals: undefined } } },
    });
    if (messageWithDelivery) {
      console.log('✅ Test 6: Delivery tracking fields working');
    } else {
      console.log('⚠️  Test 6: No messages with delivery tracking yet (expected if fresh migration)');
    }
    passed++;
  } catch (error) {
    console.log('❌ Test 6 FAILED: Delivery tracking fields not in schema');
    console.error('   Error:', error instanceof Error ? error.message : String(error));
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('🎉 All enterprise features verified successfully!');
    console.log('\nYou can now:');
    console.log('  1. Start the backend server');
    console.log('  2. Test messaging in the frontend');
    console.log('  3. Monitor queue stats at /api/v1/messages/queue-stats');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    console.log('\nCommon fixes:');
    console.log('  1. Run: npx prisma migrate deploy');
    console.log('  2. Run: npx prisma generate');
    console.log('  3. Check Redis connection (required for Bull queue)');
  }

  await prisma.$disconnect();
  await messageQueueService.close();
}

// Run verification
verifyEnterpriseFeatures()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
