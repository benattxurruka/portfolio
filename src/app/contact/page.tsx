import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contacto",
};

export default function ContactPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
            <Mail className="w-6 h-6 text-ink-secondary" />
          </div>
          <h1 className="text-2xl font-semibold text-ink-primary">Contacto</h1>
        </div>
        <p className="text-ink-secondary ml-14">
          ¿Tienes alguna pregunta o quieres comprar una impresión? Escríbeme.
        </p>
      </div>

      <div className="bg-surface-1 border border-border rounded-2xl p-6">
        <ContactForm />
      </div>
    </div>
  );
}
