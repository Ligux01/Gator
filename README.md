# Gator

Gator is a command-line RSS feed aggregator built with TypeScript, PostgreSQL, and Drizzle ORM.

It allows multiple local users to register, follow RSS feeds, aggregate posts, and browse the latest posts directly from the terminal.

## Requirements

To run Gator, you need:

- Node.js
- npm
- PostgreSQL
- A PostgreSQL database named `gator`

## Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd Gator
```

Install the dependencies:

```bash
npm install
```

## Database Setup

Make sure PostgreSQL is running and create a database named `gator`.

For example:

```bash
createdb gator
```

Create a `.gatorconfig.json` file in your home directory:

```text
~/.gatorconfig.json
```

Example:

```json
{
  "db_url": "postgres://postgres:YOUR_PASSWORD@localhost:5432/gator?sslmode=disable"
}
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

Run the database migrations from the project root:

```bash
npx drizzle-kit migrate
```

## Running Gator

Commands are run using:

```bash
npm run start <command> [arguments]
```

## Commands

### Register a user

```bash
npm run start register <username>
```

Example:

```bash
npm run start register alice
```

This creates the user and sets them as the current user.

### Login

```bash
npm run start login <username>
```

Example:

```bash
npm run start login alice
```

### List users

```bash
npm run start users
```

The currently logged-in user will be marked.

### Add a feed

```bash
npm run start addfeed "<feed-name>" "<feed-url>"
```

Example:

```bash
npm run start addfeed "Hacker News" "https://news.ycombinator.com/rss"
```

### Start the feed aggregator

```bash
npm run start agg <time-between-requests>
```

Examples:

```bash
npm run start agg 30s
```

```bash
npm run start agg 1m
```

The aggregator continuously fetches RSS feeds and stores new posts in the database.

Press `Ctrl+C` to stop it.

### Browse posts

```bash
npm run start browse
```

By default, this shows the latest 2 posts.

You can also specify a limit:

```bash
npm run start browse 10
```

### Reset the database

```bash
npm run start reset
```

This removes the application data from the database.

## Example RSS Feeds

Hacker News:

```text
https://news.ycombinator.com/rss
```

TechCrunch:

```text
https://techcrunch.com/feed/
```

## Technologies Used

- TypeScript
- Node.js
- PostgreSQL
- Drizzle ORM
- Drizzle Kit
