import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
    const session = request.cookies.get("formdb_session")?.value;
    const { pathname } = request.nextUrl;

    // Guard dashboard routes.
    if (pathname.startsWith("/dashboard") && !session) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Prevent logged-in users from revisiting auth screens.
    if (pathname.startsWith("/login") && session) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/login/:path*"],
};
