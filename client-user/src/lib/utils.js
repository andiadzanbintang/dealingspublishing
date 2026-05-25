import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function formatDate(date) {
    return new Date(date).toLocaleDateString(
        'en-US',
        {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }
    )
}

export function truncateText(text, maxLength=120) {
    if(!text) return ""
    if(text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
}

export function slugify(text){
    return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-') 
}