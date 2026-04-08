"use client"

import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showTagline?: boolean
  className?: string
}

export function Logo({ size = "md", showTagline = false, className }: LogoProps) {
  const sizes = {
    sm: { text: "text-xl", icon: "w-8 h-8", tagline: "text-xs" },
    md: { text: "text-2xl", icon: "w-10 h-10", tagline: "text-sm" },
    lg: { text: "text-4xl", icon: "w-14 h-14", tagline: "text-base" },
  }

  const s = sizes[size]

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Ícone estilizado */}
      <div className={cn("relative", s.icon)}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl rotate-6 opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-2/3 h-2/3 text-white"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
      </div>
      
      {/* Texto */}
      <div className="flex flex-col">
        <span className={cn("font-bold tracking-tight", s.text)}>
          <span className="text-foreground">Raro</span>
          <span className="text-primary">tec</span>
        </span>
        {showTagline && (
          <span className={cn("text-muted-foreground -mt-1", s.tagline)}>
            Soluções em Tecnologia
          </span>
        )}
      </div>
    </div>
  )
}
