import {
  CommandsRegistry,
  handlerLogin,
  handlerRegister,
  handlerReset,
  handlerUsers,
  handlerAgg,
  handlerAddFeed,
  registerCommand,
  runCommand,
  handlerFeeds,
  handlerFollow,
  handlerUnfollow,
  handlerFollowing,
  middlewareLoggedIn,
} from "./commands";

async function main() {
  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
  registerCommand(registry,"unfollow",middlewareLoggedIn(handlerUnfollow));
  registerCommand(registry, "browse", handlerBrowse);
  
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Error: not enough arguments provided");
    process.exit(1);
  }

  const [cmdName, ...cmdArgs] = args;

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    } else {
      console.error("Unknown error");
    }

    process.exit(1);
  }

  process.exit(0);
}

main();