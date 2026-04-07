export default class Logger {
  public static info(message: string) {
    console.log(`[INFO] ${message}`);
  }
  public static warn(message: string) {
    console.log(`[WARN] ${message}`);
  }
  public static error(message: string) {
    console.log(`[ERROR] ${message}`);
  }
  public static event(message: string) {
    console.log(`[EVENT] ${message}`);
  }
  public static command(message: string) {
    console.log(`[COMMAND] ${message}`);
  }
  public static slashcmd(message: string) {
    console.log(`[SLASHCMD] ${message}`);
  }
}
