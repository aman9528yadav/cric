import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CricketProvider } from "./store/cricketStore";

export const metadata = {
  title: "CricManager — Cricket Scorecard Manager",
  description: "Manage cricket tournaments, teams, and live match scoring with real-time scorecards",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CricketProvider>
          {children}
        </CricketProvider>
      </body>
    </html>
  );
}
