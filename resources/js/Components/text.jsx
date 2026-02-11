import React from "react";
import clsx from "clsx";

const styles = {
  title: "text-sm font-bold text-slate-900",
  subtitle: "mt-2 text-slate-500 text-[12px]",
  body: "text-[12px] text-slate-700",
  caption: "text-[11px] text-slate-500",
  titleSection : "text-xs font-semibold text-gray-900",
  contentSection : "text-xs font-normal text-gray-600",
};

export default function Text({
  as: Tag = "p",
  variant = "body",
  className = "",
  children,
  ...props
}) {
  return (
    <Tag className={clsx(styles[variant], className)} {...props}>
      {children}
    </Tag>
  );
}
