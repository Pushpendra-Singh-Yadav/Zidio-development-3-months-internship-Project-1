import { NextResponse } from "next/server";

export const config = {
  matcher: "/integrations/:path*",
};

export function middleware(request) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-createxyz-project-id", "ddd1f55f-eff0-4f4b-b79b-d4f3c81164f3");
  requestHeaders.set("x-createxyz-project-group-id", "44638898-2400-4893-b596-65ffe85826e7");


  request.nextUrl.href = `https://www.create.xyz/${request.nextUrl.pathname}`;

  return NextResponse.rewrite(request.nextUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}