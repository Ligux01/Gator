import { db } from "..";
import { feeds, users } from "../schema";
import { eq, sql } from "drizzle-orm";

export async function getNextFeedToFetch() {
  const [feed] = await db
    .select()
    .from(feeds)
    .orderBy(
      sql`${feeds.lastFetchedAt} ASC NULLS FIRST`
    )
    .limit(1);

  return feed;
}

export async function markFeedFetched(
  feedId: string
): Promise<void> {
  const now = new Date();

  await db
    .update(feeds)
    .set({
      lastFetchedAt: now,
      updatedAt: now,
    })
    .where(eq(feeds.id, feedId));
}

export async function getFeedByURL(url: string) {
  const [feed] = await db
    .select()
    .from(feeds)
    .where(eq(feeds.url, url));

  return feed;
}

export async function createFeed(
  name: string,
  url: string,
  userId: string
) {
  const [result] = await db
    .insert(feeds)
    .values({
      name,
      url,
      userId,
    })
    .returning();

  return result;
}

export async function getFeeds() {
  return await db
    .select({
      feedName: feeds.name,
      feedUrl: feeds.url,
      userName: users.name,
    })
    .from(feeds)
    .innerJoin(users, eq(feeds.userId, users.id));
}