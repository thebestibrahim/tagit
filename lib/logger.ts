import * as Sentry from "@sentry/nextjs";

type Level = "info" | "warn" | "error";

function reportToSentry(level: Level, route: string, msg: string, data?: unknown) {
  const severity = level === "warn" ? "warning" : level;
  Sentry.withScope((scope) => {
    scope.setTag("route", route);
    scope.setLevel(severity);
    if (data !== undefined) scope.setContext("data", { value: data });
    if (data instanceof Error) Sentry.captureException(data);
    else Sentry.captureMessage(msg, severity);
  });
}

function write(level: Level, route: string, msg: string, data?: unknown) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    route,
    msg,
    ...(data !== undefined && { data }),
  };

  // log.error/warn are usually the only signal we get from a handled failure
  // (failed email send, failed payment, etc.) — without this, those errors
  // only ever reach stdout/stderr and nobody is alerted.
  if (level === "error" || level === "warn") reportToSentry(level, route, msg, data);

  if (process.env.NODE_ENV === "production") {
    // Structured JSON — ingested by Vercel log drains / any log aggregator
    const line = JSON.stringify(entry);
    if (level === "error") process.stderr.write(line + "\n");
    else process.stdout.write(line + "\n");
  } else {
    const prefix = `[${entry.ts}] [${level.toUpperCase()}] [${route}]`;
    if (level === "error") console.error(prefix, msg, data ?? "");
    else if (level === "warn") console.warn(prefix, msg, data ?? "");
    else console.log(prefix, msg, data ?? "");
  }
}

export const log = {
  info:  (route: string, msg: string, data?: unknown) => write("info",  route, msg, data),
  warn:  (route: string, msg: string, data?: unknown) => write("warn",  route, msg, data),
  error: (route: string, msg: string, data?: unknown) => write("error", route, msg, data),
};
