type StatusPillProps = {
  children: string;
  tone?: "success" | "warning";
};

export function StatusPill({ children, tone }: StatusPillProps) {
  const classes = ["status-pill"];

  if (tone) {
    classes.push(tone);
  }

  return <span className={classes.join(" ")}>{children}</span>;
}
