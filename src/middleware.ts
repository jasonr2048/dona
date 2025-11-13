import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const DONATION_ID_COOKIE = "completedDonationId";
export const EXTERNAL_DONOR_ID_COOKIE = "externalDonorId";
const FEEDBACK_ROUTE = "/donation-feedback";
const DONATION_ROUTE = "/data-donation";

export function middleware(req: NextRequest) {
  // Redirect to the landing page if the user isn't authorized
  if ((req.nextUrl.pathname == FEEDBACK_ROUTE && !req.cookies.get(DONATION_ID_COOKIE)) || (req.nextUrl.pathname == DONATION_ROUTE && !req.cookies.get(EXTERNAL_DONOR_ID_COOKIE))) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/donation-feedback", "/data-donation"] // Use string literals since processed at build time
};
