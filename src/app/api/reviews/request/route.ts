import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews, contacts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { addDays } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const { contactId, platform, message } = await request.json();

    if (!contactId || !platform) {
      return NextResponse.json(
        { error: "contactId and platform are required" },
        { status: 400 }
      );
    }

    // Validate platform
    if (!["google", "facebook", "instagram"].includes(platform)) {
      return NextResponse.json(
        { error: "platform must be: google, facebook, or instagram" },
        { status: 400 }
      );
    }

    // Get contact
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, contactId),
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    if (!contact.phone) {
      return NextResponse.json(
        { error: "Contact has no phone number" },
        { status: 400 }
      );
    }

    // Generate token (base64 encoded UUID)
    const token = Buffer.from(crypto.randomUUID()).toString("base64");

    // Create review record
    const review = await db.insert(reviews).values({
      token,
      contactId,
      platform,
      expiresAt: addDays(new Date(), 7), // 7 days to submit
      status: "pending",
    });

    // Build review page URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const reviewUrl = `${baseUrl}/reviews/${token}`;

    // Build WhatsApp message
    const defaultMessage =
      platform === "google"
        ? `¡Hola! Te invitamos a dejar una reseña en Google para que otros clientes conozcan nuestra experiencia. 🌟`
        : `¡Hola! Nos encantaría que dejes una reseña sobre nuestro servicio. Tu opinión es muy importante para nosotros. 💬`;

    const whatsappMessage = `${message || defaultMessage}\n\n${reviewUrl}`;
    const encodedMessage = encodeURIComponent(whatsappMessage);

    // Format phone for WhatsApp (remove special chars, ensure country code)
    const phoneForWhatsApp = contact.phone.replace(/\D/g, "");

    // Generate WhatsApp link
    const whatsappLink = `https://wa.me/${phoneForWhatsApp}?text=${encodedMessage}`;

    return NextResponse.json({
      success: true,
      token,
      reviewUrl,
      whatsappLink,
      contact: {
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
      },
    });
  } catch (error) {
    console.error("[reviews/request]", error);
    return NextResponse.json(
      { error: "Failed to request review" },
      { status: 500 }
    );
  }
}
