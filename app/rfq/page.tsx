import { Metadata } from "next";
import RfqBoardClient from "./RfqBoardClient";

export const metadata: Metadata = {
  title: "RFQ Board | EnviroConnect",
  description: "Browse open requests for quotes from facility managers seeking environmental compliance services.",
};

export default function RfqBoardPage() {
  return <RfqBoardClient />;
}
