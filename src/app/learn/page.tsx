"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  Filter,
  GraduationCap,
  Play,
  PlayCircle,
  Search,
  Star,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduleCallButton } from "@/components/cta/ScheduleCallButton";

// Demo courses data
const courses = [
  {
    id: "futures-basics",
    title: "Futures Trading Fundamentals",
    description: "Master the basics of futures trading, from contract specifications to margin requirements.",
    instructor: "TopTrader_Mike",
    instructorImage: undefined,
    level: "Beginner",
    duration: "2h 45m",
    lessons: 12,
    students: 3420,
    rating: 4.8,
    reviews: 284,
    thumbnail: undefined,
    progress: 0,
    tags: ["Futures", "Basics", "ES", "NQ"],
    isFree: true,
  },
  {
    id: "scalping-masterclass",
    title: "ES Scalping Masterclass",
    description: "Learn professional scalping techniques for the E-mini S&P 500 futures market.",
    instructor: "ScalpKing",
    instructorImage: undefined,
    level: "Intermediate",
    duration: "4h 20m",
    lessons: 18,
    students: 1856,
    rating: 4.9,
    reviews: 156,
    thumbnail: undefined,
    progress: 35,
    tags: ["Scalping", "ES", "Price Action"],
    isFree: false,
    price: 99,
  },
  {
    id: "risk-management",
    title: "Risk Management for Traders",
    description: "Protect your capital with proven risk management strategies used by professional traders.",
    instructor: "RiskMaster",
    instructorImage: undefined,
    level: "All Levels",
    duration: "1h 30m",
    lessons: 8,
    students: 5240,
    rating: 4.7,
    reviews: 412,
    thumbnail: undefined,
    progress: 100,
    tags: ["Risk", "Psychology", "Capital Management"],
    isFree: true,
  },
  {
    id: "order-flow",
    title: "Order Flow Analysis",
    description: "Decode institutional activity using footprint charts, volume profile, and delta analysis.",
    instructor: "FlowTrader",
    instructorImage: undefined,
    level: "Advanced",
    duration: "6h 15m",
    lessons: 24,
    students: 892,
    rating: 4.9,
    reviews: 89,
    thumbnail: undefined,
    progress: 0,
    tags: ["Order Flow", "Volume Profile", "Footprint"],
    isFree: false,
    price: 199,
  },
  {
    id: "trading-psychology",
    title: "Trading Psychology & Mindset",
    description: "Develop the mental discipline and emotional control needed for consistent profitability.",
    instructor: "MindfulTrader",
    instructorImage: undefined,
    level: "All Levels",
    duration: "3h 00m",
    lessons: 15,
    students: 4120,
    rating: 4.8,
    reviews: 328,
    thumbnail: undefined,
    progress: 60,
    tags: ["Psychology", "Mindset", "Discipline"],
    isFree: false,
    price: 49,
  },
  {
    id: "nq-strategies",
    title: "NQ Trading Strategies",
    description: "Specific strategies for trading the Nasdaq-100 futures with high volatility setups.",
    instructor: "TechTrader",
    instructorImage: undefined,
    level: "Intermediate",
    duration: "3h 45m",
    lessons: 14,
    students: 1240,
    rating: 4.6,
    reviews: 98,
    thumbnail: undefined,
    progress: 0,
    tags: ["NQ", "Strategies", "Volatility"],
    isFree: false,
    price: 79,
  },
];

// Demo learning paths
const learningPaths = [
  {
    id: "beginner-trader",
    title: "Beginner Trader Path",
    description: "Start your trading journey with the essential skills and knowledge.",
    courses: 4,
    duration: "8h 30m",
    students: 2840,
    icon: GraduationCap,
    color: "bg-green-500",
  },
  {
    id: "scalper-pro",
    title: "Professional Scalper",
    description: "Master the art of quick in-and-out trades with precision execution.",
    courses: 6,
    duration: "14h 20m",
    students: 1560,
    icon: Zap,
    color: "bg-yellow-500",
  },
  {
    id: "swing-trader",
    title: "Swing Trading Mastery",
    description: "Learn to capture multi-day moves in futures markets.",
    courses: 5,
    duration: "11h 45m",
    students: 980,
    icon: TrendingUp,
    color: "bg-blue-500",
  },
];

