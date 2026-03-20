interface ProgressBarProps {
  percent: number;
  size?: "sm" | "md";
}

export default function ProgressBar({ percent, size = "md" }: ProgressBarProps) {
  const h = size === "sm" ? "h-1" : "h-1.5";
  return (
    <div className={`w-full ${h} rounded-full bg-secondary overflow-hidden`}>
      <div
        className={`${h} rounded-full progress-bar-fill transition-all duration-500 ease-out`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
