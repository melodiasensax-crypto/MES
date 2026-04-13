"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { toast } from "sonner";

export default function ReviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Por favor selecciona una calificación");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Error al enviar la reseña");
        return;
      }

      setSubmitted(true);
      toast.success("¡Gracias por tu reseña!");
    } catch (error) {
      console.error(error);
      toast.error("Error al enviar la reseña");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-center p-8">
          <div className="mb-4 text-4xl">✨</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            ¡Gracias por tu reseña!
          </h1>
          <p className="text-slate-300 mb-6">
            Tu opinión nos ayuda a mejorar continuamente. Apreciamos tu tiempo.
          </p>
          <Button asChild variant="default" className="w-full">
            <a href="https://wa.me">Volver a WhatsApp</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Déjanos tu reseña</h1>
        <p className="text-slate-300 mb-6">
          Tu opinión es muy importante para nosotros. Cuéntanos tu experiencia.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-3">
              Calificación
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-500"
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {rating > 0 ? `${rating} de 5 estrellas` : "Selecciona una puntuación"}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">
              Comentario (opcional)
            </label>
            <Textarea
              placeholder="Cuéntanos qué te pareció..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
              rows={4}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? "Enviando..." : "Enviar reseña"}
          </Button>
        </form>

        <p className="text-xs text-slate-400 text-center mt-4">
          Tu reseña se publicará en {token ? "la plataforma seleccionada" : "plataformas de reseñas"}
        </p>
      </Card>
    </div>
  );
}
