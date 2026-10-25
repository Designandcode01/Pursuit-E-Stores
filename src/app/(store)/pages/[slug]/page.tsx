import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { STORE } from "@/lib/constants";
import { whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageSection = {
  heading: string;
  body?: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
};

type StaticPage = {
  title: string;
  description: string;
  intro: string;
  updated?: string;
  sections: PageSection[];
};

const PAGES: Record<string, StaticPage> = {
  shipping: {
    title: "Shipping & delivery",
    description:
      "Delivery timelines, courier charges and free-shipping threshold for Hunar Bazaar orders across Pakistan.",
    intro:
      "We dispatch from Lahore with tracked courier partners. Standard delivery is ₨ 250 and free on orders over ₨ 5,000. Express delivery is available in major cities.",
    updated: "1 September 2026",
    sections: [
      {
        heading: "Charges and timelines",
        table: {
          headers: ["Method", "Time", "Charge"],
          rows: [
            ["Standard delivery", "3–5 working days", "₨ 250 (free over ₨ 5,000)"],
            ["Express delivery", "1–2 working days", "₨ 500"],
            ["Remote areas", "5–8 working days", "₨ 250–₨ 450"],
          ],
        },
      },
      {
        heading: "Where we deliver",
        body: [
          "We deliver to all four provinces, Gilgit-Baltistan, Azad Jammu & Kashmir and Islamabad Capital Territory. Some remote postcodes may take an extra two to three working days; we will tell you if that applies to your order.",
        ],
      },
      {
        heading: "Dispatch and tracking",
        body: [
          "Orders placed before 2pm PKT on a working day are usually dispatched the same day. You will receive a tracking number on WhatsApp or by SMS once the parcel leaves our studio.",
          "Couriers attempt delivery two to three times. Please keep your phone reachable — COD orders are confirmed by phone before dispatch.",
        ],
      },
      {
        heading: "Delays we cannot control",
        body: [
          "Weather, public holidays, courier backlogs and inter-province movement restrictions can occasionally add a day or two. If your parcel is delayed beyond the estimate, message us on WhatsApp with your order number and we will chase it for you.",
        ],
      },
    ],
  },
  returns: {
    title: "Returns & exchanges",
    description:
      "How to return or exchange an unworn Hunar Bazaar item within 7 days of delivery.",
    intro:
      "If something is not right, tell us within 7 days of delivery. Unworn, unwashed items with original tags can be exchanged or returned for a refund.",
    updated: "1 September 2026",
    sections: [
      {
        heading: "What can be returned",
        bullets: [
          "Unworn, unwashed items with original tags and packaging.",
          "Footwear tried indoors only, with no scuffs or creasing.",
          "Items received damaged, defective or different from what you ordered.",
        ],
      },
      {
        heading: "What cannot be returned",
        bullets: [
          "Cut, stitched or altered fabric (including unstitched suits that have been cut).",
          "Items worn, washed, perfumed or damaged after delivery.",
          "Earrings and pierced jewellery, for hygiene reasons.",
          "Sale items marked “final sale” and made-to-order pieces.",
        ],
      },
      {
        heading: "How to start a return",
        body: [
          "Message us on WhatsApp with your order number and a photo of the item. We will confirm eligibility and share the return address in Lahore.",
          "Please pack the item securely and use a tracked courier. Return courier charges are the customer's responsibility unless the item was faulty or incorrect.",
          "Once we receive and inspect the item, refunds are issued within 5–7 working days to the original payment method. COD orders are refunded by bank transfer or JazzCash/Easypaisa.",
        ],
      },
      {
        heading: "Exchanges",
        body: [
          "Exchanges depend on stock. If your size or colour is unavailable, we can issue a store credit valid for six months, or refund the item.",
        ],
      },
    ],
  },
  "size-guide": {
    title: "Size guide",
    description:
      "Measurements for Hunar Bazaar kurtas, lawn suits, waistcoats and footwear in inches and centimetres.",
    intro:
      "Our ready-to-wear pieces are cut to standard Pakistani sizes. If you are between sizes, size up for a relaxed fit or message us for garment-specific measurements.",
    sections: [
      {
        heading: "Women's ready-to-wear",
        table: {
          headers: ["Size", "Bust (in)", "Waist (in)", "Hip (in)", "Length (in)"],
          rows: [
            ["XS", "32–33", "26–27", "35–36", "40"],
            ["S", "34–35", "28–29", "37–38", "41"],
            ["M", "36–37", "30–31", "39–40", "42"],
            ["L", "38–39", "32–33", "41–42", "43"],
            ["XL", "40–42", "34–36", "43–45", "44"],
            ["XXL", "43–45", "37–39", "46–48", "44"],
          ],
        },
      },
      {
        heading: "Men's kurtas & waistcoats",
        table: {
          headers: ["Size", "Chest (in)", "Waist (in)", "Kurta length (in)"],
          rows: [
            ["S", "36–37", "31–32", "40"],
            ["M", "38–39", "33–34", "41"],
            ["L", "40–41", "35–36", "42"],
            ["XL", "42–44", "37–39", "43"],
            ["XXL", "45–47", "40–42", "44"],
          ],
        },
      },
      {
        heading: "Footwear",
        table: {
          headers: ["EU", "UK", "Foot length (cm)"],
          rows: [
            ["36", "3", "22.5"],
            ["37", "4", "23.2"],
            ["38", "5", "24.0"],
            ["39", "6", "24.8"],
            ["40", "6.5", "25.4"],
            ["41", "7.5", "26.2"],
            ["42", "8", "27.0"],
          ],
        },
      },
      {
        heading: "How to measure",
        bullets: [
          "Bust: measure around the fullest part, keeping the tape level.",
          "Waist: measure the narrowest part, usually just above the navel.",
          "Hip: measure around the fullest part, about 8 inches below the waist.",
          "Foot: stand on paper and mark heel to longest toe; measure in centimetres.",
        ],
      },
      {
        heading: "Unstitched fabric",
        body: [
          "Unstitched lawn and chiffon suits are sold as fabric, not garments. Shirt pieces are typically 2.5–3 metres, dupattas 2.5 metres and trousers 2.5 metres. Exact measurements are listed in each product description.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy policy",
    description:
      "How Hunar Bazaar collects, uses and protects your personal data, including Clerk authentication and order records.",
    intro:
      "We collect only what we need to fulfil your order and improve your shopping experience. We never sell your personal data.",
    updated: "1 September 2026",
    sections: [
      {
        heading: "What we collect",
        bullets: [
          "Account details: name, email address, phone number and profile image from Clerk.",
          "Order details: delivery address, phone number, items purchased and payment method.",
          "Usage data: pages viewed, device type and approximate location for fraud prevention and analytics.",
        ],
      },
      {
        heading: "How we use it",
        bullets: [
          "To process orders, arrange delivery and provide customer support.",
          "To send order updates by email, SMS or WhatsApp.",
          "To prevent fraud, enforce our terms and comply with Pakistani law.",
          "To improve our catalogue and website experience in aggregate.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "We share the minimum necessary data with courier partners (name, address, phone), payment providers (for bank transfer verification) and our authentication provider Clerk. We do not share your data with advertisers.",
        ],
      },
      {
        heading: "Cookies and local storage",
        body: [
          "We use cookies for sign-in sessions and local storage to keep a guest cart and wishlist on your device. You can clear this data from your browser at any time.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can access, correct or delete your account data by contacting us. Order records are retained for accounting and tax purposes for the period required by law.",
          `Email ${STORE.email} with any privacy request and we will respond within 30 days.`,
        ],
      },
    ],
  },
  terms: {
    title: "Terms of service",
    description:
      "The terms that apply when you shop with Hunar Bazaar, including pricing, payment, delivery and returns.",
    intro:
      "By placing an order with Hunar Bazaar you agree to these terms. They are governed by the laws of Pakistan.",
    updated: "1 September 2026",
    sections: [
      {
        heading: "Orders and acceptance",
        body: [
          "An order is an offer to buy. We confirm orders by phone, WhatsApp or email before dispatch. We may refuse or cancel an order if an item is out of stock, priced incorrectly or if we suspect fraud.",
        ],
      },
      {
        heading: "Pricing and payment",
        body: [
          "All prices are in Pakistani Rupees (PKR) and include applicable taxes. Shipping is calculated at checkout. We accept cash on delivery and bank transfer; card and wallet payments are shown as coming soon until enabled.",
          "For bank transfers, orders are marked awaiting verification until we confirm the payment. Please use your order number as the transfer reference.",
        ],
      },
      {
        heading: "Delivery",
        body: [
          "Delivery estimates are indicative and depend on the courier. Risk passes to you on delivery. Please inspect the parcel and report damage within 48 hours.",
        ],
      },
      {
        heading: "Returns and refunds",
        body: [
          "Our returns policy forms part of these terms. Refunds are issued to the original payment method after inspection. Shipping charges are non-refundable unless the item was faulty.",
        ],
      },
      {
        heading: "Intellectual property",
        body: [
          "Product photography, copy and the Hunar Bazaar name are our property. You may not reuse them commercially without written permission.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "We are not liable for indirect losses arising from delays, courier failures or events beyond our reasonable control. Our liability for any order is limited to the amount you paid for that order.",
        ],
      },
    ],
  },
  about: {
    title: "Our story",
    description:
      "Hunar Bazaar is a small Pakistani label working with weavers, embroiderers and leatherworkers to make everyday pieces slowly.",
    intro:
      "Hunar means craft. We started in Lahore with a simple idea: make it easy to buy honest Pakistani textiles online, with photographs and descriptions you can trust.",
    sections: [
      {
        heading: "Small batches, real people",
        body: [
          "We work with a handful of families in Multan, Lahore and Kasur. Some of our embroiderers have been doing this for three generations. We pay per piece, on time, and keep runs small so quality stays high.",
          "That also means pieces sell out. When they do, we usually do not restock — we would rather move on to the next idea than repeat something that no longer feels fresh.",
        ],
      },
      {
        heading: "Why our prices are what they are",
        body: [
          "A lawn suit is not just fabric. It is the print, the embroidery, the finishing, the photography and the person who packs it. We keep our margins modest and show you the fabric and care details up front.",
        ],
      },
      {
        heading: "How we pack",
        body: [
          "Every order is folded in tissue, sealed in a recyclable courier bag and checked against your order before dispatch. If you are sending a gift, add a note at checkout and we will leave the prices out.",
        ],
      },
      {
        heading: "Come say hello",
        body: [
          "Our studio is in Gulberg III, Lahore. Visits are by appointment so we can give you our full attention — message us on WhatsApp to arrange a time.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact us",
    description:
      "WhatsApp, phone, email and studio address for Hunar Bazaar customer care in Lahore, Pakistan.",
    intro:
      "WhatsApp is the fastest way to reach us. We reply within the hour during store hours, and the next working day outside them.",
    sections: [
      {
        heading: "Customer care hours",
        body: ["Monday to Saturday, 10am–7pm PKT. Closed on Sundays and public holidays."],
      },
      {
        heading: "How to reach us",
        bullets: [
          `WhatsApp: ${STORE.phone}`,
          `Phone: ${STORE.phone}`,
          `Email: ${STORE.email}`,
          "Studio: Gulberg III, Lahore, Punjab, Pakistan (by appointment)",
        ],
      },
      {
        heading: "Before you message",
        body: [
          "For order questions, please include your order number (it looks like HB-20260901-ABCD). For returns, attach a photo of the item and the tag. For size help, tell us your usual size and the piece you are considering.",
        ],
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    description:
      "Answers about COD, delivery, returns, sizes and payments at Hunar Bazaar.",
    intro: "Quick answers to the questions we get most often.",
    sections: [
      {
        heading: "Do you offer cash on delivery?",
        body: [
          "Yes. COD is available nationwide. Please keep the exact amount ready — our courier may not carry change. COD orders are confirmed by phone or WhatsApp before dispatch.",
        ],
      },
      {
        heading: "How long does delivery take?",
        body: [
          "Standard delivery is 3–5 working days and costs ₨ 250, free over ₨ 5,000. Express delivery is 1–2 working days in major cities for ₨ 500. Remote areas can take a little longer.",
        ],
      },
      {
        heading: "Can I change my order after placing it?",
        body: [
          "If your order has not been dispatched, message us on WhatsApp and we will try to update the address, size or colour. Once dispatched, changes are not possible.",
        ],
      },
      {
        heading: "Are unstitched suits returnable?",
        body: [
          "Unstitched fabric can be returned only if it is uncut and in its original packaging. Once cut or washed, it cannot be returned.",
        ],
      },
      {
        heading: "Do you ship internationally?",
        body: [
          "Not yet. We currently deliver within Pakistan only. Join our WhatsApp list if you would like to hear when international shipping launches.",
        ],
      },
      {
        heading: "How do I use a coupon?",
        body: [
          "Enter the code in the coupon field at checkout and press Apply. The discount is recalculated on the server before your order is placed.",
        ],
      },
    ],
  },
};

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) return { title: "Page not found" };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/pages/${slug}` },
  };
}

export default async function StaticPage({ params }: { params: Params }) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();

  return (
    <div className="container-page py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Link href="/" className="hover:text-stone-900">
          Home
        </Link>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span aria-current="page">{page.title}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">Help & information</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-stone-900">{page.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{page.intro}</p>
          {page.updated ? (
            <p className="mt-3 text-[11px] text-muted-foreground">Last updated {page.updated}</p>
          ) : null}

          <div className="mt-6 space-y-2 rounded-2xl border border-border bg-white p-4 text-xs">
            <a
              href={whatsappLink("Assalam-o-Alaikum! I need help with an order on Hunar Bazaar.")}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 font-medium text-brand-800 hover:underline"
            >
              <MessageCircle className="size-4" aria-hidden="true" /> WhatsApp {STORE.phone}
            </a>
            <a
              href={`mailto:${STORE.email}`}
              className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
            >
              <Mail className="size-4" aria-hidden="true" /> {STORE.email}
            </a>
            <a
              href={`tel:${STORE.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
            >
              <Phone className="size-4" aria-hidden="true" /> Call us
            </a>
            <p className="flex items-start gap-2 text-stone-600">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Gulberg III, Lahore
            </p>
          </div>

          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/pages/contact">All contact options</Link>
          </Button>
        </div>

        <div className="space-y-8">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-2xl text-stone-900">{section.heading}</h2>
              {section.body ? (
                <div className="prose-store mt-2 space-y-2 text-sm">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
              {section.bullets ? (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-stone-600">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {section.table ? (
                <div className="mt-3 overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[32rem] border-collapse text-left text-xs">
                    <thead className="bg-[#f6f1e6] text-stone-700">
                      <tr>
                        {section.table.headers.map((header) => (
                          <th key={header} className="px-3 py-2.5 font-semibold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {section.table.rows.map((row) => (
                        <tr key={row.join("-")}>
                          {row.map((cell, index) => (
                            <td
                              key={`${row[0]}-${index}`}
                              className={index === 0 ? "px-3 py-2.5 font-medium text-stone-900" : "px-3 py-2.5 text-stone-600"}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ))}

          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5">
            <h2 className="font-display text-xl text-brand-900">Still need help?</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-brand-800">
              Message us on WhatsApp with your order number and we will get back to you during
              store hours.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a
                  href={whatsappLink("Assalam-o-Alaikum! I need help with an order on Hunar Bazaar.")}
                  target="_blank"
                  rel="noreferrer"
                >
                  Chat on WhatsApp
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="bg-white">
                <Link href="/pages/faq">Read the FAQ</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
