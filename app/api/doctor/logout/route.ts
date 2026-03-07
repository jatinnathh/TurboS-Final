import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const url = new URL("/doctor/login", request.url);

  const response = NextResponse.redirect(url);

  response.cookies.set("doctor_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}