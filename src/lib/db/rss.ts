import { XMLParser } from "fast-xml-parser";

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  if (!response.ok) {
    throw new Error(`failed to fetch feed: ${response.status}`);
  }

  const xml = await response.text();

  const parser = new XMLParser({
    processEntities: false,
  });

  const parsed = parser.parse(xml);

  const channel = parsed?.rss?.channel;

  if (!channel || typeof channel !== "object") {
    throw new Error("RSS feed does not contain a channel");
  }

  if (
    typeof channel.title !== "string" ||
    typeof channel.link !== "string" ||
    typeof channel.description !== "string"
  ) {
    throw new Error("RSS channel has invalid metadata");
  }

  let rawItems: unknown[] = [];

  if (channel.item) {
    if (Array.isArray(channel.item)) {
      rawItems = channel.item;
    } else {
      rawItems = [channel.item];
    }
  }

  const items: RSSItem[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const rssItem = item as Record<string, unknown>;

    if (
      typeof rssItem.title !== "string" ||
      typeof rssItem.link !== "string" ||
      typeof rssItem.description !== "string" ||
      typeof rssItem.pubDate !== "string"
    ) {
      continue;
    }

    items.push({
      title: rssItem.title,
      link: rssItem.link,
      description: rssItem.description,
      pubDate: rssItem.pubDate,
    });
  }

  return {
    channel: {
      title: channel.title,
      link: channel.link,
      description: channel.description,
      item: items,
    },
  };
}