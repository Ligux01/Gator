import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../index";
import { feeds, posts, Post } from "../schema";

export async function createPost(
  title: string,
  url: string,
  description: string | null,
  publishedAt: Date | null,
  feedId: string
): Promise<Post> {
  const [post] = await db
    .insert(posts)
    .values({
      title,
      url,
      description,
      publishedAt,
      feedId,
    })
    .returning();

  return post;
}

export async function getPostsForUser(
  userId: string,
  limit: number
): Promise<Post[]> {
  const userFeeds = await db
    .select({ id: feeds.id })
    .from(feeds)
    .where(eq(feeds.userId, userId));

  const feedIds = userFeeds.map((feed) => feed.id);

  if (feedIds.length === 0) {
    return [];
  }

  return await db
    .select()
    .from(posts)
    .where(inArray(posts.feedId, feedIds))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}