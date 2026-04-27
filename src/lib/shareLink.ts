import { toast } from "sonner";

export const buildPublicLink = (
  tipo: "social" | "time",
  liderId: string
): string => `${window.location.origin}/c/${tipo}/${liderId}`;

export const copyPublicLink = async (
  tipo: "social" | "time",
  liderId: string,
  liderNome?: string
) => {
  const url = buildPublicLink(tipo, liderId);
  try {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cadastro Tubarão ${tipo === "social" ? "Social" : "Time"}`,
          text: liderNome
            ? `Faça seu cadastro com ${liderNome}`
            : "Faça seu cadastro",
          url,
        });
        return;
      } catch {
        // user cancelou share — cai no clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado!", { description: url });
  } catch {
    toast.error("Não foi possível copiar. Copie manualmente:", {
      description: url,
      duration: 8000,
    });
  }
};
