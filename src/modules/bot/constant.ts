export const BOT_NAME = 'Prediction Test Bot';

export const TARGET_GROUP_ID = -1003562570184;
export const TARGET_TOPIC_ID = 17;

export const TELEGRAM_CHANNEL_ID = '@noti_error_telegram';

export const COMMAND = {
  start: 'start',
  help: 'help',
} as const;

export const COMMANDS = Object.values(COMMAND);

export function isCommand(text: string): boolean {
  return COMMANDS.includes(text.replace('/', '') as any);
}
