import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { token, rating, comment } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Find review by token
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.token, token),
    });

    if (!review) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    }

    // Check if already submitted
    if (review.status === "submitted") {
      return NextResponse.json(
        { error: "This review has already been submitted" },
        { status: 400 }
      );
    }

    // Check if expired
    if (review.expiresAt < new Date()) {
      await db
        .update(reviews)
        .set({ status: "expired" })
        .where(eq(reviews.token, token));

      return NextResponse.json(
        { error: "This review link has expired" },
        { status: 400 }
      );
    }

    // Update review
    await db
      .update(reviews)
      .set({
        rating,
        comment: comment || null,
        status: "submitted",
        submittedAt: new Date(),
      })
      .where(eq(reviews.token, token));

    return NextResponse.json({
      success: true,
      message: "Review submitted successfully",
    });
  } catch (error) {
    console.error("[reviews/submit]", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
