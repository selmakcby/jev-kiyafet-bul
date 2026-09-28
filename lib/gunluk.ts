// Sunucu tarafı yapılandırılmış günlük. Kullanıcı metni ve anahtar YAZILMAZ.
export function gunlukYaz(olay: string, alanlar: Readonly<Record<string, string | number | boolean>>): void {
  if (process.env.NODE_ENV === 'test') return;
  process.stdout.write(`${JSON.stringify({ zaman: new Date().toISOString(), olay, ...alanlar })}\n`);
}
