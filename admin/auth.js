/**
 * auth.js — Proteção de Acesso ao Painel CMS
 * Rafael França Advocacia
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
  // Hash SHA-256 da senha padrão: @Rafa@26
  // Para trocar a senha, chame CMS_AUTH.setPassword('nova') no console
  const STORED_HASH_KEY = 'rafaelCMS_auth_hash';
  const SESSION_KEY     = 'rafaelCMS_auth_ok';
  const ATTEMPT_KEY     = 'rafaelCMS_auth_attempts';
  const LOCKOUT_KEY     = 'rafaelCMS_auth_lockout';
  const MAX_ATTEMPTS    = 5;
  const LOCKOUT_MS      = 30 * 60 * 1000; // 30 minutos

  // Hash SHA-256 de "@Rafa@26" (padrão de fábrica)
  const DEFAULT_HASH = '28261c4032ad4b422977d24188d39473295f0a09843378ed297b9871fe3d45d5';

  // ─── UTILS ──────────────────────────────────────────────
  function sha256Fallback(str) {
    var chs = function(x, y, z) { return (x & y) ^ (~x & z); };
    var maj = function(x, y, z) { return (x & y) ^ (x & z) ^ (y & z); };
    var rotateRight = function(n, x) { return (x >>> n) | (x << (32 - n)); };
    var Sigma0 = function(x) { return rotateRight(2, x) ^ rotateRight(13, x) ^ rotateRight(22, x); };
    var Sigma1 = function(x) { return rotateRight(6, x) ^ rotateRight(11, x) ^ rotateRight(25, x); };
    var sigma0 = function(x) { return rotateRight(7, x) ^ rotateRight(18, x) ^ (x >>> 3); };
    var sigma1 = function(x) { return rotateRight(17, x) ^ rotateRight(19, x) ^ (x >>> 10); };

    var k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    var hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    var msg = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 128) {
        msg.push(c);
      } else if (c < 2048) {
        msg.push((c >> 6) | 192);
        msg.push((c & 63) | 128);
      } else {
        msg.push((c >> 12) | 224);
        msg.push(((c >> 6) & 63) | 128);
        msg.push((c & 63) | 128);
      }
    }

    var l = msg.length;
    msg.push(0x80);
    while ((msg.length + 8) % 64 !== 0) msg.push(0);
    
    var bits = l * 8;
    var lenBytes = new Array(8);
    for (var i = 7; i >= 0; i--) {
      lenBytes[i] = bits & 0xff;
      bits >>>= 8;
    }
    msg = msg.concat(lenBytes);

    for (var chunkStart = 0; chunkStart < msg.length; chunkStart += 64) {
      var w = new Array(64);
      for (var i = 0; i < 16; i++) {
        var pos = chunkStart + i * 4;
        w[i] = (msg[pos] << 24) | (msg[pos + 1] << 16) | (msg[pos + 2] << 8) | msg[pos + 3];
      }
      for (var i = 16; i < 64; i++) {
        w[i] = (sigma1(w[i - 2]) + w[i - 7] + sigma0(w[i - 15]) + w[i - 16]) | 0;
      }

      var a = hash[0], b = hash[1], c = hash[2], d = hash[3];
      var e = hash[4], f = hash[5], g = hash[6], h = hash[7];

      for (var i = 0; i < 64; i++) {
        var T1 = (h + Sigma1(e) + chs(e, f, g) + k[i] + w[i]) | 0;
        var T2 = (Sigma0(a) + maj(a, b, c)) | 0;
        h = g;
        g = f;
        f = e;
        e = (d + T1) | 0;
        d = c;
        c = b;
        b = a;
        a = (T1 + T2) | 0;
      }

      hash[0] = (hash[0] + a) | 0;
      hash[1] = (hash[1] + b) | 0;
      hash[2] = (hash[2] + c) | 0;
      hash[3] = (hash[3] + d) | 0;
      hash[4] = (hash[4] + e) | 0;
      hash[5] = (hash[5] + f) | 0;
      hash[6] = (hash[6] + g) | 0;
      hash[7] = (hash[7] + h) | 0;
    }

    var result = "";
    for (var i = 0; i < 8; i++) {
      var hex = (hash[i] >>> 0).toString(16);
      result += hex.padStart(8, '0');
    }
    return result;
  }

  async function sha256(str) {
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
      try {
        const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        console.warn('Web Crypto API falhou, usando fallback em JS puro.', e);
      }
    }
    return sha256Fallback(str);
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
