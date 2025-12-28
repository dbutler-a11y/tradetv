"use client";

import { useState } from "react";
import { MessageSquare, Star, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Review {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  helpful: number;
  isCopier: boolean;
  copyDuration?: string;
}

interface TraderReviewsProps {
  traderId: string;
  reviews?: Review[];
}

// Demo reviews data
const demoReviews: Review[] = [
  {
    id: "review-1",
    userId: "user-1",
    userName: "TradingNewbie22",
    rating: 5,
    title: "Changed my trading completely",
    content:
      "Been copying Mike for 3 months now. His entries are precise and he always explains his reasoning. The morning sessions are gold. Highly recommend for anyone wanting to learn ES scalping.",
    date: "1 week ago",
    helpful: 24,
    isCopier: true,
    copyDuration: "3 months",
  },
  {
    id: "review-2",
    userId: "user-2",
    userName: "FuturesTrader_Pro",
    userImage: undefined,
    rating: 4,
    title: "Great trader, solid returns",
    content:
      "Consistent results month over month. Only giving 4 stars because the stream schedule can be unpredictable sometimes. But when he's on, he delivers.",
    date: "2 weeks ago",
    helpful: 18,
    isCopier: true,
    copyDuration: "6 months",
  },
  {
    id: "review-3",
    userId: "user-3",
    userName: "DayTraderJim",
    rating: 5,
    title: "Best ES scalper I've followed",
    content:
      "Mike's risk management is top tier. Even on losing days, the drawdown is minimal. His NQ reads during high vol are impressive.",
    date: "3 weeks ago",
    helpful: 31,
    isCopier: true,
    copyDuration: "8 months",
  },
  {
    id: "review-4",
    userId: "user-4",
    userName: "CryptoToFutures",
    rating: 3,
    title: "Good but not for small accounts",
    content:
      "Trading style is aggressive. You need a decent account size to follow properly. Great if you have $50k+, but struggles with smaller scaling.",
    date: "1 month ago",
    helpful: 12,
    isCopier: false,
  },
];

const ratingBreakdown = {
  5: 65,
  4: 22,
  3: 8,
  2: 3,
  1: 2,
};

export function TraderReviews({ traderId, reviews }: TraderReviewsProps) {
  const reviewData = reviews || demoReviews;
  const [sortBy, setSortBy] = useState("helpful");
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Calculate average rating
  const avgRating =
    reviewData.reduce((acc, r) => acc + r.rating, 0) / reviewData.length || 0;

  // Sort reviews
  const sortedReviews = [...reviewData].sort((a, b) => {
    if (sortBy === "helpful") return b.helpful - a.helpful;
    if (sortBy === "recent") return 0; // Would sort by date
    if (sortBy === "highest") return b.rating - a.rating;
    if (sortBy === "lowest") return a.rating - b.rating;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Overall Rating */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-5xl font-bold">{avgRating.toFixed(1)}</div>
            <div className="flex items-center justify-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(avgRating)
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {reviewData.length} reviews
            </p>
          </div>

          {/* Rating Breakdown */}
          <div className="flex-1 space-y-1.5">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm w-3">{rating}</span>
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                <Progress
                  value={ratingBreakdown[rating as keyof typeof ratingBreakdown]}
                  className="h-2 flex-1"
                />
                <span className="text-xs text-muted-foreground w-8">
                  {ratingBreakdown[rating as keyof typeof ratingBreakdown]}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review CTA */}
        <div className="flex flex-col justify-center items-center p-6 rounded-lg bg-secondary/30">
          <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center mb-3">
            Have you copied this trader? Share your experience!
          </p>
          <Button onClick={() => setShowWriteReview(!showWriteReview)}>
            Write a Review
          </Button>
        </div>
      </div>

      {/* Write Review Form */}
      {showWriteReview && (
        <div className="p-6 rounded-lg border bg-card space-y-4">
          <h4 className="font-medium">Write Your Review</h4>

          {/* Star Rating */}
          <div>
            <label className="text-sm text-muted-foreground">Your Rating</label>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setNewRating(star)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= (hoverRating || newRating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="text-sm text-muted-foreground">Your Review</label>
            <Textarea
              placeholder="Share your experience copying this trader..."
              className="mt-1"
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button>Submit Review</Button>
            <Button variant="outline" onClick={() => setShowWriteReview(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Sort & Filter */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Reviews</h4>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="helpful">Most Helpful</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="highest">Highest Rated</SelectItem>
            <SelectItem value="lowest">Lowest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {sortedReviews.map((review) => (
          <div key={review.id} className="p-4 rounded-lg border">
            <div className="flex items-start gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={review.userImage} />
                <AvatarFallback>
                  {review.userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{review.userName}</span>
                  {review.isCopier && (
                    <Badge variant="secondary" className="text-xs">
                      Copier • {review.copyDuration}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= review.rating
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {review.date}
                  </span>
                </div>

                <h5 className="font-medium mt-2">{review.title}</h5>
                <p className="text-sm text-muted-foreground mt-1">
                  {review.content}
                </p>

                <div className="flex items-center gap-4 mt-3">
                  <Button variant="ghost" size="sm" className="gap-1.5 h-8">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Helpful ({review.helpful})
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline">Load More Reviews</Button>
      </div>
    </div>
  );
}
