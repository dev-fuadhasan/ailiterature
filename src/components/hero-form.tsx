"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Calendar, Hash, Search } from "lucide-react"

interface HeroFormProps {
  isSignedIn: boolean
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i)

export function HeroForm({ isSignedIn }: HeroFormProps) {
  const router = useRouter()
  const [topic, setTopic] = useState("")
  const [yearFrom, setYearFrom] = useState(String(currentYear - 5))
  const [yearTo, setYearTo] = useState(String(currentYear))
  const [maxPapers, setMaxPapers] = useState("20")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!topic.trim()) {
      return
    }

    if (!isSignedIn) {
      // Redirect to login
      router.push("/login")
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          yearFrom: parseInt(yearFrom),
          yearTo: parseInt(yearTo),
          maxPapers: parseInt(maxPapers),
        }),
      })

      if (response.ok) {
        const { projectId } = await response.json()
        router.push(`/project/${projectId}`)
      } else {
        console.error("Failed to create project")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error creating project:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full bg-white/80 backdrop-blur-lg border border-gray-200/60 rounded-3xl p-8 shadow-2xl ring-1 ring-gray-900/5">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Start Your Review</h3>
          <p className="text-xs text-gray-500">Get instant insights</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="topic" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5 text-blue-600" />
            Research Topic
          </Label>
          <Input
            id="topic"
            type="text"
            placeholder="e.g., deep learning for medical imaging"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="h-11 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            Publication Year Range
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">From</label>
              <Select value={yearFrom} onValueChange={setYearFrom}>
                <SelectTrigger className="h-10 bg-white/50 border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-gray-900 cursor-pointer">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">To</label>
              <Select value={yearTo} onValueChange={setYearTo}>
                <SelectTrigger className="h-10 bg-white/50 border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)} className="text-gray-900 cursor-pointer">{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="papers" className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-blue-600" />
            Number of Papers
          </Label>
          <Select value={maxPapers} onValueChange={setMaxPapers}>
            <SelectTrigger className="h-11 bg-white/50 border-gray-200 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="20" className="text-gray-900 cursor-pointer">20 papers</SelectItem>
              <SelectItem value="30" className="text-gray-900 cursor-pointer">30 papers</SelectItem>
              <SelectItem value="50" className="text-gray-900 cursor-pointer">50 papers</SelectItem>
              <SelectItem value="60" className="text-gray-900 cursor-pointer">60 papers</SelectItem>
              <SelectItem value="80" className="text-gray-900 cursor-pointer">80 papers</SelectItem>
              <SelectItem value="100" className="text-gray-900 cursor-pointer">100 papers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all duration-300"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Starting Review...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Start Literature Review
            </span>
          )}
        </Button>
      </form>
    </div>
  )
}
