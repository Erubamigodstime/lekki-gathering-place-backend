/**
 * Backfill Conversations table from existing Messages
 * 
 * This script:
 * 1. Finds all unique DIRECT message conversations
 * 2. Creates Conversation records for each unique pair
 * 3. Calculates metadata (lastMessage, messageCount, sequence)
 * 4. Updates existing messages with conversationId
 */

import { PrismaClient, MessageType } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillConversations() {
  console.log('🔄 Starting conversation backfill...\n');

  try {
    // Get all DIRECT messages grouped by sender/receiver pairs
    const messages = await prisma.message.findMany({
      where: {
        type: MessageType.DIRECT,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    console.log(`📊 Found ${messages.length} DIRECT messages to process\n`);

    // Group messages by conversation (unique pairs)
    const conversationMap = new Map<string, any[]>();

    messages.forEach((message) => {
      if (!message.receiverId) return;

      // Create a consistent key for the conversation (sorted IDs)
      const [participant1, participant2] = [message.senderId, message.receiverId].sort();
      const conversationKey = `${participant1}_${participant2}`;

      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, []);
      }

      conversationMap.get(conversationKey)!.push(message);
    });

    console.log(`🔍 Found ${conversationMap.size} unique conversations\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Process each conversation
    for (const [conversationKey, conversationMessages] of conversationMap.entries()) {
      const [participant1Id, participant2Id] = conversationKey.split('_');

      // Get the last message
      const lastMessage = conversationMessages[conversationMessages.length - 1];
      const messageCount = conversationMessages.length;

      try {
        // Check if conversation already exists
        const existing = await prisma.conversation.findUnique({
          where: {
            participant1Id_participant2Id: {
              participant1Id,
              participant2Id,
            },
          },
        });

        let conversation;

        if (existing) {
          console.log(`⏭️  Conversation already exists: ${participant1Id} ↔️ ${participant2Id}`);
          conversation = existing;
          skipped++;
        } else {
          // Create conversation record
          conversation = await prisma.conversation.create({
            data: {
              participant1Id,
              participant2Id,
              lastMessageAt: lastMessage.createdAt,
              lastMessagePreview: lastMessage.content.substring(0, 100),
              lastMessageSenderId: lastMessage.senderId,
              messageCount,
              currentSequence: messageCount,
              participant1LastRead: 0,
              participant2LastRead: 0,
            },
          });

          console.log(
            `✅ Created conversation ${created + 1}: ${participant1Id} ↔️ ${participant2Id} (${messageCount} messages)`
          );
          created++;
        }

        // Update all messages in this conversation with the conversationId and sequence numbers
        let sequenceNumber = 1;
        for (const message of conversationMessages) {
          await prisma.message.update({
            where: { id: message.id },
            data: {
              conversationId: conversation.id,
              sequenceNumber,
            },
          });
          sequenceNumber++;
        }

        updated += conversationMessages.length;
      } catch (error: any) {
        console.error(`❌ Error processing conversation ${conversationKey}:`, error.message);
      }
    }

    console.log('\n📊 Backfill Summary:');
    console.log(`   ✅ Conversations created: ${created}`);
    console.log(`   ⏭️  Conversations skipped (already exist): ${skipped}`);
    console.log(`   🔄 Messages updated: ${updated}`);
    console.log('\n✨ Backfill completed successfully!');
  } catch (error) {
    console.error('\n❌ Fatal error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backfill
backfillConversations()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Backfill failed:', error);
    process.exit(1);
  });
