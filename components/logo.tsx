"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showTagline?: boolean
  className?: string
}

const sizes = {
  sm: { width: 120, height: 40, className: "h-8" },
  md: { width: 150, height: 50, className: "h-10" },
  lg: { width: 200, height: 67, className: "h-14" },
}

export function Logo({ size = "md", showTagline = false, className }: LogoProps) {
  const sizeConfig = sizes[size]

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <Image
        src="/logo-rarotec.png"
        alt="Rarotec"
        width={sizeConfig.width}
        height={sizeConfig.height}
        className={cn(sizeConfig.className, "w-auto object-contain")}
        priority
      />
      {showTagline && (
        <p className="text-sm text-muted-foreground">Sistema de Relatórios Técnicos</p>
      )}
    </div>
  )
}
