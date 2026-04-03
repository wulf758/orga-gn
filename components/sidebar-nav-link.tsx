"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavItem } from "@/lib/types";

type SidebarNavLinkProps = {
  item: NavItem;
};

export function SidebarNavLink({ item }: SidebarNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={["nav-link", isActive ? "active" : ""].filter(Boolean).join(" ")}
    >
      <span className="nav-title">{item.label}</span>
      <span className="nav-description">{item.description}</span>
    </Link>
  );
}

