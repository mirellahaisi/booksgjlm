import { describe, expect, it } from 'vitest';
import { pbkdf2Sync } from 'node:crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  hashPassword,
  loginLocal,
  logoutLocal,
  registerLocal,
  restoreLocalSession,
  validateCredentials,
} from '../src/services/localAuth';

describe('cadastro e sessão local', () => {
  it('deriva o mesmo PBKDF2-SHA256 da implementação independente do Node', async () => {
    const expected = pbkdf2Sync('Senha123!', 'salt-de-teste', 600000, 32, 'sha256').toString('hex');
    expect(await hashPassword('Senha123!', 'salt-de-teste')).toBe(expected);
  });
  it('salva apenas hash e salt e restaura sessão depois de reabrir', async () => {
    const user = await registerLocal('Leitora', ' LEITORA@example.com ', 'Leitura123!');
    expect(user.email).toBe('leitora@example.com');
    const saved = await AsyncStorage.getItem('gjlm-books.users.v1');
    expect(saved).not.toContain('Leitura123!');
    expect(JSON.parse(saved!)[0].salt).toHaveLength(64);
    expect(await restoreLocalSession()).toEqual(user);
    await logoutLocal();
    expect(await restoreLocalSession()).toBeNull();
    expect(await loginLocal('LEITORA@example.com', 'Leitura123!')).toEqual(user);
  });
  it('rejeita cadastro duplicado e senha incorreta sem abrir sessão', async () => {
    await registerLocal('Leitora', 'leitora@example.com', 'Leitura123!');
    await logoutLocal();
    await expect(registerLocal('Outra', 'leitora@example.com', 'Leitura456!')).rejects.toThrow(
      'Já existe',
    );
    await expect(loginLocal('leitora@example.com', 'Incorreta123!')).rejects.toThrow(
      'E-mail ou senha incorretos',
    );
    expect(await restoreLocalSession()).toBeNull();
  });
  it('usa salts diferentes para contas com a mesma senha', async () => {
    await registerLocal('Leitora A', 'a@example.com', 'Leitura123!');
    await registerLocal('Leitora B', 'b@example.com', 'Leitura123!');
    const saved = JSON.parse((await AsyncStorage.getItem('gjlm-books.users.v1'))!);
    expect(saved[0].passwordHash).not.toBe(saved[1].passwordHash);
  });
  it('valida e-mail, nome e tamanho da senha', () => {
    expect(() => validateCredentials('inválido', 'Leitura123!')).toThrow('e-mail');
    expect(() => validateCredentials('a@b.com', '123')).toThrow('senha');
    expect(() => validateCredentials('a@b.com', 'Leitura123!', ' ')).toThrow('nome');
  });
});
