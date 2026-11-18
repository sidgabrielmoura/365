"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/dialog";
import { useSite } from "@/lib/site-context";
import { ORIGINAL_BRAND, ORIGINAL_LOGO } from "@/lib/backoffice/branding";

export function RecaptchaNote() {
  return (
    <p className="recaptcha-notice">
      Protegido pelo reCAPTCHA. Aplicam-se a{" "}
      <a
        href="https://policies.google.com/privacy"
        target="_blank"
        rel="noreferrer"
      >
        Política de Privacidade
      </a>{" "}
      e os{" "}
      <a
        href="https://policies.google.com/terms"
        target="_blank"
        rel="noreferrer"
      >
        Termos de Serviço
      </a>{" "}
      do Google.
    </p>
  );
}

export function AuthDialog({
  register = false,
  forgot = false,
}: {
  register?: boolean;
  forgot?: boolean;
}) {
  const { request, closeModal, openModal, runtime, notify } = useSite();
  const remote = runtime.mode === "backoffice";
  const branding = runtime.branding;
  const logo = branding ? branding.logo ?? branding.icon : ORIGINAL_LOGO;
  const [failedLogo, setFailedLogo] = useState<string>();
  const showLogo = logo && failedLogo !== logo;
  const registrationMode = remote ? runtime.settings.register_mode || "default" : "default";
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (forgot) {
      setError(
        remote ? "Fale com o suporte para recuperar seu acesso." : "As contas desta cópia são locais. Crie outra conta fictícia para explorar a demonstração.",
      );
      return;
    }
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    try {
      await request({
        action: register ? "register" : "login",
        name: fields.name,
        email: fields.identifier || fields.email,
        password: fields.password,
        ...(remote && register ? {
          username: fields.username, cpf: fields.cpf, phone: fields.phone,
          adult: fields.adult === "on",
          partner: new URLSearchParams(window.location.search).get("ref") || undefined,
        } : {}),
      });
      if (remote && register) {
        notify("Conta criada com sucesso. Entre para continuar.");
        openModal({ kind: "login" });
        return;
      }
      closeModal();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function explore() {
    setBusy(true);
    try {
      await request({ action: "demo" });
      closeModal();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const title = register
    ? "Registre-se"
    : forgot
      ? "Recuperar acesso"
      : "Login";
  if (register)
    return (
      <Dialog
        title={title}
        className="registration-dialog"
        onClose={closeModal}
      >
        <header className="registration-header">
          <img
            className="registration-brand"
            src={showLogo ? logo : undefined}
            hidden={!showLogo}
            alt={branding?.name ?? ORIGINAL_BRAND}
            onError={branding && logo ? () => setFailedLogo(logo) : undefined}
            width={180}
            height={38}
          />
          <h2 className="registration-title">Registre-se</h2>
        </header>
        <div className="registration-body">
          <p className="registration-intro">
            {registrationMode === "phone" ? "Use seu celular para entrar na conta."
              : registrationMode === "username" ? "Escolha o nome de usuário para entrar na conta."
              : "Crie sua conta em poucos segundos. Seu e-mail será usado para entrar e para avisos importantes da conta."}
          </p>
          <form className="registration-form" onSubmit={submit}>
            <div className="registration-fields">
              <label className="registration-control">
                <span className="sr-only">Nome completo</span>
                <input
                  name="name"
                  placeholder="Nome completo"
                  autoComplete="name"
                  required={!remote || registrationMode === "default"}
                  minLength={remote ? 3 : 5}
                  maxLength={remote ? 150 : 120}
                />
              </label>
              <label className="registration-control">
                <span className="sr-only">{remote ? "CPF" : "CPF fictício"}</span>
                <input
                  name="cpf"
                  placeholder="CPF"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={14}
                  required={remote && registrationMode === "default"}
                  disabled={remote && registrationMode !== "default"}
                />
              </label>
              <label className="registration-control">
                <span className="sr-only">{registrationMode === "username" ? "Nome de usuário" : "Endereço de e-mail"}</span>
                <input
                  name={registrationMode === "username" ? "username" : "email"}
                  type={registrationMode === "username" ? "text" : "email"}
                  placeholder={registrationMode === "username" ? "Nome de usuário" : "Endereço de e-mail"}
                  autoComplete={registrationMode === "username" ? "username" : "email"}
                  required={registrationMode !== "phone"}
                  maxLength={254}
                />
              </label>
              <label className="registration-control phone-control">
                <span className="sr-only">Número de celular com DDD</span>
                <span className="phone-prefix" aria-hidden="true">
                  +55
                </span>
                <input
                  name="phone"
                  type="tel"
                  placeholder="Número de celular"
                  inputMode="tel"
                  autoComplete="tel-national"
                  maxLength={15}
                  required={remote && registrationMode !== "username"}
                  disabled={remote && registrationMode === "username"}
                />
              </label>
              <div className="registration-control password-control">
                <label className="sr-only" htmlFor="registration-password">
                  Senha
                </label>
                <input
                  id="registration-password"
                  name="password"
                  type={show ? "text" : "password"}
                  placeholder="Senha"
                  autoComplete="new-password"
                  required
                  minLength={remote ? 5 : 6}
                  maxLength={remote ? 20 : 30}
                  aria-describedby="password-help"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-controls="registration-password"
                  aria-pressed={show}
                >
                  {show ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
            <p id="password-help" className="password-help">
              Use entre {remote ? "5 e 20" : "6 e 30"} caracteres. Evite sequências como 123456 e dados
              seus (nome, e-mail, CPF ou celular).
            </p>
            <label className="registration-consent">
              <input type="checkbox" name="adult" required />
              <span>
                Tenho 18 anos ou mais e li e aceito os{" "}
                <Link href="/termos">Termos e Condições</Link>, as{" "}
                <Link href="/termos#regras">Regras de Apostas</Link> e a{" "}
                <Link href="/privacidade">Política de Privacidade</Link>.
              </span>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="registration-submit" disabled={busy}>
              {busy ? "Aguarde…" : "Registre-se"}
            </button>
          </form>
          <p className="registration-login">
            Já tem uma conta?{" "}
            <button
              className="text-button"
              onClick={() => openModal({ kind: "login" })}
            >
              Login
            </button>
          </p>
          <p className="demo-note">Demonstração local. Use dados fictícios.</p>
        </div>
        <RecaptchaNote />
      </Dialog>
    );
  return (
    <Dialog title={title} className="login-dialog" onClose={closeModal}>
      <h2>{title}</h2>
      <form onSubmit={submit}>
        <label className="field">
          <span className="sr-only">Usuário ou endereço de e-mail</span>
          <input
            name="identifier"
            type={forgot ? "email" : "text"}
            placeholder="Usuário ou endereço de e-mail"
            autoComplete="username"
            required
            maxLength={254}
            aria-describedby={error ? "auth-error" : undefined}
          />
        </label>
        {!forgot && (
          <label className="field">
            <span className="sr-only">Senha</span>
            <input
              name="password"
              type="password"
              placeholder="Senha"
              autoComplete="current-password"
              required
              minLength={6}
              maxLength={128}
            />
          </label>
        )}
        {error && (
          <p className="form-error" role="alert" id="auth-error">
            {error}
          </p>
        )}
        <button className="button button-accent full-width" disabled={busy}>
          {busy ? "Aguarde…" : title}
        </button>
      </form>
      <div className="login-links">
        <button
          className="login-register"
          onClick={() => openModal({ kind: "register" })}
        >
          Registre-se
        </button>
        <span className="login-recovery">
          <button onClick={() => openModal({ kind: "forgot" })}>
            Esqueceu sua senha?
          </button>
        </span>
      </div>
      <p className="login-responsible">
        <Link href="/jogo-responsavel">Jogue com responsabilidade</Link>
      </p>
      <RecaptchaNote />
      <button className="demo-explore" disabled={busy || remote} onClick={explore}>
        Explorar demonstração
      </button>
    </Dialog>
  );
}
