"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Loader2, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * Category type from the API
 */
interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  type: "blog" | "doc";
  createdAt: Date;
}

interface CategoryComboboxProps {
  /** Currently selected category ID */
  value: number | undefined;
  /** Callback when category is selected */
  onValueChange: (categoryId: number) => void;
  /** Content type filter (blog or doc) */
  type?: "blog" | "doc";
  /** Placeholder text when no category is selected */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether the combobox is disabled */
  disabled?: boolean;
}

/**
 * CategoryCombobox - A combobox component for selecting or creating categories
 *
 * Features:
 * - Search and filter existing categories
 * - Create new categories on the fly by typing and pressing Enter
 * - Displays loading state during category creation
 * - Shows error messages via toast notifications
 */
export function CategoryCombobox({
  value,
  onValueChange,
  type = "blog",
  placeholder = "Select a category...",
  className,
  disabled = false,
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Fetch categories list
  const { data: categories = [], isLoading: isCategoriesLoading } =
    trpc.category.list.useQuery({ type });

  // Find or create category mutation
  const utils = trpc.useUtils();
  const findOrCreateMutation = trpc.category.findOrCreate.useMutation({
    onSuccess: (newCategory) => {
      // Invalidate categories list to refresh
      utils.category.list.invalidate();
      // Select the newly created/found category
      onValueChange(newCategory.id);
      // Clear input and close popover
      setInputValue("");
      setOpen(false);
      // Show success toast only if it was a new category
      if (!categories.some((cat) => cat.id === newCategory.id)) {
        toast.success(`Category "${newCategory.name}" created successfully`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create category");
    },
  });

  // Get the currently selected category
  const selectedCategory = categories.find((cat) => cat.id === value);

  // Filter categories based on input value
  const filteredCategories = React.useMemo(() => {
    if (!inputValue) return categories;
    const searchTerm = inputValue.toLowerCase();
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchTerm)
    );
  }, [categories, inputValue]);

  // Check if input matches any existing category exactly
  const exactMatchExists = React.useMemo(() => {
    if (!inputValue) return false;
    const searchTerm = inputValue.toLowerCase().trim();
    return categories.some((cat) => cat.name.toLowerCase() === searchTerm);
  }, [categories, inputValue]);

  // Handle creating a new category
  const handleCreateCategory = () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    findOrCreateMutation.mutate({
      name: trimmedInput,
      type,
    });
  };

  // Handle selecting an existing category
  const handleSelectCategory = (categoryId: number) => {
    onValueChange(categoryId);
    setInputValue("");
    setOpen(false);
  };

  // Handle keydown events for creating new category with Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim() && !exactMatchExists) {
      e.preventDefault();
      handleCreateCategory();
    }
  };

  const isCreating = findOrCreateMutation.isPending;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isCreating}
          className={cn(
            "w-full justify-between border-2 border-border font-medium",
            !selectedCategory && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Folder className="h-4 w-4 shrink-0" />
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : selectedCategory ? (
              selectedCategory.name
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or create category..."
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={handleKeyDown}
          />
          <CommandList>
            {isCategoriesLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading categories...
                </span>
              </div>
            ) : (
              <>
                {/* Show "Create new" option when input doesn't match any existing category */}
                {inputValue.trim() && !exactMatchExists && (
                  <CommandGroup heading="Create new">
                    <CommandItem
                      onSelect={handleCreateCategory}
                      className="cursor-pointer"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      <span>
                        Create &quot;{inputValue.trim()}&quot;
                      </span>
                    </CommandItem>
                  </CommandGroup>
                )}

                {/* Existing categories */}
                {filteredCategories.length > 0 ? (
                  <CommandGroup heading="Categories">
                    {filteredCategories.map((category) => (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => handleSelectCategory(category.id)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === category.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span>{category.name}</span>
                        {category.description && (
                          <span className="ml-2 text-xs text-muted-foreground truncate">
                            {category.description}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  !inputValue.trim() && (
                    <CommandEmpty>No categories found.</CommandEmpty>
                  )
                )}

                {/* Empty state when filtering shows no results */}
                {inputValue.trim() &&
                  filteredCategories.length === 0 &&
                  exactMatchExists && (
                    <CommandEmpty>No matching categories.</CommandEmpty>
                  )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
