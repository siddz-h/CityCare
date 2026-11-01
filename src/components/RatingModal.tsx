import React, { useState } from 'react';
import { Appointment } from '../types';
import { Star, MessageSquare, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RatingModalProps {
  appointment: Appointment;
  onSubmitRating: (rating: number, review: string) => void;
  onClose: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  appointment,
  onSubmitRating,
  onClose,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(5);
  const [review, setReview] = useState('Excellent consultation. The doctor took time to listen to my symptoms and explained the treatment clearly.');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    setTimeout(() => {
      onSubmitRating(rating, review);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Rate Your Doctor Consultation</h3>
              <p className="text-xs text-slate-500">Token: {appointment.tokenNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Doctor Info */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-900 block text-sm">{appointment.doctorName}</span>
            <span className="text-teal-700 font-semibold">{appointment.doctorSpeciality}</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">{appointment.hospitalName}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star selector */}
          <div className="text-center space-y-1">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              Select Star Rating
            </span>
            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(rating)}
                  onClick={() => setRating(star)}
                  className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-amber-700">
              {rating === 5 ? '5.0 - Outstanding Experience' : `${rating}.0 - Good Consultation`}
            </span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Write Your Feedback / Clinical Experience:
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={3}
              placeholder="How was your consultation experience with the doctor?"
              className="w-full p-3 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit Rating</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
