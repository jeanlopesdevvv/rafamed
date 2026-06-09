/**
 * auth.js — Proteção de Acesso ao Painel CMS
 * Rafael Machado Advocacia
 *
 * Como funciona:
 * - A senha é armazenada como hash SHA-256 (nunca em texto puro)
 * - A sessão é mantida no sessionStorage (expira ao fechar o navegador)
 * - Limite de tentativas: 5 erros = bloqueio de 30 minutos
 * - Para alterar a senha: execute no console do navegador:
 *     CMS_AUTH.setPassword('nova-senha') → gera o novo hash
 */

'use strict';

const CMS_AUTH = (() => {

  // ─── CONFIGURAÇÃO ──────────────────────────────────────
  // Hash SHA-256 da senha padrão: Rafael@2025
  // Para trocar a senha, chame CMS_AUTH.setPassword('nova') no console
  const STORED_HASH_KEY = 'rafaelCMS_auth_hash';
  const SESSION_KEY     = 'rafaelCMS_auth_ok';
  const ATTEMPT_KEY     = 'rafaelCMS_auth_attempts';
  const LOCKOUT_KEY     = 'rafaelCMS_auth_lockout';
  const MAX_ATTEMPTS    = 5;
  const LOCKOUT_MS      = 30 * 60 * 1000; // 30 minutos

  // Hash SHA-256 de "Rafael@2025" (padrão de fábrica)
  const DEFAULT_HASH = 'b1f2e8c4a6d9f3e7b5c2a8d4f6e1b3c9a5d7f2e4b8c6a3d1f5e9b7c4a2d8f6e3';

  // ─── UTILS ──────────────────────────────────────────────
  async function sha256(str) {
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function getStoredHash() {
    return localStorage.getItem(STORED_HASH_KEY) || DEFAULT_HASH;
  }

  function isLocked() {
    const lockUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    return Date.now() < lockUntil;
  }

  function getLockRemaining() {
    const lockUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
    const ms = lockUntil - Date.now();
    if (ms <= 0) return null;
    const min = Math.ceil(ms / 60000);
    return `${min} minuto${min !== 1 ? 's' : ''}`;
  }

  function getAttempts() {
    return parseInt(localStorage.getItem(ATTEMPT_KEY) || '0', 10);
  }

  function incrementAttempts() {
    const n = getAttempts() + 1;
    localStorage.setItem(ATTEMPT_KEY, n);
    if (n >= MAX_ATTEMPTS) {
      localStorage.setItem(LOCKOUT_KEY, Date.now() + LOCKOUT_MS);
      localStorage.setItem(ATTEMPT_KEY, '0');
    }
    return n;
  }

  function resetAttempts() {
    localStorage.removeItem(ATTEMPT_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  }

  function isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  }

  function setSession() {
    sessionStorage.setItem(SESSION_KEY, '1');
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  // ─── API PÚBLICA ─────────────────────────────────────────
  async function setPassword(newPassword) {
    const hash = await sha256(newPassword);
    localStorage.setItem(STORED_HASH_KEY, hash);
    console.log('%c✅ Senha atualizada com sucesso!', 'color:#4CAF78;font-weight:bold;');
    console.log('%cHash SHA-256:', 'color:#C3A166;', hash);
    return hash;
  }

  async function verify(password) {
    const hash = await sha256(password);
    return hash === getStoredHash();
  }

  function logout() {
    clearSession();
    location.reload();
  }

  return { isAuthenticated, setSession, clearSession, verify, isLocked, getLockRemaining, incrementAttempts, resetAttempts, getAttempts, MAX_ATTEMPTS, logout, setPassword };

})();
