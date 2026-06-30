import { Resend } from 'resend';
import webpush from 'web-push';
import { env } from '../config/env.js';
import { NotificationService } from '../services/NotificationService.js';

const resend = new Resend(env.RESEND_API_KEY || 're_mock_key');

// Setup Web Push
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

export async function handleSendEmail(data: any) {
  const { to, name, type, payload } = data;
  
  if (!env.RESEND_API_KEY) {
    console.log(`[Mock Email] To: ${to}, Subject: Community Hero Update. Message: ${NotificationService.formatMessage(type, payload)}`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'Community Hero <updates@community-hero.org>',
      to,
      subject: `Update on Community Hero: ${type}`,
      html: `
        <div style="font-family: sans-serif; max-w-md: 600px; margin: 0 auto; padding: 20px;">
          <h2>Hello ${name || 'Citizen'},</h2>
          <p>${NotificationService.formatMessage(type, payload)}</p>
          <a href="${env.API_CORS_ORIGIN}/issues/${payload.issueId}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">View on Platform</a>
        </div>
      `
    });
  } catch (err) {
    console.error('Failed to send email via Resend:', err);
    throw err;
  }
}

export async function handleSendPush(data: any) {
  const { subscriptions, type, payload } = data;

  if (!env.VAPID_PUBLIC_KEY) {
    console.log(`[Mock Push] To ${subscriptions.length} devices. Payload:`, payload);
    return;
  }

  const pushPayload = JSON.stringify({
    title: 'Community Hero Update',
    body: NotificationService.formatMessage(type, payload),
    url: `/issues/${payload.issueId}`
  });

  const promises = subscriptions.map((sub: any) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth
      }
    };
    return webpush.sendNotification(pushSubscription, pushPayload).catch(err => {
      console.error(`Failed to send push to ${sub.endpoint}:`, err);
    });
  });

  await Promise.all(promises);
}

export async function handleWeeklyDigest(data: any) {
  console.log('Executing weekly digest for:', data.ward);
}
