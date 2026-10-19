"use client";

import { useState } from "react";
import {
  MapPin,
  Navigation,
  Compass,
  Clock,
  Phone,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Car,
  Building2,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationInfo {
  id: "harare" | "chiredzi";
  name: string;
  badge: string;
  address: string;
  landmark: string;
  distanceNote: string;
  hours: string;
  days: string;
  coords: { lat: number; lng: number };
  mapEmbedUrl: string;
  directionsUrl: string;
  appleMapsUrl: string;
  whatsappPhone: string;
  callPhone: string;
  email: string;
}

const LOCATIONS: Record<"harare" | "chiredzi", LocationInfo> = {
  harare: {
    id: "harare",
    name: "Harare Main Showroom & Workshop Hub",
    badge: "Main Showroom",
    address: "10670 Harare Highglen Road",
    landmark: "10 kilometres from Highglen Shopping Centre",
    distanceNote: "10 km from Highglen along Highglen Road",
    hours: "8:00 AM – 5:00 PM",
    days: "Monday – Saturday (Sunday Closed)",
    coords: { lat: -17.882, lng: 30.962 },
    mapEmbedUrl:
      "https://maps.google.com/maps?q=-17.882,30.962+(Kombera+Kombera+Furnitures+-+10670+Harare+Highglen+Road)&t=m&z=14&ie=UTF8&iwloc=B&output=embed",
    directionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=-17.882,30.962&destination_name=10670+Harare+Highglen+Road",
    appleMapsUrl: "https://maps.apple.com/?daddr=-17.882,30.962&q=10670+Harare+Highglen+Road",
    whatsappPhone: "+263 716 496 040",
    callPhone: "0775 362 010",
    email: "mugwavae@gmail.com",
  },
  chiredzi: {
    id: "chiredzi",
    name: "Chiredzi Regional Showroom & Depot",
    badge: "Regional Branch",
    address: "Chiredzi Central Showroom Depot",
    landmark: "Serving Lowveld, Triangle & Masvingo Province",
    distanceNote: "Direct collection depot for Lowveld clients",
    hours: "8:00 AM – 5:00 PM",
    days: "Monday – Saturday (Sunday Closed)",
    coords: { lat: -21.048, lng: 31.666 },
    mapEmbedUrl:
      "https://maps.google.com/maps?q=-21.048,31.666+(Kombera+Kombera+Furnitures+-+Chiredzi+Branch)&t=m&z=14&ie=UTF8&iwloc=B&output=embed",
    directionsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=-21.048,31.666&destination_name=Chiredzi+Showroom+Depot",
    appleMapsUrl: "https://maps.apple.com/?daddr=-21.048,31.666&q=Chiredzi+Showroom+Depot",
    whatsappPhone: "+263 716 496 040",
    callPhone: "0775 362 010",
    email: "mugwavae@gmail.com",
  },
};

export function ShowroomLocationMap() {
  const [selectedBranch, setSelectedBranch] = useState<"harare" | "chiredzi">("harare");
  const [copied, setCopied] = useState(false);

  const loc = LOCATIONS[selectedBranch];

  const handleCopyAddress = () => {
    const fullText = `${loc.name}, ${loc.address} (${loc.landmark}), Zimbabwe. Tel: ${loc.callPhone}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
      {/* Top Header & Branch Switcher */}
      <div className="p-6 sm:p-8 border-b border-border bg-gradient-to-r from-secondary/50 via-background to-secondary/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Interactive Showroom Locator</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
              Physical Showrooms & Workshop Locations
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Inspect handcrafted solid hardwoods, custom velvet suites, and speak directly with our master craftsmen on-site.
            </p>
          </div>

          {/* Branch Selector Tabs */}
          <div className="flex items-center gap-2 p-1.5 bg-secondary/80 border border-border rounded-xl shrink-0">
            <button
              onClick={() => setSelectedBranch("harare")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedBranch === "harare"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Harare Hub (Highglen)</span>
            </button>
            <button
              onClick={() => setSelectedBranch("chiredzi")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedBranch === "chiredzi"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Chiredzi Branch</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map & Location Card */}
      <div className="grid lg:grid-cols-12 gap-0">
        {/* Left Column: Graphic Interactive Map Display (7 cols) */}
        <div className="lg:col-span-7 relative min-h-[380px] sm:min-h-[440px] bg-muted overflow-hidden">
          {/* Live Google Maps Iframe */}
          <iframe
            title={`Map for ${loc.name}`}
            src={loc.mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0, minHeight: "380px" }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full grayscale-[15%] contrast-[105%]"
          />

          {/* Floating Accurate Position Marker Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-background/95 backdrop-blur-md border border-border px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider">
                Confirmed GPS Location
              </span>
              <p className="text-xs font-bold text-foreground font-mono">
                {loc.address}
              </p>
            </div>
          </div>

          {/* Quick Distance Floating Badge */}
          <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-md border border-border px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Car className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{loc.distanceNote}</span>
          </div>
        </div>

        {/* Right Column: Address Details, Direct Dialers & Navigation (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-card border-t lg:border-t-0 lg:border-l border-border">
          <div className="space-y-5">
            {/* Location Title & Badge */}
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                {loc.badge}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                GPS: {loc.coords.lat}, {loc.coords.lng}
              </span>
            </div>

            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                {loc.name}
              </h3>
              <div className="flex items-start gap-2.5 text-sm text-foreground mt-2 font-medium">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-base">{loc.address}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5 font-normal">
                    {loc.landmark}
                  </p>
                  <p className="text-xs text-muted-foreground">Harare, Zimbabwe</p>
                </div>
              </div>
            </div>

            {/* Hours & Availability */}
            <div className="p-3.5 bg-secondary/40 rounded-xl border border-border text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Showroom Visiting Hours</span>
              </div>
              <p className="text-muted-foreground pl-5.5">
                {loc.days} • <span className="font-mono font-medium text-foreground">{loc.hours}</span>
              </p>
            </div>

            {/* Direct Contact Links */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Showroom WhatsApp:</span>
                <a
                  href="https://wa.me/263716496040"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>{loc.whatsappPhone}</span>
                </a>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">EcoCash / Mukuru / InnBucks:</span>
                <a
                  href={`tel:${loc.callPhone.replace(/\D/g, "")}`}
                  className="font-mono font-bold text-foreground hover:text-primary transition flex items-center gap-1"
                >
                  <PhoneCall className="w-3 h-3 text-emerald-600" />
                  <span>{loc.callPhone}</span>
                </a>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Direct Inquiries:</span>
                <a
                  href={`mailto:${loc.email}`}
                  className="font-mono text-muted-foreground hover:text-foreground underline"
                >
                  {loc.email}
                </a>
              </div>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="space-y-2.5 pt-4 border-t border-border">
            <a
              href={loc.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition"
            >
              <Navigation className="w-4 h-4" />
              <span>Get Driving Directions (Google Maps)</span>
              <ExternalLink className="w-3 h-3 opacity-70 ml-1" />
            </a>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={loc.appleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground border border-border transition"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Apple Maps</span>
              </a>

              <button
                onClick={handleCopyAddress}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground border border-border transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Address</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
