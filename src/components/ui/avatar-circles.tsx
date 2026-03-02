"use client"

import React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface AvatarCirclesProps {
  className?: string
  numPeople?: number
  avatarUrls: string[]
}

const AvatarCircles = ({
  numPeople,
  className,
  avatarUrls,
}: AvatarCirclesProps) => {
  return (
    <div className={cn("z-10 flex -space-x-4 rtl:space-x-reverse", className)}>
      {avatarUrls.map((url, index) => (
        <Image
          key={index}
          className="h-10 w-10 rounded-full border-2 border-white object-cover"
          src={url}
          width={40}
          height={40}
          alt={`Avatar ${index + 1}`}
        />
      ))}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-center text-xs font-semibold text-blue-700"
      >
        +{numPeople}
      </div>
    </div>
  )
}

export { AvatarCircles }