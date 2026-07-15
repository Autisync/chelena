import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { COUNTRY_COOKIE, isCountry, suggestCountryFromHeader } from "@/lib/country";
import { type NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // Country is independent of locale: first visit gets a geo-IP suggestion,
  // persisted so the user's explicit switcher choice always wins after that.
  const existing = request.cookies.get(COUNTRY_COOKIE)?.value;
  if (!isCountry(existing)) {
    const geoCountry = suggestCountryFromHeader(
      request.headers.get("x-vercel-ip-country")
    );
    response.cookies.set(COUNTRY_COOKIE, geoCountry, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
