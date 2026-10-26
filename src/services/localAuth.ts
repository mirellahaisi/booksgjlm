import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import type { SessionUser } from '../types';
import { UserError } from '../utils/text';
import { secureSession } from './secureSession';

const USERS_KEY = 'gjlm-books.users.v1';
const SESSION_KEY = 'gjlm-books.session.v1';
const ITERATIONS = 600000;
interface Account extends SessionUser {
  salt: string;
  passwordHash: string;
}

export function validateCredentials(email: string, password: string, name?: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    throw new UserError('Informe um e-mail válido.');
  if (password.length < 8 || password.length > 128)
    throw new UserError('A senha deve ter entre 8 e 128 caracteres.');
  if (name !== undefined && (name.trim().length < 2 || name.trim().length > 60))
    throw new UserError('Seu nome deve ter entre 2 e 60 caracteres.');
}

export async function hashPassword(password: string, salt: string) {
  return bytesToHex(
    await pbkdf2Async(sha256, password, salt, { c: ITERATIONS, dkLen: 32, asyncTick: 10 }),
  );
}

function publicUser(account: Account): SessionUser {
  return { id: account.id, name: account.name, email: account.email, provider: 'local' };
}

async function accounts(): Promise<Account[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (
    !Array.isArray(parsed) ||
    parsed.some((a) => !a.id || !a.email || !a.salt || !a.passwordHash)
  ) {
    throw new Error('Cadastro local inválido.');
  }
  return parsed;
}

export async function registerLocal(
  name: string,
  email: string,
  password: string,
): Promise<SessionUser> {
  validateCredentials(email, password, name);
  const normalizedEmail = email.trim().toLowerCase();
  const saved = await accounts();
  if (saved.some((a) => a.email === normalizedEmail))
    throw new UserError('Já existe uma conta com este e-mail. Entre com sua senha.');
  const salt = bytesToHex(await Crypto.getRandomBytesAsync(32));
  const account: Account = {
    id: Crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    provider: 'local',
    salt,
    passwordHash: await hashPassword(password, salt),
  };
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify([...saved, account]));
  await secureSession.set(SESSION_KEY, account.id);
  return publicUser(account);
}

export async function loginLocal(email: string, password: string): Promise<SessionUser> {
  validateCredentials(email, password);
  const account = (await accounts()).find((a) => a.email === email.trim().toLowerCase());
  if (!account) throw new UserError('E-mail ou senha incorretos.');
  const hash = await hashPassword(password, account.salt);
  let difference = hash.length ^ account.passwordHash.length;
  for (let i = 0; i < hash.length; i++)
    difference |= hash.charCodeAt(i) ^ account.passwordHash.charCodeAt(i);
  if (difference !== 0) throw new UserError('E-mail ou senha incorretos.');
  await secureSession.set(SESSION_KEY, account.id);
  return publicUser(account);
}

export async function restoreLocalSession(): Promise<SessionUser | null> {
  const id = await secureSession.get(SESSION_KEY);
  if (!id) return null;
  const account = (await accounts()).find((a) => a.id === id);
  if (!account) {
    await secureSession.remove(SESSION_KEY);
    return null;
  }
  return publicUser(account);
}

export const logoutLocal = () => secureSession.remove(SESSION_KEY);
