import type { ReactNode } from "react";
import { workshopTitle } from "./content";
import "./globals.css";

export const metadata = {
  title: workshopTitle,
  description: "A five-question workshop on how a model is trained.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
