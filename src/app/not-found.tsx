import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="section-page">
      <h1>Página não encontrada</h1>
      <p>O endereço solicitado não está disponível.</p>
      <Link className="button button-accent" href="/">
        Voltar ao início
      </Link>
    </main>
  );
}
