"use client";

import { usePathname } from "next/navigation";
import styles from "./PageTransition.module.css";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={styles.wrapper}>
      {children}
    </div>
  );
}
