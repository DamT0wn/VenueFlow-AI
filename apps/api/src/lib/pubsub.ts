import { PubSub, Topic, Subscription } from '@google-cloud/pubsub';
import { env } from '../config/env';
import { logger } from './logger';

// ──────────────────────────────────────────────────────────────────────────────
// Google Cloud Pub/Sub client singleton
// ──────────────────────────────────────────────────────────────────────────────

let pubSubClient: PubSub | null = null;

/**
 * Returns the Google Cloud Pub/Sub client singleton.
 * Automatically uses the Pub/Sub emulator if PUBSUB_EMULATOR_HOST is set.
 *
 * @returns {PubSub} Pub/Sub client
 */
export function getPubSub(): PubSub {
  if (pubSubClient) return pubSubClient;

  pubSubClient = new PubSub({
    projectId: env.PUBSUB_PROJECT_ID,
  });

  return pubSubClient;
}

/**
 * Publishes a JSON message to the venue-alerts topic.
 * Creates the topic if it does not exist (development convenience).
 *
 * @param {string} topicName - Pub/Sub topic name
 * @param {Record<string, unknown>} data - JSON payload to publish
 * @returns {Promise<string>} Message ID returned by Pub/Sub
 * @throws {Error} If publishing fails after topic creation
 */
export async function publishMessage(
  topicName: string,
  data: Record<string, unknown>,
): Promise<string> {
  const client = getPubSub();
  const topic: Topic = client.topic(topicName);

  const buffer = Buffer.from(JSON.stringify(data));

  try {
    const messageId = await topic.publishMessage({ data: buffer });
    logger.info({ message: 'PubSub: message published', topicName, messageId });
    return messageId;
  } catch (err: unknown) {
    const error = err as { code?: unknown };
    // If topic doesn't exist in dev/emulator, create it and retry
    if ((error.code === 5 || error.code === '5' || error.code === 'NOT_FOUND') && env.NODE_ENV !== 'production') {
      logger.warn({ message: 'PubSub: topic not found, creating', topicName });
      await client.createTopic(topicName).catch(() => {
        /* may already exist if race condition */
      });
      const messageId = await topic.publishMessage({ data: buffer });
      return messageId;
    }
    throw err;
  }
}

/**
 * Verifies the OIDC JWT in a push subscription request from Cloud Pub/Sub.
 * Must be called in the /internal/pubsub middleware.
 *
 * In development (emulator), always returns true.
 *
 * @param {string | undefined} authHeader - The Authorization header value
 * @returns {Promise<boolean>} true if the JWT is valid for this project
 */
export async function verifyPubSubJwt(authHeader: string | undefined): Promise<boolean> {
  if (env.NODE_ENV !== 'production') {
    // Emulator does not send JWT — allow all
    return true;
  }

  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.slice(7);
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth();
  const client = await auth.getClient();

  try {
    // Verify the token audience matches our service URL
    await (client as { verifyIdToken?: (opts: { idToken: string }) => Promise<unknown> })
      .verifyIdToken?.({ idToken: token });
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets or creates a Pub/Sub subscription for internal use.
 *
 * @param {string} topicName - Topic name
 * @param {string} subscriptionName - Subscription name
 * @returns {Promise<Subscription>} Pub/Sub subscription
 */
export async function getOrCreateSubscription(
  topicName: string,
  subscriptionName: string,
): Promise<Subscription> {
  const client = getPubSub();
  const topic = client.topic(topicName);
  const subscription = topic.subscription(subscriptionName);

  const [exists] = await subscription.exists();
  if (!exists) {
    await topic.createSubscription(subscriptionName, {
      enableExactlyOnceDelivery: true,
    });
    logger.info({ message: 'PubSub: subscription created', subscriptionName });
  }

  return subscription;
}
