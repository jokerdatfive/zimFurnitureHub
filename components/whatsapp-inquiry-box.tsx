"use client";

import { useState } from "react";
import { MessageSquare, Check, Truck, ReceiptText, Camera, Send, ExternalLink } from "lucide-react";

interface WhatsAppInquiryBoxProps {
  productName: string;
  price: number;
  inStock: boolean;
  whatsappNumber?: string;
}

export function WhatsAppInquiryBox({
  productName,
  price,
  inStock,
  whatsappNumber = "263716496040",
}: WhatsAppInquiryBoxProps) {
  const cleanPhone = whatsappNumber.replace(/\D/g, "");

  const templates = [
    {
      id: "availability",
      title: "Check Availability & Delivery",
      icon: Truck,
      prompt: `Hi KK Furnitures! I am interested in: "${productName}" ($${price}). Could you please confirm if this piece is currently in stock and available for delivery to my area (Harare / Chiredzi)?`,
    },
    {
      id: "layby",
      title: "Inquire About Layby Plan",
      icon: ReceiptText,
      prompt: `Hi KK Furnitures! I would like to inquire about a Layby Plan for: "${productName}" ($${price}). What is the initial deposit required and monthly payment terms?`,
    },
    {
      id: "photos",
      title: "Request More Photos & Finishes",
      icon: Camera,
      prompt: `Hi KK Furnitures! I'm viewing "${productName}" on your website. Could you please send me additional showroom pictures and available wood/fabric finishes?`,
    },
  ];

  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [customText, setCustomText] = useState(templates[0].prompt);

  const handleSelect = (tmpl: typeof templates[0]) => {
    setSelectedTemplate(tmpl);
    setCustomText(tmpl.prompt);
  };

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customText)}`;

  return (
    <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Confirm with Showroom via WhatsApp</h4>
            <p className="text-[11px] text-muted-foreground">Prompt template tailored for {productName}</p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
          Instant Reply
        </span>
      </div>

      {/* Template Pills */}
      <div>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
          Choose Inquiry Question:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {templates.map((tmpl) => {
            const Icon = tmpl.icon;
            const isSelected = selectedTemplate.id === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelect(tmpl)}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-left transition border ${
                  isSelected
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-background text-foreground border-border hover:border-emerald-500/50"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{tmpl.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editable Message Preview */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-muted-foreground block">
          WhatsApp Message Preview:
        </label>
        <textarea
          rows={2}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed font-sans"
        />
      </div>

      {/* Launch WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition"
      >
        <Send className="w-4 h-4" />
        <span>Open WhatsApp & Send Inquiry</span>
        <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
      </a>

      <p className="text-[11px] text-center text-muted-foreground">
        Showroom at 10670 Harare Highglen Road • Branches in Harare & Chiredzi
      </p>
    </div>
  );
}
