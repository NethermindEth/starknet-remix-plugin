/**
 * Terminal logging utilities for consistent output formatting
 * in the StarkNet Remix Plugin terminal console.
 */

type RemixTerminalClient = {
  call: (plugin: string, method: string, payload: { value: string; type: string }) => Promise<void>;
  terminal: {
    log: (payload: { type: string; value: string }) => Promise<void>;
  };
};

const SEPARATOR_LENGTH = 80;

/** Create a separator line with optional label */
const makeSeparator = (label?: string, char = "─"): string => {
  if (label === undefined || label === "") {
    return char.repeat(SEPARATOR_LENGTH);
  }
  const padding = Math.max(0, Math.floor((SEPARATOR_LENGTH - label.length - 2) / 2));
  const leftPad = char.repeat(padding);
  const rightPad = char.repeat(SEPARATOR_LENGTH - padding - label.length - 2);
  return `${leftPad} ${label} ${rightPad}`;
};

/** Format a UTC timestamp string */
const getTimestamp = (): string => {
  return new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
};

/** Log an action start trace to the terminal */
export const logActionStart = async (
  remixClient: RemixTerminalClient,
  action: string,
  detail?: string
): Promise<void> => {
  const label = detail !== undefined ? `${action}: ${detail}` : action;
  await remixClient.call("terminal", "log", {
    value: makeSeparator(label),
    type: "info"
  });
  await remixClient.call("terminal", "log", {
    value: `[${getTimestamp()}] ${action} started${detail !== undefined ? ": " + detail : ""}`,
    type: "info"
  });
};

/** Log an action end trace to the terminal */
export const logActionEnd = async (
  remixClient: RemixTerminalClient,
  action: string,
  success: boolean,
  detail?: string
): Promise<void> => {
  const status = success ? "✔ succeeded" : "✖ failed";
  await remixClient.call("terminal", "log", {
    value: `[${getTimestamp()}] ${action} ${status}${detail !== undefined ? ": " + detail : ""}`,
    type: success ? "info" : "error"
  });
  await remixClient.call("terminal", "log", {
    value: makeSeparator(),
    type: "info"
  });
};

/** Log a JSON response with a label */
export const logJsonResponse = async (
  remixClient: RemixTerminalClient,
  label: string,
  data: unknown
): Promise<void> => {
  await remixClient.call("terminal", "log", {
    value: `[${getTimestamp()}] ${label}:`,
    type: "info"
  });
  await remixClient.call("terminal", "log", {
    value: JSON.stringify(data, null, 2),
    type: "info"
  });
};

/** Log an error message to the terminal */
export const logError = async (
  remixClient: RemixTerminalClient,
  message: string
): Promise<void> => {
  await remixClient.call("terminal", "log", {
    value: `[${getTimestamp()}] ✖ Error: ${message}`,
    type: "error"
  });
};

/** Log a plain info message to the terminal */
export const logInfo = async (
  remixClient: RemixTerminalClient,
  message: string
): Promise<void> => {
  await remixClient.call("terminal", "log", {
    value: `[${getTimestamp()}] ℹ ${message}`,
    type: "info"
  });
};
