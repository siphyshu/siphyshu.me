import os from "os";
import { withContentCollections } from "@content-collections/next";

// This machine's LAN addresses, so a phone on the same network can load the
// dev server (http://<mac's ip>:3000). Next blocks cross-origin requests to
// its dev assets by default, and without them the page arrives as inert
// HTML — it renders, but nothing on it responds to a tap. Read at startup
// rather than hard-coded because the address changes with the network
// (hotspot, home wifi). Only consulted by `next dev`.
const lanAddresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((iface) => iface && iface.family === "IPv4" && !iface.internal)
  .map((iface) => iface.address);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: lanAddresses,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: ''
      }
    ],
  },
}

// Runs the content-collections builder (and its watcher under `next dev`)
// before Next starts, so the generated module exists when anything imports it.
export default withContentCollections(nextConfig);
