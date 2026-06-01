// Plain-language summary of what a flag's current settings mean for brands.
// Mirrors the resolver in server.ts so the admin UI never lies about behaviour.

export type FlagTone = "on" | "partial" | "off";

export function describeFlagState(opts: {
  enabled: boolean;
  rolloutPercentage: number;
  overrideCount?: number;
}): { label: string; detail: string; tone: FlagTone } {
  const { enabled, rolloutPercentage, overrideCount = 0 } = opts;
  const overrides =
    overrideCount > 0
      ? ` ${overrideCount} brand ${overrideCount === 1 ? "override" : "overrides"} set below.`
      : "";

  if (!enabled) {
    return {
      tone: "off",
      label: "Off for everyone",
      detail:
        "The master switch is off, so no brand can use this — brand overrides are ignored until it's turned on.",
    };
  }

  if (rolloutPercentage >= 100) {
    return {
      tone: "on",
      label: "On for all brands",
      detail: `Every approved brand gets this, except brands set to Force OFF.${overrides}`,
    };
  }

  if (rolloutPercentage <= 0) {
    return {
      tone: "off",
      label: "Off (0% rollout)",
      detail: `Only brands you set to Force ON will get this.${overrides}`,
    };
  }

  return {
    tone: "partial",
    label: `On for ~${rolloutPercentage}% of brands`,
    detail: `A stable ${rolloutPercentage}% sample of brands gets this, plus Force ON, minus Force OFF.${overrides}`,
  };
}
