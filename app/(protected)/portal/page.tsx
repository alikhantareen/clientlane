"use client";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function AllPortalsPage() {
  return (
    <main className="w-full mx-auto py-2">
      <section className="flex flex-col gap-4 justify-between w-full md:flex-row md:gap-4 items-start md:items-center">
        <h1 className="text-2xl font-bold mb-4 md:text-3xl">My Portals</h1>
        <Link
          href="/portal/create"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-black text-white hover:bg-gray-800 hover:text-white cursor-pointer w-full md:w-fit px-4 py-2 gap-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Portal
        </Link>
      </section>
      <hr className="my-4" />
    </main>
  );
}
