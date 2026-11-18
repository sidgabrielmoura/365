"use client";

import { useState, type FormEvent } from "react";
import { useSite } from "@/lib/site-context";
import { ModulePage, Status, usePanel, usePanelAction } from "./module-ui";

const hex = /^#(?:[a-f\d]{3}|[a-f\d]{6})$/i;

function ThemeForm({ token, initial }: { token: string; initial: Record<string, string> }) {
  const [colors, setColors] = useState(Object.entries(initial));
  const save = usePanelAction();
  const [error, setError] = useState("");
  function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const keys = colors.map(([key]) => key.trim());
    if (!keys.length || keys.some((key) => !key) || new Set(keys).size !== keys.length ||
        colors.some(([, value]) => !hex.test(value.trim()))) {
      setError("Informe nomes únicos e valores hexadecimais válidos.");
      return;
    }
    if (window.confirm("Salvar esta lista como o tema completo do site?"))
      void save.execute("/api/site/save-theme-color", "POST", {
        token, colors: colors.map(([, value], index) => ({ key: keys[index], value: value.trim() })),
      });
  }
  return <form onSubmit={submit}>
    {colors.map(([key, value], index) => <p key={index}>
      <label>Variável <input required value={key} onChange={(event) =>
        setColors(colors.map((row, position) => position === index ? [event.target.value, value] : row))} /></label>{" "}
      <label>Cor <input required value={value} placeholder="#123456" onChange={(event) =>
        setColors(colors.map((row, position) => position === index ? [key, event.target.value] : row))} /></label>{" "}
      <button type="button" onClick={() => setColors(colors.filter((_, position) => position !== index))}>Remover</button>
    </p>)}
    <button className="button" type="button" onClick={() => setColors([...colors, ["", ""]])}>Adicionar variável</button>{" "}
    <button className="button button-accent" disabled={save.busy}>Salvar tema</button>
    <Status error={error || save.error} text={save.result?.status === true ? "Tema salvo no painel." : undefined} />
  </form>;
}

export function ThemeEditor({ token }: { token: string }) {
  const { runtime } = useSite();
  const session = usePanel(runtime.mode === "backoffice" && token
    ? "/api/site/validate-theme-builder?" + new URLSearchParams({ token }) : null);
  return <ModulePage title="Editor de tema">
    <Status error={session.error} text={!token ? "Abra o editor pelo link do painel." : session.loading ? "Validando link…" : undefined} />
    {Boolean(session.data) && runtime.tenant && <ThemeForm token={token} initial={runtime.tenant.custom_theme} />}
  </ModulePage>;
}