// Demo live sessions
const liveSessions = [
  {
    id: "1",
    title: "Market Open Analysis",
    instructor: "TopTrader_Mike",
    time: "9:30 AM ET",
    date: "Daily",
    attendees: 245,
    isLive: true,
  },
  {
    id: "2",
    title: "Weekly Trade Review",
    instructor: "ScalpKing",
    time: "4:00 PM ET",
    date: "Fridays",
    attendees: 180,
    isLive: false,
  },
  {
    id: "3",
    title: "Q&A with Pro Traders",
    instructor: "Multiple",
    time: "7:00 PM ET",
    date: "Wednesdays",
    attendees: 320,
    isLive: false,
  },
];

function CourseCard({ course }: { course: typeof courses[0] }) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-500/10 text-green-500";
      case "Intermediate":
        return "bg-yellow-500/10 text-yellow-500";
      case "Advanced":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-blue-500/10 text-blue-500";
    }
  };

  return (
    <Card className="group hover:border-primary/50 transition-colors">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary overflow-hidden rounded-t-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center group-hover:bg-primary/80 transition-colors">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
        {course.isFree && (
          <Badge className="absolute top-2 left-2 bg-green-600">Free</Badge>
        )}
        {course.progress > 0 && course.progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0">
            <Progress value={course.progress} className="h-1 rounded-none" />
          </div>
        )}
        {course.progress === 100 && (
          <div className="absolute top-2 right-2">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className={getLevelColor(course.level)}>
            {course.level}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.duration}
          </span>
        </div>

        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {course.description}
        </p>

        <div className="flex items-center gap-2 mb-3">
          <Avatar className="w-6 h-6">
            <AvatarImage src={course.instructorImage} />
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">
              {course.instructor.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{course.instructor}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              {course.rating}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {course.students.toLocaleString()}
            </span>
          </div>
          {!course.isFree && course.price && (
            <span className="font-bold">${course.price}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LearnPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesLevel = !selectedLevel || course.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  // Courses in progress
  const inProgressCourses = courses.filter(
    (c) => c.progress > 0 && c.progress < 100
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl">
            <Badge className="mb-4" variant="secondary">
              <GraduationCap className="w-3 h-3 mr-1" />
              Learning Hub
            </Badge>
            <h1 className="text-4xl font-bold mb-4">
              Learn to Trade Like a Pro
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Master futures trading with courses from verified profitable traders.
              From basics to advanced strategies, we've got you covered.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                {courses.length}+ Courses
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                10,000+ Students
              </span>
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Expert Instructors
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Continue Learning */}
        {inProgressCourses.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <PlayCircle className="w-6 h-6" />
              Continue Learning
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inProgressCourses.map((course) => (
                <Link key={course.id} href={`/learn/${course.id}`}>
                  <CourseCard course={course} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Learning Paths */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Learning Paths
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {learningPaths.map((path) => (
              <Card
                key={path.id}
                className="hover:border-primary/50 transition-colors cursor-pointer"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-lg ${path.color} flex items-center justify-center mb-4`}
                  >
                    <path.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{path.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {path.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{path.courses} courses</span>
                    <span>{path.duration}</span>
                    <span>{path.students.toLocaleString()} enrolled</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Live Sessions */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Video className="w-6 h-6" />
              Live Sessions
            </h2>
            <Button variant="outline" size="sm">
              View Schedule
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {liveSessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{session.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        with {session.instructor}
                      </p>
                    </div>
                    {session.isLive && (
                      <Badge variant="destructive" className="gap-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {session.date} at {session.time}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3 h-3" />
                      {session.attendees}
                    </span>
                  </div>
                  {session.isLive && (
                    <Button className="w-full mt-3" size="sm">
                      Join Now
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* All Courses */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              All Courses
            </h2>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Tabs
              value={selectedLevel || "all"}
              onValueChange={(v) => setSelectedLevel(v === "all" ? null : v)}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="Beginner">Beginner</TabsTrigger>
                <TabsTrigger value="Intermediate">Intermediate</TabsTrigger>
                <TabsTrigger value="Advanced">Advanced</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Course Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link key={course.id} href={`/learn/${course.id}`}>
                <CourseCard course={course} />
              </Link>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No courses found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">
                  Ready to Start Learning?
                </h3>
                <p className="text-muted-foreground">
                  Get unlimited access to all courses with TradeTV Pro. Learn from
                  verified profitable traders and accelerate your trading journey.
                </p>
              </div>
              <div className="flex gap-3">
                <Button size="lg">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <ScheduleCallButton size="lg" variant="outline">
                  Book a Demo
                </ScheduleCallButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
