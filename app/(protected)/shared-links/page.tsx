"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Handle search input
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
  }

  function handleDateRangeChange(range: DateRange | undefined) {
    setDateRange(range);
  }

  function clearFilters() {
    setSearch("");
    setDateRange(undefined);
  }

  const anyFilterApplied = search || (dateRange && (dateRange.from || dateRange.to));

  return (
    <main className="w-full mx-auto py-2">
      <section className="flex flex-col gap-4 justify-between w-full md:flex-row md:gap-4 items-start md:items-center">
        <h1 className="text-2xl font-bold mb-4 md:text-3xl">My Clients</h1>
      </section>
      <hr className="my-4" />

      {/* Client Filters Section */}
      <section className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 mb-6 w-full">
        {/* Search Bar */}
        <div className="flex h-10 items-center bg-[#f5f5f5] rounded-md px-4 py-2 min-w-0 flex-1 sm:min-w-[220px] sm:max-w-xs border border-[#ececec]">
          <Search className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
          <Input
            className="bg-transparent border-none shadow-none focus:ring-0 focus-visible:ring-0 p-0 text-sm h-6"
            placeholder="Search clients..."
            value={search}
            onChange={handleSearchChange}
            style={{ boxShadow: "none" }}
          />
        </div>
        
        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center bg-[#f5f5f5] rounded-md px-4 py-2 text-sm font-normal text-gray-700 border border-[#ececec] h-10 min-w-0 sm:min-w-[150px] justify-start"
              type="button"
            >
              <CalendarIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
              <span className="truncate">
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
                  : "Date range"}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-auto" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        
        {/* Clear Filters */}
        {anyFilterApplied && (
          <button
            className="sm:ml-auto text-sm text-gray-500 hover:text-black underline whitespace-nowrap italic cursor-pointer self-start sm:self-center"
            onClick={clearFilters}
            type="button"
            style={{ minHeight: 40 }}
          >
            Clear all filters
          </button>
        )}
      </section>
    </main>
  );
} 