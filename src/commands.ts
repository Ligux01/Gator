import { readConfig, setUser } from "./config";

import {
  createUser,
  getUserByName,
  deleteAllUsers,
  getUsers,
} from "./lib/db/queries/users";

import {
  createFeed,
  getFeeds,
  getFeedByURL,
  getNextFeedToFetch,
  markFeedFetched,
} from "./lib/db/queries/feed";

import {
  Feed,
  User,
} from "./lib/db/schema";

import {
  createFeedFollow,
  getFeedFollowsForUser,
  deleteFeedFollow,
} from "./lib/db/queries/feedFollows";

import { fetchFeed } from "./lib/rss";

export async function handlerBrowse(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const config = readConfig();

  if (!config.currentUserName) {
    throw new Error("no user is currently logged in");
  }

  const user = await getUserByName(config.currentUserName);

  if (!user) {
    throw new Error(`user ${config.currentUserName} not found`);
  }

  const limit = args.length > 0 ? Number(args[0]) : 2;

  if (Number.isNaN(limit) || limit <= 0) {
    throw new Error("limit must be a positive number");
  }

  const posts = await getPostsForUser(user.id, limit);

  for (const post of posts) {
    console.log(`Title: ${post.title}`);
    console.log(`URL: ${post.url}`);
    console.log(`Published: ${post.publishedAt}`);
    console.log();
  }
}

export function parseDuration(
  durationStr: string
): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error(
      "invalid duration: use ms, s, m, or h"
    );
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return value;

    case "s":
      return value * 1000;

    case "m":
      return value * 60 * 1000;

    case "h":
      return value * 60 * 60 * 1000;

    default:
      throw new Error("invalid duration unit");
  }
}

export async function scrapeFeeds(): Promise<void> {
  const feed = await getNextFeedToFetch();

  if (!feed) {
    console.log("No feeds found");
    return;
  }

  console.log(`Fetching ${feed.name}...`);

  const rssFeed = await fetchFeed(feed.url);

  await markFeedFetched(feed.id);

  for (const item of rssFeed.channel.item) {
    console.log(item.title);
  }
}

export async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 1) {
    throw new Error("usage: unfollow <url>");
  }

  const url = args[0];

  await deleteFeedFollow(user.id, url);

  console.log(`Unfollowed ${url}`);
}

export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export function middlewareLoggedIn(
  handler: UserCommandHandler
): CommandHandler {
  return async (
    cmdName: string,
    ...args: string[]
  ): Promise<void> => {
    const config = readConfig();

    if (!config.currentUserName) {
      throw new Error("no user is currently logged in");
    }

    const user = await getUserByName(
      config.currentUserName
    );

    if (!user) {
      throw new Error(
        `User ${config.currentUserName} not found`
      );
    }

    await handler(cmdName, user, ...args);
  };
}

export async function handlerLogin(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("username is required");
  }

  const username = args[0];

  const user = await getUserByName(username);

  if (!user) {
    throw new Error(`user ${username} does not exist`);
  }

  setUser(username);

  console.log(`User has been set to ${username}`);
}

export async function handlerRegister(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("username is required");
  }

  const username = args[0];

  const existingUser = await getUserByName(username);

  if (existingUser) {
    throw new Error(`user ${username} already exists`);
  }

  const user = await createUser(username);

  setUser(username);

  console.log(`User ${username} was created`);
  console.log(user);
}

export async function handlerUsers(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const allUsers = await getUsers();

  const config = readConfig();

  for (const user of allUsers) {
    if (user.name === config.currentUserName) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
}

export async function handlerReset(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  await deleteAllUsers();

  console.log("Data reset successfully");
}
export async function handlerAgg(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length < 1) {
    throw new Error("usage: agg <time_between_reqs>");
  }

  const durationStr = args[0];
  const timeBetweenRequests =
    parseDuration(durationStr);

  console.log(
    `Collecting feeds every ${durationStr}`
  );

  const handleError = (err: unknown) => {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error("Unknown error");
    }
  };

  scrapeFeeds().catch(handleError);

  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log(
        "\nShutting down feed aggregator..."
      );

      clearInterval(interval);
      resolve();
    });
  });
}

export async function handlerFeeds(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const allFeeds = await getFeeds();

  for (const feed of allFeeds) {
    console.log(`Name: ${feed.feedName}`);
    console.log(`URL: ${feed.feedUrl}`);
    console.log(`User: ${feed.userName}`);
    console.log();
  }
}

export function printFeed(
  feed: Feed,
  user: User
): void {
  console.log(`ID: ${feed.id}`);
  console.log(`Created At: ${feed.createdAt}`);
  console.log(`Updated At: ${feed.updatedAt}`);
  console.log(`Name: ${feed.name}`);
  console.log(`URL: ${feed.url}`);
  console.log(`User: ${user.name}`);
}


export async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 2) {
    throw new Error("usage: addfeed <name> <url>");
  }

  const [name, url] = args;

  const feed = await createFeed(
    name,
    url,
    user.id
  );

  const follow = await createFeedFollow(
    user.id,
    feed.id
  );

  printFeed(feed, user);

  console.log(
    `${follow.userName} is now following ${follow.feedName}`
  );
}


export async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 1) {
    throw new Error("usage: follow <url>");
  }

  const url = args[0];

  const feed = await getFeedByURL(url);

  if (!feed) {
    throw new Error(`feed not found: ${url}`);
  }

  const follow = await createFeedFollow(
    user.id,
    feed.id
  );

  console.log(
    `${follow.userName} is now following ${follow.feedName}`
  );
}

export async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  const follows = await getFeedFollowsForUser(
    user.id
  );

  for (const follow of follows) {
    console.log(follow.feedName);
  }
}

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
): void {
  registry[cmdName] = handler;
}

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`unknown command: ${cmdName}`);
  }

  await handler(cmdName, ...args);
}