import { Layers, type LucideIcon, PackageOpen, Swords, User, Wallet } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/play", label: "Play", icon: Swords },
  { href: "/collection", label: "Collection", icon: Layers },
  { href: "/decks", label: "Decks", icon: Wallet },
  { href: "/shop", label: "Shop", icon: PackageOpen },
  { href: "/profile", label: "Profile", icon: User }
];
