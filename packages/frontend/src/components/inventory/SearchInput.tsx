import { useState, useRef, useCallback, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '../ui/input'
import type { ItemFilters } from '../../lib/api'

interface SearchInputProps {
  initialValue?: string
  onSearch: (searchText: string) => void
  loading?: boolean
  placeholder?: string
}

// Isolated search input component that maintains its own state
// This prevents re-renders from parent component affecting focus
export function SearchInput({ 
  initialValue = '', 
  onSearch, 
  loading = false, 
  placeholder = "Search items by name or description..." 
}: SearchInputProps) {
  const [searchText, setSearchText] = useState(initialValue)
  const debounceTimeout = useRef<NodeJS.Timeout>()

  // Update local state when initialValue changes (e.g., when filters are cleared)
  useEffect(() => {
    setSearchText(initialValue)
  }, [initialValue])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
    }
  }, [])

  // Debounced search that doesn't cause parent re-renders
  const debouncedSearch = useCallback((value: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
    }

    debounceTimeout.current = setTimeout(() => {
      onSearch(value)
    }, 300)
  }, [onSearch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchText(value)
    debouncedSearch(value)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Clear debounce timeout and search immediately
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current)
      }
      onSearch(searchText)
    }
  }

  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input 
        placeholder={placeholder}
        className="pl-10"
        value={searchText}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        disabled={loading}
      />
    </div>
  )
}