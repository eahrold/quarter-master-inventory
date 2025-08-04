import { memo } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { SearchInput } from "./SearchInput";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { ItemFilters } from "../../lib/api";

interface ItemSearchProps {
  filters: ItemFilters;
  onFiltersChange: (filters: ItemFilters) => void;
  onSearch: () => void;
  loading?: boolean;
}

export const ItemSearch = memo(
  ({
    filters,
    onFiltersChange,
    onSearch,
    loading = false,
  }: ItemSearchProps) => {
    // Handle search text changes from the isolated SearchInput component
    const handleSearchTextChange = (searchText: string) => {
      const newFilters = { ...filters };
      if (searchText.trim()) {
        newFilters.search = searchText;
      } else {
        delete newFilters.search;
      }
      onFiltersChange(newFilters);
    };

    const setFilter = (key: keyof ItemFilters, value: string | undefined) => {
      onFiltersChange({ ...filters, [key]: value });
    };

    const clearFilter = (key: keyof ItemFilters) => {
      const newFilters = { ...filters };
      delete newFilters[key];
      onFiltersChange(newFilters);
    };

    const clearAllFilters = () => {
      onFiltersChange({});
    };

    const getActiveFilterCount = () => {
      return Object.keys(filters).filter(
        (key) => filters[key as keyof ItemFilters]
      ).length;
    };

    const formatLocation = (location: string) => {
      const [side, level] = location.split("-");
      if (side && level) {
        return `${side.charAt(0).toUpperCase() + side.slice(1)}-${
          level.charAt(0).toUpperCase() + level.slice(1)
        }`;
      }
      return location;
    };

    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-4">
              <SearchInput
                initialValue={filters.search || ""}
                onSearch={handleSearchTextChange}
                loading={loading}
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={loading}>
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                    {getActiveFilterCount() > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 py-0.5 text-xs"
                      >
                        {getActiveFilterCount()}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" onCloseAutoFocus={(e) => e.preventDefault()}>
                  <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setFilter("category", "permanent");
                    }}
                    className={
                      filters.category === "permanent" ? "bg-accent" : ""
                    }
                  >
                    Permanent Items
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setFilter("category", "staples");
                    }}
                    className={
                      filters.category === "staples" ? "bg-accent" : ""
                    }
                  >
                    Staples
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setFilter("status", "available");
                    }}
                    className={
                      filters.status === "available" ? "bg-accent" : ""
                    }
                  >
                    Available
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setFilter("status", "checked_out");
                    }}
                    className={
                      filters.status === "checked_out" ? "bg-accent" : ""
                    }
                  >
                    Checked Out
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setFilter("status", "needs_repair");
                    }}
                    className={
                      filters.status === "needs_repair" ? "bg-accent" : ""
                    }
                  >
                    Needs Repair
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Filter by Location</DropdownMenuLabel>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setFilter("location", "left-low");
                    }}
                    className={
                      filters.location === "left-low" ? "bg-accent" : ""
                    }
                  >
                    Left-Low
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setFilter("location", "left-middle");
                    }}
                    className={
                      filters.location === "left-middle" ? "bg-accent" : ""
                    }
                  >
                    Left-Middle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setFilter("location", "left-high");
                    }}
                    className={
                      filters.location === "left-high" ? "bg-accent" : ""
                    }
                  >
                    Left-High
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setFilter("location", "right-low");
                    }}
                    className={
                      filters.location === "right-low" ? "bg-accent" : ""
                    }
                  >
                    Right-Low
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setFilter("location", "right-middle");
                    }}
                    className={
                      filters.location === "right-middle" ? "bg-accent" : ""
                    }
                  >
                    Right-Middle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setFilter("location", "right-high");
                    }}
                    className={
                      filters.location === "right-high" ? "bg-accent" : ""
                    }
                  >
                    Right-High
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={onSearch} disabled={loading}>
                Search
              </Button>
            </div>

            {/* Active Filters */}
            {getActiveFilterCount() > 0 && (
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-sm text-gray-600">Active filters:</span>

                {filters.category && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Category:{" "}
                    {filters.category.charAt(0).toUpperCase() +
                      filters.category.slice(1)}
                    <button
                      onClick={() => clearFilter("category")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {filters.status && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Status:{" "}
                    {filters.status
                      .replace("_", " ")
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    <button
                      onClick={() => clearFilter("status")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {filters.location && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Location: {formatLocation(filters.location)}
                    <button
                      onClick={() => clearFilter("location")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {filters.search && (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    Search: "{filters.search}"
                    <button
                      onClick={() => clearFilter("search")}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
