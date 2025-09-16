import { SQLDatabase } from 'encore.dev/storage/sqldb';

export const tutorialsDB = new SQLDatabase("tutorials", {
  migrations: "./migrations",
});
