/**
 * Class Reminder Scheduler Service
 * 
 * Sends push notifications to students:
 * - 1 day before their class
 * - 1 hour before their class
 * 
 * Uses node-cron to run periodic checks
 */

import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import pushNotificationService, { PushPayload } from './push.service';

const prisma = new PrismaClient();

/**
 * Parse schedule JSON to get class times
 */
function parseSchedule(schedule: any): { days: string[]; time: string } {
  if (typeof schedule === 'string') {
    try {
      schedule = JSON.parse(schedule);
    } catch {
      return { days: [], time: '' };
    }
  }
  return {
    days: schedule?.days || [],
    time: schedule?.time || '',
  };
}

/**
 * Get the next occurrence of a class
 */
function getNextClassTime(schedule: { days: string[]; time: string }): Date | null {
  if (!schedule.days.length || !schedule.time) return null;

  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  
  // Check each day in the schedule
  for (let daysAhead = 0; daysAhead <= 7; daysAhead++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + daysAhead);
    checkDate.setHours(hours || 9, minutes || 0, 0, 0);

    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    if (schedule.days.map((d: string) => d.toLowerCase()).includes(dayName)) {
      // If today, make sure the time hasn't passed
      if (daysAhead === 0 && checkDate <= now) {
        continue;
      }
      return checkDate;
    }
  }

  return null;
}

/**
 * Check and send 1-day reminders
 */
async function send1DayReminders(): Promise<void> {
  console.log('🔔 Checking for 1-day class reminders...');

  try {
    // Get all active classes with enrollments
    const classes = await prisma.class.findMany({
      where: { status: 'ACTIVE' },
      include: {
        enrollments: {
          where: { status: 'APPROVED' },
          include: {
            student: {
              include: { user: true },
            },
          },
        },
        lessons: {
          where: { isPublished: true },
          orderBy: { weekNumber: 'asc' },
          take: 1, // Get the first lesson for the title
        },
      },
    });

    const now = new Date();
    const reminderWindow = 30 * 60 * 1000; // 30 minute window
    const oneDayMs = 24 * 60 * 60 * 1000;

    let remindersSent = 0;

    for (const classItem of classes) {
      const schedule = parseSchedule(classItem.schedule);
      const nextClassTime = getNextClassTime(schedule);

      if (!nextClassTime) continue;

      // Check if class is approximately 1 day away (±30 min window)
      const timeDiff = nextClassTime.getTime() - now.getTime();

      if (timeDiff > oneDayMs - reminderWindow && timeDiff < oneDayMs + reminderWindow) {
        // Send reminder to all enrolled students
        for (const enrollment of classItem.enrollments) {
          const lessonTitle = classItem.lessons[0]?.title || 'scheduled class';
          
          const payload: PushPayload = {
            title: `📅 Class Tomorrow: ${classItem.name}`,
            body: `"${lessonTitle}" starts tomorrow at ${schedule.time}. Don't miss it!`,
            tag: `1day-${classItem.id}-${nextClassTime.toISOString().split('T')[0]}`,
            data: {
              type: 'CLASS_REMINDER_1_DAY',
              classId: classItem.id,
              classTime: nextClassTime.toISOString(),
              url: `/canvas/${classItem.id}`,
            },
            actions: [
              { action: 'view', title: 'View Class' },
            ],
          };

          const sent = await pushNotificationService.sendToUser(
            enrollment.student.userId,
            payload
          );
          
          if (sent > 0) {
            // Record that reminder was sent (if lesson exists)
            if (classItem.lessons[0]) {
              try {
                await prisma.scheduledReminder.create({
                  data: {
                    lessonId: classItem.lessons[0].id,
                    studentId: enrollment.studentId,
                    type: '1_DAY',
                  },
                });
              } catch (e) {
                // Ignore duplicate key errors
              }
            }
            remindersSent++;
          }
        }
      }
    }

    console.log(`✅ Sent ${remindersSent} 1-day reminders`);
  } catch (error) {
    console.error('Error sending 1-day reminders:', error);
  }
}

/**
 * Check and send 1-hour reminders
 */
async function send1HourReminders(): Promise<void> {
  console.log('🔔 Checking for 1-hour class reminders...');

  try {
    // Get all active classes with enrollments
    const classes = await prisma.class.findMany({
      where: { status: 'ACTIVE' },
      include: {
        enrollments: {
          where: { status: 'APPROVED' },
          include: {
            student: {
              include: { user: true },
            },
          },
        },
        lessons: {
          where: { isPublished: true },
          orderBy: { weekNumber: 'asc' },
          take: 1,
        },
      },
    });

    const now = new Date();
    const reminderWindow = 5 * 60 * 1000; // 5 minute window

    let remindersSent = 0;

    for (const classItem of classes) {
      const schedule = parseSchedule(classItem.schedule);
      const nextClassTime = getNextClassTime(schedule);

      if (!nextClassTime) continue;

      // Check if class is approximately 1 hour away (±5 min window)
      const timeDiff = nextClassTime.getTime() - now.getTime();
      const oneHourMs = 60 * 60 * 1000;

      if (timeDiff > oneHourMs - reminderWindow && timeDiff < oneHourMs + reminderWindow) {
        // Send reminder to all enrolled students
        for (const enrollment of classItem.enrollments) {
          const lessonTitle = classItem.lessons[0]?.title || 'your class';
          
          const payload: PushPayload = {
            title: `⏰ Class in 1 Hour: ${classItem.name}`,
            body: `"${lessonTitle}" starts at ${schedule.time}. Get ready!`,
            tag: `1hour-${classItem.id}-${nextClassTime.toISOString()}`,
            requireInteraction: true, // Make it persistent
            data: {
              type: 'CLASS_REMINDER_1_HOUR',
              classId: classItem.id,
              classTime: nextClassTime.toISOString(),
              url: `/canvas/${classItem.id}`,
            },
            actions: [
              { action: 'view', title: 'Join Now' },
            ],
          };

          const sent = await pushNotificationService.sendToUser(
            enrollment.student.userId,
            payload
          );
          
          if (sent > 0) {
            // Record that reminder was sent
            if (classItem.lessons[0]) {
              try {
                await prisma.scheduledReminder.create({
                  data: {
                    lessonId: classItem.lessons[0].id,
                    studentId: enrollment.studentId,
                    type: '1_HOUR',
                  },
                });
              } catch (e) {
                // Ignore duplicate key errors
              }
            }
            remindersSent++;
          }
        }
      }
    }

    console.log(`✅ Sent ${remindersSent} 1-hour reminders`);
  } catch (error) {
    console.error('Error sending 1-hour reminders:', error);
  }
}

/**
 * Initialize the reminder scheduler
 */
export function initializeReminderScheduler(): void {
  console.log('🕐 Initializing class reminder scheduler...');

  // Check for 1-day reminders every hour
  cron.schedule('0 * * * *', () => {
    send1DayReminders();
  });

  // Check for 1-hour reminders every 5 minutes
  cron.schedule('*/5 * * * *', () => {
    send1HourReminders();
  });

  // Run immediately on startup (with a slight delay)
  setTimeout(() => {
    send1DayReminders();
    send1HourReminders();
  }, 10000); // 10 second delay

  console.log('✅ Reminder scheduler initialized');
  console.log('   - 1-day reminders: checked every hour');
  console.log('   - 1-hour reminders: checked every 5 minutes');
}

export default {
  initializeReminderScheduler,
  send1DayReminders,
  send1HourReminders,
};
