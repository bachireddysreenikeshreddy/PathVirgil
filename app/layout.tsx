import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Harbor | Travel with clarity",description:"Multilingual weather guidance, offline help, and carefully reviewed community reports.",icons:{icon:"/app/icon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>;}
