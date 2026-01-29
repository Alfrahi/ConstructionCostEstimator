import React from "react";

export default function ChartContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full h-[320px] sm:h-[360px] lg:h-[400px]">{children}</div>
  );
}
