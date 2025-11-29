import * as React from 'react'
import { cn } from '@/lib/utils'

// Minimal pagination stub - not used in this project
export const Pagination = ({ children }) => <nav>{children}</nav>
export const PaginationContent = ({ children }) => <ul>{children}</ul>
export const PaginationItem = ({ children }) => <li>{children}</li>
export const PaginationLink = ({ children }) => <a>{children}</a>
export const PaginationPrevious = ({ children }) => <button>{children}</button>
export const PaginationNext = ({ children }) => <button>{children}</button>
export const PaginationEllipsis = () => <span>...</span>