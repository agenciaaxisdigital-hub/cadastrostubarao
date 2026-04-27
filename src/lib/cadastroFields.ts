// Campos compartilhados entre cadastro interno (admin/lideranca) e público.
// Usado em src/components/CadastroForm.tsx e src/pages/PublicCadastro.tsx.

export interface CadastroFormData {
  nome: string;
  cpf: string;
  telefone: string; // WhatsApp
  instagram: string;
  titulo_eleitor: string;
  zona: string;
  secao: string;
  municipio: string;
  uf: string;
  colegio_eleitoral: string;
  observacoes: string;
}

export const defaultCadastroForm: CadastroFormData = {
  nome: "",
  cpf: "",
  telefone: "",
  instagram: "",
  titulo_eleitor: "",
  zona: "",
  secao: "",
  municipio: "",
  uf: "GO",
  colegio_eleitoral: "",
  observacoes: "",
};

export const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const maskCPF = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

export const maskInstagram = (v: string) => {
  const cleaned = v.trim().replace(/^@+/, "").replace(/\s/g, "");
  return cleaned ? `@${cleaned}` : "";
};

export const onlyDigits = (v: string, max?: number) => {
  const d = v.replace(/\D/g, "");
  return max ? d.slice(0, max) : d;
};

export const upperLetters = (v: string, max = 2) =>
  v.replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, max);

export const validateCadastro = (form: CadastroFormData) => {
  const errs: Record<string, string> = {};
  if (!form.nome.trim()) errs.nome = "Nome é obrigatório";
  const cpfDigits = form.cpf.replace(/\D/g, "");
  if (!cpfDigits) errs.cpf = "CPF é obrigatório";
  else if (cpfDigits.length !== 11) errs.cpf = "CPF deve ter 11 dígitos";
  if (!form.telefone.trim()) errs.telefone = "WhatsApp é obrigatório";
  if (!form.instagram.trim() || form.instagram === "@")
    errs.instagram = "Instagram é obrigatório";
  if (!form.titulo_eleitor.trim()) errs.titulo_eleitor = "Título de eleitor é obrigatório";
  if (!form.zona.trim()) errs.zona = "Zona é obrigatória";
  if (!form.secao.trim()) errs.secao = "Seção é obrigatória";
  if (!form.municipio.trim()) errs.municipio = "Município é obrigatório";
  if (!form.colegio_eleitoral.trim()) errs.colegio_eleitoral = "Colégio eleitoral é obrigatório";
  return errs;
};

export const buildPayload = (form: CadastroFormData) => ({
  nome: form.nome.trim(),
  cpf: form.cpf.replace(/\D/g, "") || null,
  telefone: form.telefone.replace(/\D/g, "") || null,
  instagram: form.instagram.trim() || null,
  titulo_eleitor: form.titulo_eleitor.replace(/\D/g, "") || null,
  zona: form.zona.replace(/\D/g, "") || null,
  secao: form.secao.replace(/\D/g, "") || null,
  municipio: form.municipio.trim() || null,
  uf: form.uf.trim().toUpperCase() || null,
  colegio_eleitoral: form.colegio_eleitoral.trim() || null,
  observacoes: form.observacoes.trim() || null,
});
